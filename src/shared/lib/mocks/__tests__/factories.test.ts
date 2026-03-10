import {
  createCheckpoint,
  createFileChange,
  createMessage,
  createSessionMeta,
  createTimelineEvent,
  createToolCall,
  createTurn,
  createTurnPhase,
  resetIdCounter,
} from "../factories";

beforeEach(() => {
  resetIdCounter();
});

// ─── createMessage ──────────────────────────────────────────

describe("createMessage", () => {
  it("returns a valid UiMessage with sensible defaults", () => {
    const msg = createMessage();

    expect(msg.id).toMatch(/^msg_\d+$/);
    expect(msg.role).toBe("assistant");
    expect(msg.status).toBe("final");
    expect(msg.text).toBe("Hello, this is a test message.");
    expect(typeof msg.created_at_ms).toBe("number");
  });

  it("accepts overrides", () => {
    const msg = createMessage({ role: "user", text: "custom" });

    expect(msg.role).toBe("user");
    expect(msg.text).toBe("custom");
    // Non-overridden fields still have defaults
    expect(msg.status).toBe("final");
  });

  it("generates sequential IDs", () => {
    const a = createMessage();
    const b = createMessage();

    expect(a.id).toBe("msg_1");
    expect(b.id).toBe("msg_2");
  });
});

// ─── createTurnPhase ────────────────────────────────────────

describe("createTurnPhase", () => {
  it("returns a valid TurnPhaseEntry with defaults", () => {
    const phase = createTurnPhase();

    expect(phase.phase).toBe("thinking");
    expect(phase.message_ids).toEqual([]);
    expect(phase.tool_call_ids).toEqual([]);
    expect(phase.summary).toBe("");
    expect(phase.collapsed).toBe(true);
    expect(phase.status).toBe("pending");
  });

  it("accepts overrides", () => {
    const phase = createTurnPhase({ phase: "analysis", collapsed: false, status: "running" });

    expect(phase.phase).toBe("analysis");
    expect(phase.collapsed).toBe(false);
    expect(phase.status).toBe("running");
  });
});

// ─── createTurn ─────────────────────────────────────────────

describe("createTurn", () => {
  it("returns a valid Turn with default phases", () => {
    const turn = createTurn();

    expect(turn.id).toMatch(/^turn_\d+$/);
    expect(turn.status).toBe("pending");
    expect(turn.phases).toHaveLength(6);
    expect(typeof turn.created_at_ms).toBe("number");
  });

  it("includes all six standard phases in order", () => {
    const turn = createTurn();
    const phaseNames = turn.phases.map((p) => p.phase);

    expect(phaseNames).toEqual([
      "user_message",
      "thinking",
      "analysis",
      "plan",
      "changes",
      "summary",
    ]);
  });

  it("accepts overrides", () => {
    const turn = createTurn({ status: "running" });
    expect(turn.status).toBe("running");
  });
});

// ─── createToolCall ─────────────────────────────────────────

describe("createToolCall", () => {
  it("returns a valid ToolCall with defaults", () => {
    const tc = createToolCall();

    expect(tc.id).toMatch(/^tc_\d+$/);
    expect(tc.turn_id).toBe("turn_1");
    expect(tc.tool_name).toBe("read_file");
    expect(tc.category).toBe("read");
    expect(tc.status).toBe("success");
    expect(tc.args_summary).toBe("src/index.ts");
    expect(tc.result_summary).toBe("200 lines read");
    expect(tc.duration_ms).toBe(42);
  });

  it("accepts overrides", () => {
    const tc = createToolCall({ tool_name: "write_file", status: "error" });

    expect(tc.tool_name).toBe("write_file");
    expect(tc.status).toBe("error");
  });
});

// ─── createFileChange ───────────────────────────────────────

describe("createFileChange", () => {
  it("returns a valid FileChange with defaults", () => {
    const fc = createFileChange();

    expect(fc.file_path).toBe("src/app.tsx");
    expect(fc.turn_id).toBe("turn_1");
    expect(fc.status).toBe("modified");
    expect(fc.insertions).toBe(10);
    expect(fc.deletions).toBe(3);
    expect(fc.approval_status).toBe("pending");
  });

  it("accepts overrides", () => {
    const fc = createFileChange({ status: "added", insertions: 50 });

    expect(fc.status).toBe("added");
    expect(fc.insertions).toBe(50);
  });
});

// ─── createTimelineEvent ────────────────────────────────────

describe("createTimelineEvent", () => {
  it("returns a valid TimelineEvent with defaults", () => {
    const evt = createTimelineEvent();

    expect(evt.id).toMatch(/^evt_\d+$/);
    expect(evt.turn_id).toBe("turn_1");
    expect(evt.type).toBe("tool_call_start");
    expect(evt.summary).toBe("Started read_file");
    expect(typeof evt.timestamp_ms).toBe("number");
  });

  it("accepts overrides", () => {
    const evt = createTimelineEvent({ type: "error_raised", summary: "Something broke" });

    expect(evt.type).toBe("error_raised");
    expect(evt.summary).toBe("Something broke");
  });
});

// ─── createSessionMeta ──────────────────────────────────────

describe("createSessionMeta", () => {
  it("returns a valid SessionMeta with defaults", () => {
    const meta = createSessionMeta();

    expect(meta.session_id).toBe("session_1");
    expect(meta.model_id).toBe("claude-opus-4-6");
    expect(meta.model_label).toBe("Claude Opus 4.6");
    expect(meta.approval_mode).toBe("auto");
    expect(meta.status).toBe("idle");
    expect(meta.cost_usd).toBe(0);
    expect(meta.tokens_in).toBe(0);
    expect(meta.tokens_out).toBe(0);
  });
});

// ─── createCheckpoint ───────────────────────────────────────

describe("createCheckpoint", () => {
  it("returns a valid Checkpoint with defaults", () => {
    const cp = createCheckpoint();

    expect(cp.id).toMatch(/^cp_\d+$/);
    expect(cp.turn_id).toBe("turn_1");
    expect(cp.label).toBe("Checkpoint");
    expect(typeof cp.timestamp_ms).toBe("number");
  });
});

// ─── resetIdCounter ─────────────────────────────────────────

describe("resetIdCounter", () => {
  it("resets IDs back to 1 after calling resetIdCounter", () => {
    createMessage(); // msg_1
    createMessage(); // msg_2
    resetIdCounter();
    const msg = createMessage();

    expect(msg.id).toBe("msg_1");
  });

  it("applies across all factory functions", () => {
    createMessage(); // msg_1 (counter = 1)
    createToolCall(); // tc_2  (counter = 2)
    createCheckpoint(); // cp_3  (counter = 3)

    resetIdCounter();

    const msg = createMessage();
    expect(msg.id).toBe("msg_1");
  });
});

// ─── Sequential IDs ────────────────────────────────────────

describe("sequential IDs across factories", () => {
  it("shares a single counter across all factory functions", () => {
    const msg = createMessage(); // counter = 1
    const tc = createToolCall(); // counter = 2
    const evt = createTimelineEvent(); // counter = 3
    const cp = createCheckpoint(); // counter = 4

    expect(msg.id).toBe("msg_1");
    expect(tc.id).toBe("tc_2");
    expect(evt.id).toBe("evt_3");
    expect(cp.id).toBe("cp_4");
  });
});
