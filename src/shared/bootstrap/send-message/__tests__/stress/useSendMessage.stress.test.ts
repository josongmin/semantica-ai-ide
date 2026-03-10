/**
 * Stress & race condition tests for useSendMessage hook.
 *
 * Tests:
 * - Rapid sequential sends (메시지 연속 전송)
 * - Empty/whitespace guard under pressure
 * - Unique ID generation under high concurrency
 * - Message + turn atom consistency after bulk sends
 * - postMessage payload correctness under load
 */
import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { messageAtomFamily, messageOrderAtom } from "~entities/message/core";
import { turnAtomFamily, turnOrderAtom } from "~entities/message/turns";
import { resetIdCounter } from "~shared/lib/mocks";
import type { MessageId, TurnId } from "~shared/protocol";

import { resetSendMessageCounters, useSendMessage } from "../../model/useSendMessage";
// ─── Mocks ─────────────────────────────────────────────────
const mockPostMessage = vi.fn();
vi.mock("~shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

// ─── Helpers ───────────────────────────────────────────────
function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}

function renderSendHook() {
  const store = createStore();
  const { result } = renderHook(() => useSendMessage(), {
    wrapper: createWrapper(store),
  });
  return { store, result };
}

// ─── Lifecycle ─────────────────────────────────────────────
beforeEach(() => {
  mockPostMessage.mockClear();
  resetIdCounter();
  resetSendMessageCounters();
});

// ─── Tests ─────────────────────────────────────────────────
describe("useSendMessage – stress & race conditions", () => {
  // ── Rapid Sequential Sends ─────────────────────────────
  describe("rapid sequential sends", () => {
    it("100 sends: each creates unique message ID and turn ID", () => {
      const { store, result } = renderSendHook();

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.send(`message ${i}`);
        }
      });

      const msgOrder = store.get(messageOrderAtom);
      const turnOrder = store.get(turnOrderAtom);

      expect(msgOrder).toHaveLength(100);
      expect(turnOrder).toHaveLength(100);

      // All IDs should be unique
      expect(new Set(msgOrder).size).toBe(100);
      expect(new Set(turnOrder).size).toBe(100);
    });

    it("100 sends: all postMessage calls have correct payloads", () => {
      const { result } = renderSendHook();

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.send(`msg ${i}`);
        }
      });

      expect(mockPostMessage).toHaveBeenCalledTimes(100);

      for (let i = 0; i < 100; i++) {
        const call = mockPostMessage.mock.calls[i]?.[0];
        expect(call.type).toBe("SEND_MESSAGE");
        expect(call.text).toBe(`msg ${i}`);
        expect(call.message_id).toBeDefined();
        expect(call.turn_id).toBeDefined();
      }

      // All message_ids and turn_ids should be unique across calls
      const msgIds = mockPostMessage.mock.calls.map(
        (c: unknown[]) => (c[0] as { message_id: string }).message_id,
      );
      const turnIds = mockPostMessage.mock.calls.map(
        (c: unknown[]) => (c[0] as { turn_id: string }).turn_id,
      );
      expect(new Set(msgIds).size).toBe(100);
      expect(new Set(turnIds).size).toBe(100);
    });

    it("100 sends: each message has correct text in store", () => {
      const { store, result } = renderSendHook();

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.send(`text_${i}`);
        }
      });

      const msgOrder = store.get(messageOrderAtom);
      for (let i = 0; i < 100; i++) {
        const msgId = msgOrder[i]!;
        const msg = store.get(messageAtomFamily(msgId));
        expect(msg).not.toBeNull();
        expect(msg!.text).toBe(`text_${i}`);
        expect(msg!.role).toBe("user");
        expect(msg!.status).toBe("final");
      }
    });
  });

  // ── Guard Conditions Under Pressure ────────────────────
  describe("guard conditions under pressure", () => {
    it("empty string sends are all silently ignored", () => {
      const { store, result } = renderSendHook();

      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.send("");
        }
      });

      expect(store.get(messageOrderAtom)).toHaveLength(0);
      expect(mockPostMessage).not.toHaveBeenCalled();
    });

    it("whitespace-only sends are all silently ignored", () => {
      const { store, result } = renderSendHook();

      act(() => {
        result.current.send("   ");
        result.current.send("\t\t");
        result.current.send("\n\n");
        result.current.send("  \t\n  ");
      });

      expect(store.get(messageOrderAtom)).toHaveLength(0);
      expect(mockPostMessage).not.toHaveBeenCalled();
    });

    it("mixed valid/invalid sends: only valid ones create messages", () => {
      const { store, result } = renderSendHook();

      act(() => {
        result.current.send(""); // ignored
        result.current.send("valid1"); // created
        result.current.send("   "); // ignored
        result.current.send("valid2"); // created
        result.current.send("\n"); // ignored
        result.current.send("valid3"); // created
      });

      expect(store.get(messageOrderAtom)).toHaveLength(3);
      expect(mockPostMessage).toHaveBeenCalledTimes(3);
    });
  });

  // ── Turn Creation Consistency ──────────────────────────
  describe("turn creation consistency", () => {
    it("each send creates a turn with user_message phase referencing the correct message", () => {
      const { store, result } = renderSendHook();

      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.send(`question ${i}`);
        }
      });

      const turnOrder = store.get(turnOrderAtom);
      const msgOrder = store.get(messageOrderAtom);

      for (let i = 0; i < 20; i++) {
        const turnId = turnOrder[i]!;
        const turn = store.get(turnAtomFamily(turnId));
        expect(turn).not.toBeNull();
        expect(turn?.status).toBe("running");

        // First phase should be user_message containing the message ID
        const userPhase = turn?.phases.find((p) => p.phase === "user_message");
        expect(userPhase).toBeDefined();
        expect(userPhase?.message_ids).toContain(msgOrder[i]);
      }
    });

    it("turn phase summary truncates to 80 chars for long messages", () => {
      const { store, result } = renderSendHook();
      const longText = "A".repeat(200);

      act(() => {
        result.current.send(longText);
      });

      const turnOrder = store.get(turnOrderAtom);
      const turnId0 = turnOrder[0]!;
      const turn = store.get(turnAtomFamily(turnId0));
      const userPhase = turn?.phases.find((p) => p.phase === "user_message");
      expect(userPhase?.summary).toHaveLength(80);
    });
  });

  // ── ID Generation Uniqueness Under Time Pressure ──────
  describe("ID generation uniqueness", () => {
    it("sends at same millisecond produce unique IDs (counter-based disambiguation)", () => {
      const { store, result } = renderSendHook();

      // Mock Date.now to return same value
      const originalNow = Date.now;
      const frozenTime = 1700000000000;
      Date.now = () => frozenTime;

      try {
        act(() => {
          for (let i = 0; i < 50; i++) {
            result.current.send(`same-ms-${i}`);
          }
        });

        const msgOrder = store.get(messageOrderAtom);
        // All IDs unique even with same timestamp
        expect(new Set(msgOrder).size).toBe(50);
      } finally {
        Date.now = originalNow;
      }
    });
  });

  // ── postMessage Payload Integrity ──────────────────────
  describe("postMessage payload integrity", () => {
    it("text is trimmed in postMessage payload", () => {
      const { result } = renderSendHook();

      act(() => {
        result.current.send("  hello world  ");
      });

      expect(mockPostMessage).toHaveBeenCalledTimes(1);
      expect(mockPostMessage.mock.calls[0]?.[0]?.text).toBe("hello world");
    });

    it("message_id and turn_id in postMessage match those in store", () => {
      const { store, result } = renderSendHook();

      act(() => {
        result.current.send("test");
      });

      const payload = mockPostMessage.mock.calls[0]?.[0];
      const msgInStore = store.get(messageAtomFamily(payload.message_id as MessageId));
      const turnInStore = store.get(turnAtomFamily(payload.turn_id as TurnId));

      expect(msgInStore).not.toBeNull();
      expect(msgInStore!.text).toBe("test");
      expect(turnInStore).not.toBeNull();
    });

    it("long text (10,000 chars) passed through postMessage without truncation", () => {
      const { result } = renderSendHook();
      const longText = "X".repeat(10_000);

      act(() => {
        result.current.send(longText);
      });

      expect(mockPostMessage.mock.calls[0]?.[0]?.text).toBe(longText);
      expect(mockPostMessage.mock.calls[0]?.[0]?.text).toHaveLength(10_000);
    });
  });
});
