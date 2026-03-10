import type { MessageId, ServerEvent, ServerEventBatch, UiMessage } from "../../../protocol";
import { createStreamingEngine } from "../streamingEngine";
// ─── rAF mock ─────────────────────────────────────────────
let rafCallback: FrameRequestCallback | null = null;
vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
  rafCallback = cb;
  return 1;
});
vi.stubGlobal("cancelAnimationFrame", vi.fn());

function flushRaf() {
  rafCallback?.(performance.now());
  rafCallback = null;
}

// ─── Helpers ──────────────────────────────────────────────
function appendTextServerEvent(id: string, chunk: string): ServerEvent {
  return { t: "APPEND_TEXT", id: id as MessageId, chunk };
}

function upsertMessageServerEvent(id: string): ServerEvent {
  return {
    t: "UPSERT_MESSAGE",
    msg: {
      id: id as MessageId,
      role: "assistant",
      created_at_ms: Date.now(),
      text: "test",
      status: "streaming",
    } as UiMessage,
  };
}

beforeEach(() => {
  rafCallback = null;
  vi.mocked(cancelAnimationFrame).mockClear();
});

describe("createStreamingEngine", () => {
  it("push single serverEvent + flush via rAF: commit called with [serverEvent]", () => {
    const commit = vi.fn();
    const engine = createStreamingEngine(commit);

    engine.push(appendTextServerEvent("msg_1", "Hello"));
    flushRaf();

    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith([appendTextServerEvent("msg_1", "Hello")]);
  });

  describe("coalescing", () => {
    it("consecutive APPEND_TEXT with same ID are merged into 1 serverEvent", () => {
      const commit = vi.fn();
      const engine = createStreamingEngine(commit);

      engine.push(appendTextServerEvent("msg_1", "A"));
      engine.push(appendTextServerEvent("msg_1", "B"));
      engine.push(appendTextServerEvent("msg_1", "C"));
      flushRaf();

      expect(commit).toHaveBeenCalledTimes(1);
      const committed = commit.mock.calls[0]?.[0] as ServerEvent[];
      expect(committed).toHaveLength(1);
      expect(committed[0]).toEqual(appendTextServerEvent("msg_1", "ABC"));
    });

    it("APPEND_TEXT with different IDs are NOT merged", () => {
      const commit = vi.fn();
      const engine = createStreamingEngine(commit);

      engine.push(appendTextServerEvent("msg_1", "Hello"));
      engine.push(appendTextServerEvent("msg_2", "World"));
      flushRaf();

      expect(commit).toHaveBeenCalledTimes(1);
      const committed = commit.mock.calls[0]?.[0] as ServerEvent[];
      expect(committed).toHaveLength(2);
      expect(committed[0]).toEqual(appendTextServerEvent("msg_1", "Hello"));
      expect(committed[1]).toEqual(appendTextServerEvent("msg_2", "World"));
    });

    it("interleaved IDs: A1, A2, A1 results in 3 separate serverEvents (non-consecutive)", () => {
      const commit = vi.fn();
      const engine = createStreamingEngine(commit);

      engine.push(appendTextServerEvent("msg_1", "X"));
      engine.push(appendTextServerEvent("msg_2", "Y"));
      engine.push(appendTextServerEvent("msg_1", "Z"));
      flushRaf();

      const committed = commit.mock.calls[0]?.[0] as ServerEvent[];
      expect(committed).toHaveLength(3);
      expect(committed[0]).toEqual(appendTextServerEvent("msg_1", "X"));
      expect(committed[1]).toEqual(appendTextServerEvent("msg_2", "Y"));
      expect(committed[2]).toEqual(appendTextServerEvent("msg_1", "Z"));
    });

    it("mixed serverEvent types: UPSERT_MESSAGE + APPEND_TEXT are not merged", () => {
      const commit = vi.fn();
      const engine = createStreamingEngine(commit);

      engine.push(upsertMessageServerEvent("msg_1"));
      engine.push(appendTextServerEvent("msg_1", " more"));
      flushRaf();

      expect(commit).toHaveBeenCalledTimes(1);
      const committed = commit.mock.calls[0]?.[0] as ServerEvent[];
      expect(committed).toHaveLength(2);
      expect(committed[0]?.t).toBe("UPSERT_MESSAGE");
      expect(committed[1]?.t).toBe("APPEND_TEXT");
    });
  });

  it("SERVER_EVENT_BATCH input: serverEvents extracted and coalesced", () => {
    const commit = vi.fn();
    const engine = createStreamingEngine(commit);

    const batch: ServerEventBatch = {
      type: "SERVER_EVENT_BATCH",
      batch_id: "batch_1",
      created_at_ms: Date.now(),
      serverEvents: [appendTextServerEvent("msg_1", "A"), appendTextServerEvent("msg_1", "B")],
    };

    engine.push(batch);
    flushRaf();

    expect(commit).toHaveBeenCalledTimes(1);
    const committed = commit.mock.calls[0]?.[0] as ServerEvent[];
    expect(committed).toHaveLength(1);
    expect(committed[0]).toEqual(appendTextServerEvent("msg_1", "AB"));
  });

  it("manual flush() triggers immediate commit without rAF", () => {
    const commit = vi.fn();
    const engine = createStreamingEngine(commit);

    engine.push(appendTextServerEvent("msg_1", "urgent"));
    engine.flush();

    // Should commit immediately without needing rAF
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith([appendTextServerEvent("msg_1", "urgent")]);
  });

  it("destroy() commits remaining buffer and cancels pending rAF", () => {
    const commit = vi.fn();
    const engine = createStreamingEngine(commit);

    engine.push(appendTextServerEvent("msg_1", "remaining"));
    // At this point rAF has been scheduled but not fired
    engine.destroy();

    // destroy should have flushed the buffer
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith([appendTextServerEvent("msg_1", "remaining")]);
    // cancelAnimationFrame should have been called
    expect(cancelAnimationFrame).toHaveBeenCalled();
  });

  it("destroy() prevents further pushes from being processed", () => {
    const commit = vi.fn();
    const engine = createStreamingEngine(commit);

    engine.destroy();
    engine.push(appendTextServerEvent("msg_1", "ignored"));
    flushRaf();

    // The push after destroy should be ignored; only the destroy flush (empty) counts
    expect(commit).not.toHaveBeenCalled();
  });

  it("empty buffer: flush does not call commit", () => {
    const commit = vi.fn();
    const engine = createStreamingEngine(commit);

    engine.flush();

    expect(commit).not.toHaveBeenCalled();
  });

  it("bufferSize reflects current pending serverEvents", () => {
    const commit = vi.fn();
    const engine = createStreamingEngine(commit);

    expect(engine.bufferSize).toBe(0);

    engine.push(appendTextServerEvent("msg_1", "A"));
    expect(engine.bufferSize).toBe(1);

    engine.push(appendTextServerEvent("msg_1", "B"));
    expect(engine.bufferSize).toBe(2);

    engine.flush();
    expect(engine.bufferSize).toBe(0);
  });
});
