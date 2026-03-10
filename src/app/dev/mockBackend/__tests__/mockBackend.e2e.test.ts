/**
 * Mock Backend E2E runtime test.
 *
 * Verifies that all handler flows actually work at runtime,
 * not just type-check.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ServerEvent, SessionId } from "../../../../shared/protocol";

// Capture events posted via window.postMessage
const captured: ServerEvent[] = [];

// Mock window.postMessage before importing handlers
vi.stubGlobal("window", {
  postMessage: (data: unknown) => {
    if (data && typeof data === "object" && "t" in data) {
      captured.push(data as ServerEvent);
    }
    if (
      data &&
      typeof data === "object" &&
      "type" in data &&
      (data as { type: string }).type === "SERVER_EVENT_BATCH"
    ) {
      const batch = data as unknown as { serverEvents: ServerEvent[] };
      captured.push(...batch.serverEvents);
    }
  },
  location: { search: "" },
  addEventListener: vi.fn(),
});

// Now import after globals are set
const { handleMessage } = await import("../handlers");
const { createSeedServerEvents } = await import("../scenarioSeed");
const { classifyIntent, pickResponse, toProtoClassification } = await import("../responsePool");

function flush() {
  captured.length = 0;
}

function hasEvent(t: string): boolean {
  return captured.some((e) => e.t === t);
}

describe("Mock Backend E2E", () => {
  beforeEach(() => flush());

  // ── Seed ─────────────────────────────────────────────────
  describe("scenarioSeed", () => {
    it("creates valid seed server events", () => {
      const seeds = createSeedServerEvents();
      expect(seeds.length).toBeGreaterThan(5);

      const types = seeds.map((s) => s.t);
      expect(types).toContain("SET_SESSION_META");
      expect(types).toContain("SET_AVAILABLE_MODELS");
      expect(types).toContain("SET_CURRENT_PAGE");
      expect(types).toContain("SET_PROJECT_FILES");
    });
  });

  // ── Classification ───────────────────────────────────────
  describe("classifyIntent", () => {
    it("classifies all 9 intent types", () => {
      const cases: [string, string][] = [
        ["explain this code", "Q_INFO"],
        ["find the config file", "Q_LOCATE"],
        ["debug the crash", "Q_DIAG"],
        ["fix the login bug", "Q_FIX"],
        ["refactor this function", "Q_REFACTOR"],
        ["check for xss vulnerabilities", "Q_SEC"],
        ["optimize query performance", "Q_PERF"],
        ["write unit tests", "Q_SPEC"],
        ["migrate to React 18", "Q_MIGRATE"],
      ];
      for (const [text, expected] of cases) {
        expect(classifyIntent(text).intent).toBe(expected);
      }
    });

    it("handles empty string", () => {
      expect(classifyIntent("").intent).toBe("Q_INFO");
    });

    it("handles Korean text", () => {
      expect(classifyIntent("이 코드 설명해줘").intent).toBe("Q_INFO");
      expect(classifyIntent("버그 수정해줘").intent).toBe("Q_FIX");
      expect(classifyIntent("보안 점검해줘").intent).toBe("Q_SEC");
    });

    it("detects production risk", () => {
      expect(classifyIntent("fix production database").risk).toBe("R3");
      expect(classifyIntent("update payment logic").risk).toBe("R4");
    });

    it("maps to protocol types correctly", () => {
      const c = classifyIntent("fix the bug");
      const proto = toProtoClassification(c);
      expect(proto.intent_type).toBe("bug_fix");
      expect(["safe", "moderate", "dangerous"]).toContain(proto.risk_level);
      expect(["trivial", "small", "medium", "large", "epic"]).toContain(proto.change_size);
      expect(["low", "medium", "high"]).toContain(proto.uncertainty);
    });
  });

  // ── Response Pool ────────────────────────────────────────
  describe("pickResponse", () => {
    it("returns responses for all intent-triggering texts", () => {
      const texts = [
        "explain the code",
        "find where it is",
        "debug the error",
        "fix the bug",
        "refactor this",
        "check security",
        "optimize performance",
        "write tests",
        "migrate to v2",
      ];
      for (const text of texts) {
        const r = pickResponse(text);
        expect(r.text.length).toBeGreaterThan(10);
        expect(r.intent).toBeTruthy();
        expect(r.risk).toBeTruthy();
      }
    });
  });

  // ── Core Handlers ────────────────────────────────────────
  describe("SEND_MESSAGE", () => {
    it("emits user message + thinking + streaming phases (general pipeline)", async () => {
      // Use a text that doesn't match any workflow keyword → falls through to general pipeline
      handleMessage({
        type: "SEND_MESSAGE",
        text: "make a change to the code",
        turn_id: "t1",
        message_id: "m1",
      });
      await new Promise((r) => setTimeout(r, 3000));

      expect(hasEvent("SET_SESSION_META")).toBe(true);
      expect(hasEvent("UPSERT_MESSAGE")).toBe(true);
      expect(hasEvent("UPSERT_TURN")).toBe(true);
      expect(hasEvent("UPDATE_TURN_PHASE")).toBe(true);
      expect(hasEvent("APPEND_TEXT")).toBe(true);
      expect(hasEvent("SET_MESSAGE_STATUS")).toBe(true);
      expect(hasEvent("SET_INPUT_GATE_RESULT")).toBe(true);
    }, 10000);

    it("routes to keyword-matched workflow (explain)", async () => {
      flush();
      handleMessage({
        type: "SEND_MESSAGE",
        text: "explain this code",
        turn_id: "t1b",
        message_id: "m1b",
      });
      await new Promise((r) => setTimeout(r, 5000));

      expect(hasEvent("SET_SESSION_META")).toBe(true);
      expect(hasEvent("UPSERT_MESSAGE")).toBe(true);
      expect(hasEvent("UPSERT_TURN")).toBe(true);
      expect(hasEvent("APPEND_TEXT")).toBe(true);
      // Explain workflow does NOT emit SET_INPUT_GATE_RESULT (lightweight path)
      expect(hasEvent("SET_INPUT_GATE_RESULT")).toBe(false);
    }, 10000);
  });

  describe("STOP_AGENT", () => {
    it("stops streaming and sets idle", async () => {
      flush();
      handleMessage({ type: "SEND_MESSAGE", text: "long task", turn_id: "t2", message_id: "m2" });
      await new Promise((r) => setTimeout(r, 300));

      flush();
      handleMessage({ type: "STOP_AGENT" });
      await new Promise((r) => setTimeout(r, 500));

      expect(hasEvent("SET_SESSION_META")).toBe(true);
    }, 5000);
  });

  describe("NEW_SESSION", () => {
    it("resets stores and creates new session", () => {
      handleMessage({ type: "NEW_SESSION" });
      expect(hasEvent("RESET_STORES")).toBe(true);
      expect(hasEvent("SET_SESSION_META")).toBe(true);
      expect(hasEvent("SET_AVAILABLE_MODELS")).toBe(true);
    });
  });

  // ── Settings ─────────────────────────────────────────────
  describe("Settings handlers", () => {
    it("SET_APPROVAL_MODE emits batch", () => {
      handleMessage({ type: "SET_APPROVAL_MODE", mode: "auto" });
      expect(hasEvent("SET_APPROVAL_MODE")).toBe(true);
      expect(hasEvent("SET_SESSION_META")).toBe(true);
    });

    it("SWITCH_MODEL updates meta", () => {
      flush();
      handleMessage({ type: "SWITCH_MODEL", model_id: "claude-sonnet-4-6" });
      expect(hasEvent("SET_SESSION_META")).toBe(true);
    });

    it("REQUEST_PROJECT_FILES returns files", () => {
      flush();
      handleMessage({ type: "REQUEST_PROJECT_FILES" });
      expect(hasEvent("SET_PROJECT_FILES")).toBe(true);
    });
  });

  // ── Feature Handlers (noop-free) ─────────────────────────
  describe("Feature handlers emit events", () => {
    const cases: [string, Record<string, unknown>, string][] = [
      ["SAVE_MEMORY_RULE", { content: "rule", source: "user" }, "UPSERT_MEMORY_RULE"],
      ["TOGGLE_MEMORY_RULE", { rule_id: "r1", active: false }, "UPSERT_MEMORY_RULE"],
      ["LINK_TICKET", { ticket_key: "P-1", platform: "linear" }, "SET_LINKED_TICKET"],
      ["SYNC_TICKET_STATUS", { ticket_id: "t1" }, "SET_LINKED_TICKET"],
      ["SPAWN_AGENT", { label: "test" }, "UPSERT_AGENT_INSTANCE"],
      ["SEND_AGENT_INTERVENTION", { agent_id: "a1", message: "stop" }, "UPDATE_AGENT_STATUS"],
      ["REMOVE_MCP_SERVER", { server_id: "s1" }, "SET_MCP_SERVER_STATUS"],
      ["UNINSTALL_MCP_SERVER", { server_id: "s1" }, "SET_MCP_SERVER_STATUS"],
      ["APPLY_CONFIG_CHOICE", { key: "model", choice: "team" }, "SET_TEAM_CONFIG"],
      ["SEND_INTEGRATION_UPDATE", { connection_id: "c1", message: "hi" }, "SET_INTEGRATIONS"],
      ["LOAD_PROMPT_TEMPLATES", {}, "SET_PROMPT_TEMPLATES"],
      ["CREATE_CONTEXT_SPACE", { name: "test", description: "" }, "SET_CONTEXT_SPACES"],
      ["SAVE_NOTEPAD", { notepad_id: "n1", title: "t", content: "c" }, "SET_NOTEPADS"],
      ["CREATE_SNAPSHOT", { label: "snap" }, "SET_MACHINE_SNAPSHOTS"],
      ["GIT_UNDO_COMMIT", {}, "PUSH_GIT_COMMIT"],
      ["TOGGLE_AUTO_COMMIT", { enabled: true }, "SET_AUTO_COMMIT_ENABLED"],
      [
        "SET_CATEGORY_PERMISSIONS",
        { permissions: [{ category: "read", permission: "allow" }] },
        "SET_CATEGORY_PERMISSIONS",
      ],
    ];

    for (const [msgType, payload, expectedEvent] of cases) {
      it(`${msgType} → ${expectedEvent}`, () => {
        flush();
        handleMessage({ type: msgType, ...payload } as never);
        expect(hasEvent(expectedEvent)).toBe(true);
      });
    }
  });

  // ── Session Management ───────────────────────────────────
  describe("Session management", () => {
    it("LOAD_SESSION_LIST returns sessions", () => {
      flush();
      handleMessage({ type: "LOAD_SESSION_LIST" });
      expect(hasEvent("SET_SESSION_LIST")).toBe(true);
    });

    it("CLEAR_CONVERSATION resets", () => {
      flush();
      handleMessage({ type: "CLEAR_CONVERSATION" });
      expect(hasEvent("RESET_STORES")).toBe(true);
    });

    it("SHARE_SESSION returns link", () => {
      flush();
      handleMessage({
        type: "SHARE_SESSION",
        session_id: "test-session" as SessionId,
        options: {},
      });
      expect(hasEvent("SET_SHARE_LINK")).toBe(true);
    });
  });
});
