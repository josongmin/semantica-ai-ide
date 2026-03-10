import { isServerEvent, isServerEventBatch } from "../types";

// ---------------------------------------------------------------------------
// Minimal valid fixture objects – just enough to satisfy type guards
// ---------------------------------------------------------------------------

const validMsg = {
  id: "m1",
  role: "user",
  text: "",
  status: "final",
  created_at_ms: 0,
};

const validTurn = {
  id: "t1",
  phases: [],
  status: "pending",
  created_at_ms: 0,
};

const validToolCall = {
  id: "tc1",
  turn_id: "t1",
  tool_name: "bash",
  category: "terminal",
  args_summary: "",
  status: "pending",
};

const validFileChange = {
  file_path: "src/foo.ts",
  turn_id: "t1",
  status: "modified",
  insertions: 0,
  deletions: 0,
  approval_status: "pending",
};

// ---------------------------------------------------------------------------
// isServerEvent
// ---------------------------------------------------------------------------

describe("isServerEvent", () => {
  // ── Falsy / non-object inputs ────────────────────────────────────────────

  it("returns false for null", () => {
    expect(isServerEvent(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isServerEvent(undefined)).toBe(false);
  });

  it("returns false for a string", () => {
    expect(isServerEvent("UPSERT_MESSAGE")).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isServerEvent(42)).toBe(false);
  });

  it("returns false for a boolean", () => {
    expect(isServerEvent(true)).toBe(false);
  });

  it("returns false for an array", () => {
    expect(isServerEvent([])).toBe(false);
  });

  // ── Unknown / missing discriminant ──────────────────────────────────────

  it("returns false for an empty object", () => {
    expect(isServerEvent({})).toBe(false);
  });

  it("returns false for an object with an unknown t value", () => {
    expect(isServerEvent({ t: "UNKNOWN_SERVER_EVENT" })).toBe(false);
  });

  it("returns false when t is missing entirely", () => {
    expect(isServerEvent({ msg: validMsg })).toBe(false);
  });

  // ── UPSERT_MESSAGE ───────────────────────────────────────────────────────

  it("returns true for a valid UPSERT_MESSAGE serverEvent", () => {
    expect(isServerEvent({ t: "UPSERT_MESSAGE", msg: validMsg })).toBe(true);
  });

  it("returns false for UPSERT_MESSAGE with null msg", () => {
    expect(isServerEvent({ t: "UPSERT_MESSAGE", msg: null })).toBe(false);
  });

  it("returns false for UPSERT_MESSAGE with string msg", () => {
    expect(isServerEvent({ t: "UPSERT_MESSAGE", msg: "hello" })).toBe(false);
  });

  it("returns false for UPSERT_MESSAGE without msg", () => {
    expect(isServerEvent({ t: "UPSERT_MESSAGE" })).toBe(false);
  });

  // ── APPEND_TEXT ──────────────────────────────────────────────────────────

  it("returns true for a valid APPEND_TEXT serverEvent", () => {
    expect(isServerEvent({ t: "APPEND_TEXT", id: "m1", chunk: "hello" })).toBe(true);
  });

  it("returns false for APPEND_TEXT without id", () => {
    expect(isServerEvent({ t: "APPEND_TEXT", chunk: "hello" })).toBe(false);
  });

  it("returns false for APPEND_TEXT with numeric id", () => {
    expect(isServerEvent({ t: "APPEND_TEXT", id: 1, chunk: "hello" })).toBe(false);
  });

  it("returns false for APPEND_TEXT without chunk", () => {
    expect(isServerEvent({ t: "APPEND_TEXT", id: "m1" })).toBe(false);
  });

  it("returns false for APPEND_TEXT with numeric chunk", () => {
    expect(isServerEvent({ t: "APPEND_TEXT", id: "m1", chunk: 99 })).toBe(false);
  });

  // ── UPSERT_TURN ──────────────────────────────────────────────────────────

  it("returns true for a valid UPSERT_TURN serverEvent", () => {
    expect(isServerEvent({ t: "UPSERT_TURN", turn: validTurn })).toBe(true);
  });

  it("returns false for UPSERT_TURN with null turn", () => {
    expect(isServerEvent({ t: "UPSERT_TURN", turn: null })).toBe(false);
  });

  it("returns false for UPSERT_TURN without turn", () => {
    expect(isServerEvent({ t: "UPSERT_TURN" })).toBe(false);
  });

  // ── UPSERT_TOOL_CALL ─────────────────────────────────────────────────────

  it("returns true for a valid UPSERT_TOOL_CALL serverEvent", () => {
    expect(isServerEvent({ t: "UPSERT_TOOL_CALL", tool_call: validToolCall })).toBe(true);
  });

  it("returns false for UPSERT_TOOL_CALL with null tool_call", () => {
    expect(isServerEvent({ t: "UPSERT_TOOL_CALL", tool_call: null })).toBe(false);
  });

  it("returns false for UPSERT_TOOL_CALL without tool_call", () => {
    expect(isServerEvent({ t: "UPSERT_TOOL_CALL" })).toBe(false);
  });

  // ── UPSERT_FILE_CHANGE ───────────────────────────────────────────────────

  it("returns true for a valid UPSERT_FILE_CHANGE serverEvent", () => {
    expect(isServerEvent({ t: "UPSERT_FILE_CHANGE", file_change: validFileChange })).toBe(true);
  });

  it("returns false for UPSERT_FILE_CHANGE with null file_change", () => {
    expect(isServerEvent({ t: "UPSERT_FILE_CHANGE", file_change: null })).toBe(false);
  });

  it("returns false for UPSERT_FILE_CHANGE without file_change", () => {
    expect(isServerEvent({ t: "UPSERT_FILE_CHANGE" })).toBe(false);
  });

  // ── ServerEvent types with no payload validation (default branch) ─────────────

  it("returns true for SET_PROGRESS", () => {
    expect(isServerEvent({ t: "SET_PROGRESS", key: "k", value: 50 })).toBe(true);
  });

  it("returns true for SET_DIFF_LOADED", () => {
    expect(isServerEvent({ t: "SET_DIFF_LOADED", id: "m1", diff_text: "@@" })).toBe(true);
  });

  it("returns true for SET_MESSAGE_STATUS", () => {
    expect(isServerEvent({ t: "SET_MESSAGE_STATUS", id: "m1", status: "final" })).toBe(true);
  });

  it("returns true for UPDATE_TURN_PHASE", () => {
    expect(isServerEvent({ t: "UPDATE_TURN_PHASE", turn_id: "t1", phase: "thinking", entry: {} })).toBe(
      true,
    );
  });

  it("returns true for UPDATE_TOOL_CALL_STATUS", () => {
    expect(isServerEvent({ t: "UPDATE_TOOL_CALL_STATUS", id: "tc1", status: "success" })).toBe(true);
  });

  it("returns true for SET_SESSION_META", () => {
    expect(isServerEvent({ t: "SET_SESSION_META", meta: {} })).toBe(true);
  });

  it("returns true for ADD_CHECKPOINT", () => {
    expect(
      isServerEvent({
        t: "ADD_CHECKPOINT",
        checkpoint: { id: "cp1", turn_id: "t1", label: "l", timestamp_ms: 0 },
      }),
    ).toBe(true);
  });

  it("returns true for PUSH_TIMELINE", () => {
    expect(
      isServerEvent({
        t: "PUSH_TIMELINE",
        event: { id: "e1", turn_id: "t1", type: "phase_changed", timestamp_ms: 0, summary: "" },
      }),
    ).toBe(true);
  });

  it("returns true for SET_APPROVAL_MODE", () => {
    expect(isServerEvent({ t: "SET_APPROVAL_MODE", mode: "auto" })).toBe(true);
  });

  it("returns true for REQUEST_TOOL_APPROVAL", () => {
    expect(
      isServerEvent({
        t: "REQUEST_TOOL_APPROVAL",
        tool_call_id: "tc1",
        action_id: "a1",
        risk_level: "moderate",
        description: "run bash",
      }),
    ).toBe(true);
  });

  it("returns true for SET_TOOL_OUTPUT", () => {
    expect(isServerEvent({ t: "SET_TOOL_OUTPUT", id: "tc1", output: {} })).toBe(true);
  });

  it("returns true for SET_SESSION_LIST", () => {
    expect(isServerEvent({ t: "SET_SESSION_LIST", sessions: [] })).toBe(true);
  });

  it("returns true for SET_CURRENT_PAGE", () => {
    expect(isServerEvent({ t: "SET_CURRENT_PAGE", page: "chat" })).toBe(true);
  });

  it("returns true for SET_AVAILABLE_MODELS", () => {
    expect(isServerEvent({ t: "SET_AVAILABLE_MODELS", models: [] })).toBe(true);
  });

  it("returns true for SET_PROJECT_FILES", () => {
    expect(isServerEvent({ t: "SET_PROJECT_FILES", files: [] })).toBe(true);
  });

  it("returns true for SET_THINKING_MODE", () => {
    expect(isServerEvent({ t: "SET_THINKING_MODE", enabled: true })).toBe(true);
  });

  it("returns true for SET_FAST_MODE", () => {
    expect(isServerEvent({ t: "SET_FAST_MODE", enabled: false })).toBe(true);
  });

  it("returns true for RESET_STORES", () => {
    expect(isServerEvent({ t: "RESET_STORES" })).toBe(true);
  });

  it("returns true for NOP", () => {
    expect(isServerEvent({ t: "NOP" })).toBe(true);
  });

  // ── SET_USAGE_STATS ─────────────────────────────────────────────────────

  it("returns true for a valid SET_USAGE_STATS serverEvent", () => {
    expect(
      isServerEvent({
        t: "SET_USAGE_STATS",
        stats: { total_sessions: 5, total_cost_usd: 1.5, total_tokens: 250000, per_model: [] },
      }),
    ).toBe(true);
  });

  it("returns false for SET_USAGE_STATS with null stats", () => {
    expect(isServerEvent({ t: "SET_USAGE_STATS", stats: null })).toBe(false);
  });

  it("returns false for SET_USAGE_STATS without stats", () => {
    expect(isServerEvent({ t: "SET_USAGE_STATS" })).toBe(false);
  });

  // ── SET_GANTT_ENTRIES ───────────────────────────────────────────────────

  it("returns true for a valid SET_GANTT_ENTRIES serverEvent", () => {
    expect(isServerEvent({ t: "SET_GANTT_ENTRIES", entries: [] })).toBe(true);
  });

  it("returns true for SET_GANTT_ENTRIES with populated entries", () => {
    expect(
      isServerEvent({
        t: "SET_GANTT_ENTRIES",
        entries: [
          {
            id: "g1",
            tool_name: "read_file",
            start_ms: 0,
            end_ms: 100,
            status: "success",
            tool_type: "read",
          },
        ],
      }),
    ).toBe(true);
  });

  it("returns false for SET_GANTT_ENTRIES without entries", () => {
    expect(isServerEvent({ t: "SET_GANTT_ENTRIES" })).toBe(false);
  });

  it("returns false for SET_GANTT_ENTRIES with non-array entries", () => {
    expect(isServerEvent({ t: "SET_GANTT_ENTRIES", entries: {} })).toBe(false);
  });

  // ── SET_THREE_WAY_DIFF ──────────────────────────────────────────────────

  it("returns true for a valid SET_THREE_WAY_DIFF serverEvent", () => {
    expect(
      isServerEvent({
        t: "SET_THREE_WAY_DIFF",
        data: {
          file_path: "src/app.ts",
          base_content: "a",
          agent_content: "b",
          current_content: "c",
          conflicts: [],
        },
      }),
    ).toBe(true);
  });

  it("returns false for SET_THREE_WAY_DIFF with null data", () => {
    expect(isServerEvent({ t: "SET_THREE_WAY_DIFF", data: null })).toBe(false);
  });

  it("returns false for SET_THREE_WAY_DIFF without data", () => {
    expect(isServerEvent({ t: "SET_THREE_WAY_DIFF" })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isServerEventBatch
// ---------------------------------------------------------------------------

describe("isServerEventBatch", () => {
  // ── Valid batch ──────────────────────────────────────────────────────────

  it("returns true for a valid batch with empty serverEvents array", () => {
    expect(
      isServerEventBatch({ type: "SERVER_EVENT_BATCH", batch_id: "b1", created_at_ms: 123, serverEvents: [] }),
    ).toBe(true);
  });

  it("returns true for a batch with populated serverEvents", () => {
    expect(
      isServerEventBatch({
        type: "SERVER_EVENT_BATCH",
        batch_id: "b2",
        created_at_ms: 456,
        serverEvents: [{ t: "NOP" }],
      }),
    ).toBe(true);
  });

  // ── Missing / wrong type field ───────────────────────────────────────────

  it("returns false when type is missing", () => {
    expect(isServerEventBatch({ batch_id: "b1", created_at_ms: 123, serverEvents: [] })).toBe(false);
  });

  it("returns false when type is wrong string", () => {
    expect(isServerEventBatch({ type: "BATCH", batch_id: "b1", created_at_ms: 123, serverEvents: [] })).toBe(
      false,
    );
  });

  it("returns false when type is null", () => {
    expect(isServerEventBatch({ type: null, batch_id: "b1", created_at_ms: 123, serverEvents: [] })).toBe(
      false,
    );
  });

  // ── Missing / wrong batch_id ─────────────────────────────────────────────

  it("returns false when batch_id is missing", () => {
    expect(isServerEventBatch({ type: "SERVER_EVENT_BATCH", created_at_ms: 123, serverEvents: [] })).toBe(false);
  });

  it("returns false when batch_id is a number", () => {
    expect(isServerEventBatch({ type: "SERVER_EVENT_BATCH", batch_id: 1, created_at_ms: 123, serverEvents: [] })).toBe(
      false,
    );
  });

  // ── Missing / wrong created_at_ms ────────────────────────────────────────

  it("returns false when created_at_ms is missing", () => {
    expect(isServerEventBatch({ type: "SERVER_EVENT_BATCH", batch_id: "b1", serverEvents: [] })).toBe(false);
  });

  it("returns false when created_at_ms is a string", () => {
    expect(
      isServerEventBatch({ type: "SERVER_EVENT_BATCH", batch_id: "b1", created_at_ms: "123", serverEvents: [] }),
    ).toBe(false);
  });

  // ── Missing / wrong serverEvents ────────────────────────────────────────────────

  it("returns false when serverEvents is missing", () => {
    expect(isServerEventBatch({ type: "SERVER_EVENT_BATCH", batch_id: "b1", created_at_ms: 123 })).toBe(false);
  });

  it("returns false when serverEvents is an object (not an array)", () => {
    expect(
      isServerEventBatch({ type: "SERVER_EVENT_BATCH", batch_id: "b1", created_at_ms: 123, serverEvents: {} }),
    ).toBe(false);
  });

  it("returns false when serverEvents is null", () => {
    expect(
      isServerEventBatch({ type: "SERVER_EVENT_BATCH", batch_id: "b1", created_at_ms: 123, serverEvents: null }),
    ).toBe(false);
  });

  it("returns false when serverEvents is a string", () => {
    expect(
      isServerEventBatch({ type: "SERVER_EVENT_BATCH", batch_id: "b1", created_at_ms: 123, serverEvents: "[]" }),
    ).toBe(false);
  });

  // ── Falsy / non-object inputs ────────────────────────────────────────────

  it("returns false for null", () => {
    expect(isServerEventBatch(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isServerEventBatch(undefined)).toBe(false);
  });

  it("returns false for a string", () => {
    expect(isServerEventBatch("SERVER_EVENT_BATCH")).toBe(false);
  });

  it("returns false for a number", () => {
    expect(isServerEventBatch(0)).toBe(false);
  });

  it("returns false for an empty object", () => {
    expect(isServerEventBatch({})).toBe(false);
  });
});
