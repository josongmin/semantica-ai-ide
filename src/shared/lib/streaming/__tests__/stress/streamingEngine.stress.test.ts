import type { MessageId, ServerEvent, ServerEventBatch, UiMessage } from "../../../../protocol";
import { createStreamingEngine } from "../../streamingEngine";

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

function upsertMessageServerEvent(id: string, text = ""): ServerEvent {
  return {
    t: "UPSERT_MESSAGE",
    msg: {
      id: id as MessageId,
      role: "assistant",
      created_at_ms: Date.now(),
      text,
      status: "streaming",
    } as UiMessage,
  };
}

function makeBatch(serverEvents: ServerEvent[], batchId = "batch_1"): ServerEventBatch {
  return {
    type: "SERVER_EVENT_BATCH",
    batch_id: batchId,
    created_at_ms: Date.now(),
    serverEvents,
  };
}

beforeEach(() => {
  rafCallback = null;
  vi.mocked(cancelAnimationFrame).mockClear();
});

// ─── Stress Tests ─────────────────────────────────────────
describe("StreamingEngine – stress & extreme conditions", () => {
  // ── Back-pressure at Scale ─────────────────────────────
  describe("back-pressure mechanism", () => {
    it("10,000 serverEvents: back-pressure triggers synchronous flushes at maxBuffer boundaries", () => {
      const commit = vi.fn();
      const MAX = 100;
      const engine = createStreamingEngine(commit, { maxBufferSize: MAX });

      for (let i = 0; i < 10_000; i++) {
        engine.push(appendTextServerEvent("msg_1", `c${i}`));
      }
      flushRaf();

      // Back-pressure at every 100 serverEvents → 100 synchronous flushes + 0 remaining (10000 % 100 = 0)
      // or 99 sync flushes + 1 rAF flush depending on timing
      expect(commit.mock.calls.length).toBeGreaterThanOrEqual(100);
    });

    it("zero data loss: all 10,000 chunks reconstructed in order", () => {
      const committed: ServerEvent[][] = [];
      const commit = vi.fn((serverEvents: readonly ServerEvent[]) => {
        committed.push([...serverEvents]);
      });
      const engine = createStreamingEngine(commit, { maxBufferSize: 200 });

      const N = 10_000;
      for (let i = 0; i < N; i++) {
        engine.push(appendTextServerEvent("msg_1", `${String(i)  }|`));
      }
      flushRaf();

      // Reconstruct full text from all committed serverEvents
      const fullText = committed
        .flat()
        .filter((d): d is ServerEvent & { t: "APPEND_TEXT" } => d.t === "APPEND_TEXT")
        .map((d) => d.chunk)
        .join("");

      // Verify every chunk appears in order
      for (let i = 0; i < N; i++) {
        expect(fullText).toContain(`${String(i)  }|`);
      }

      // Verify ordering: index of chunk i should be before chunk i+1
      for (let i = 0; i < 100; i++) {
        const pos1 = fullText.indexOf(`${String(i)  }|`);
        const pos2 = fullText.indexOf(`${String(i + 1)  }|`);
        // Coalescing may merge consecutive chunks, but order is preserved
        expect(pos1).toBeLessThan(pos2);
      }
    });

    it("maxBufferSize=1: every push triggers immediate flush", () => {
      const commit = vi.fn();
      const engine = createStreamingEngine(commit, { maxBufferSize: 1 });

      for (let i = 0; i < 50; i++) {
        engine.push(appendTextServerEvent("msg_1", `x${i}`));
      }

      // Each push exceeds maxBuffer(1) → immediate flush each time
      expect(commit).toHaveBeenCalledTimes(50);
    });
  });

  // ── Coalescing Under Load ──────────────────────────────
  describe("coalescing correctness under load", () => {
    it("1,000 consecutive same-ID APPEND_TEXT: coalesced into 1 serverEvent", () => {
      const commit = vi.fn();
      const engine = createStreamingEngine(commit);

      for (let i = 0; i < 1_000; i++) {
        engine.push(appendTextServerEvent("msg_1", "x"));
      }
      flushRaf();

      // All 1000 are consecutive same-ID → one coalesced serverEvent per flush
      const allServerEvents = commit.mock.calls.flatMap((call) => call[0] as ServerEvent[]);
      const appendServerEvents = allServerEvents.filter((d: ServerEvent) => d.t === "APPEND_TEXT");

      // May be split across multiple flushes due to back-pressure, but within
      // each flush consecutive same-ID should be coalesced
      for (const call of commit.mock.calls) {
        const batch = call[0] as ServerEvent[];
        const appends = batch.filter((d: ServerEvent) => d.t === "APPEND_TEXT");
        // Within a single flush, consecutive same-ID chunks → 1 serverEvent
        expect(appends.length).toBeLessThanOrEqual(1);
      }

      // Total text length should be 1000 'x' characters
      const totalText = appendServerEvents.map((d: ServerEvent & { t: "APPEND_TEXT" }) => d.chunk).join("");
      expect(totalText).toBe("x".repeat(1_000));
    });

    it("alternating 2 IDs: no merging across IDs, count preserved", () => {
      const commit = vi.fn();
      const engine = createStreamingEngine(commit, { maxBufferSize: 1000 });

      for (let i = 0; i < 500; i++) {
        engine.push(appendTextServerEvent("msg_A", "a"));
        engine.push(appendTextServerEvent("msg_B", "b"));
      }
      flushRaf();

      const allServerEvents = commit.mock.calls.flatMap((call) => call[0] as ServerEvent[]);
      // Each pair [A, B] cannot be coalesced (different IDs)
      // But consecutive A's or B's won't happen due to alternation → 1000 serverEvents
      expect(allServerEvents).toHaveLength(1_000);
    });

    it("mixed serverEvent types interleaved: coalescing only applies to APPEND_TEXT", () => {
      const commit = vi.fn();
      const engine = createStreamingEngine(commit);

      // UPSERT → APPEND → APPEND → UPSERT → APPEND
      engine.push(upsertMessageServerEvent("msg_1"));
      engine.push(appendTextServerEvent("msg_1", "A"));
      engine.push(appendTextServerEvent("msg_1", "B"));
      engine.push(upsertMessageServerEvent("msg_2"));
      engine.push(appendTextServerEvent("msg_2", "C"));
      engine.push(appendTextServerEvent("msg_2", "D"));
      flushRaf();

      const call = commit.mock.calls[0];
      if (call === undefined) throw new Error("Expected call at index 0");
      const committed = call[0] as ServerEvent[];
      // UPSERT_msg1, APPEND_msg1(AB), UPSERT_msg2, APPEND_msg2(CD)
      expect(committed).toHaveLength(4);
      expect(committed[0]?.t).toBe("UPSERT_MESSAGE");
      expect(committed[1]).toEqual(appendTextServerEvent("msg_1", "AB"));
      expect(committed[2]?.t).toBe("UPSERT_MESSAGE");
      expect(committed[3]).toEqual(appendTextServerEvent("msg_2", "CD"));
    });
  });

  // ── ServerEventBatch Stress ──────────────────────────────────
  describe("ServerEventBatch processing", () => {
    it("single batch with 5,000 serverEvents: all processed correctly", () => {
      const commit = vi.fn();
      const engine = createStreamingEngine(commit, { maxBufferSize: 10_000 });

      const serverEvents: ServerEvent[] = [];
      for (let i = 0; i < 5_000; i++) {
        serverEvents.push(appendTextServerEvent("msg_1", `[${i}]`));
      }
      engine.push(makeBatch(serverEvents));
      flushRaf();

      const allCommitted = commit.mock.calls.flatMap((call) => call[0] as ServerEvent[]);
      // All coalesced into 1 serverEvent (consecutive same-ID APPEND_TEXT)
      expect(allCommitted).toHaveLength(1);
      expect((allCommitted[0] as ServerEvent & { t: "APPEND_TEXT" }).chunk).toHaveLength(
        serverEvents.reduce(
          (acc, d) => acc + (d as ServerEvent & { t: "APPEND_TEXT" }).chunk.length,
          0,
        ),
      );
    });

    it("100 batches pushed rapidly: no data loss", () => {
      const committed: ServerEvent[][] = [];
      const commit = vi.fn((serverEvents: readonly ServerEvent[]) => committed.push([...serverEvents]));
      const engine = createStreamingEngine(commit, { maxBufferSize: 500 });

      for (let b = 0; b < 100; b++) {
        const serverEvents: ServerEvent[] = [];
        for (let d = 0; d < 10; d++) {
          serverEvents.push(appendTextServerEvent(`msg_${b}`, `batch${b}_serverEvent${d}`));
        }
        engine.push(makeBatch(serverEvents, `batch_${b}`));
      }
      flushRaf();

      // Verify all 100 message IDs received data
      const allServerEvents = committed.flat();
      const idSet = new Set(
        allServerEvents
          .filter((d): d is ServerEvent & { t: "APPEND_TEXT" } => d.t === "APPEND_TEXT")
          .map((d) => d.id),
      );
      expect(idSet.size).toBe(100);
    });

    it("nested batch-like structure: only valid ServerEventBatch extracted", () => {
      const commit = vi.fn();
      const engine = createStreamingEngine(commit);

      // Push a proper ServerEventBatch
      engine.push(makeBatch([appendTextServerEvent("msg_1", "A"), appendTextServerEvent("msg_1", "B")]));
      // Push a raw serverEvent
      engine.push(appendTextServerEvent("msg_1", "C"));
      flushRaf();

      const call2 = commit.mock.calls[0];
      if (call2 === undefined) throw new Error("Expected call at index 0");
      const committed = call2[0] as ServerEvent[];
      // A+B coalesced, then C also coalesced with them → "ABC"
      expect(committed).toHaveLength(1);
      const first = committed[0] as ServerEvent & { t: "APPEND_TEXT" } | undefined;
      expect(first?.chunk).toBe("ABC");
    });
  });

  // ── Lifecycle Edge Cases ───────────────────────────────
  describe("lifecycle edge cases", () => {
    it("push → destroy → push → flush: only pre-destroy data committed", () => {
      const commit = vi.fn();
      const engine = createStreamingEngine(commit);

      engine.push(appendTextServerEvent("msg_1", "before"));
      engine.destroy();

      // Post-destroy operations should be silently ignored
      engine.push(appendTextServerEvent("msg_1", "after"));
      engine.flush();

      // destroy() flushes "before", then ignores everything after
      expect(commit).toHaveBeenCalledTimes(1);
      expect(commit).toHaveBeenCalledWith([appendTextServerEvent("msg_1", "before")]);
    });

    it("multiple destroy() calls: idempotent, no double-commit", () => {
      const commit = vi.fn();
      const engine = createStreamingEngine(commit);

      engine.push(appendTextServerEvent("msg_1", "data"));
      engine.destroy();
      engine.destroy();
      engine.destroy();

      // Only one commit from the first destroy
      expect(commit).toHaveBeenCalledTimes(1);
    });

    it("flush() called between pushes: two separate commits", () => {
      const commit = vi.fn();
      const engine = createStreamingEngine(commit);

      engine.push(appendTextServerEvent("msg_1", "first"));
      engine.flush();
      engine.push(appendTextServerEvent("msg_1", "second"));
      engine.flush();

      expect(commit).toHaveBeenCalledTimes(2);
      expect(commit).toHaveBeenNthCalledWith(1, [appendTextServerEvent("msg_1", "first")]);
      expect(commit).toHaveBeenNthCalledWith(2, [appendTextServerEvent("msg_1", "second")]);
    });

    it("rAF fires after destroy: no crash, no extra commit", () => {
      const commit = vi.fn();
      const engine = createStreamingEngine(commit);

      engine.push(appendTextServerEvent("msg_1", "data"));
      engine.destroy(); // flushes + cancels rAF

      // Simulate a stale rAF callback firing
      flushRaf();

      // Only the destroy flush should count
      expect(commit).toHaveBeenCalledTimes(1);
    });
  });

  // ── Buffer Size Tracking ───────────────────────────────
  describe("bufferSize tracking under stress", () => {
    it("bufferSize accurately tracks through rapid push/flush cycles", () => {
      const commit = vi.fn();
      const engine = createStreamingEngine(commit, { maxBufferSize: 10_000 });

      expect(engine.bufferSize).toBe(0);

      for (let i = 0; i < 500; i++) {
        engine.push(appendTextServerEvent("msg_1", "x"));
      }
      expect(engine.bufferSize).toBe(500);

      engine.flush();
      expect(engine.bufferSize).toBe(0);

      for (let i = 0; i < 200; i++) {
        engine.push(appendTextServerEvent("msg_1", "y"));
      }
      expect(engine.bufferSize).toBe(200);

      engine.destroy();
      expect(engine.bufferSize).toBe(0);
    });

    it("bufferSize resets after back-pressure flush", () => {
      const commit = vi.fn();
      const engine = createStreamingEngine(commit, { maxBufferSize: 50 });

      for (let i = 0; i < 50; i++) {
        engine.push(appendTextServerEvent("msg_1", "x"));
      }
      // At push #50, back-pressure triggers → buffer should be 0
      expect(engine.bufferSize).toBe(0);
    });
  });

  // ── Throughput Simulation ──────────────────────────────
  describe("throughput simulation", () => {
    it("simulates 60fps streaming: 60 rAF flushes with continuous push", () => {
      const commit = vi.fn();
      const engine = createStreamingEngine(commit, { maxBufferSize: 10_000 });

      // Simulate 60 frames, each with ~50 serverEvents arriving between frames
      for (let frame = 0; frame < 60; frame++) {
        for (let d = 0; d < 50; d++) {
          engine.push(appendTextServerEvent("msg_1", `f${frame}d${d}`));
        }
        flushRaf(); // Simulate rAF tick
      }

      // 60 flush cycles → 60 commits
      expect(commit).toHaveBeenCalledTimes(60);

      // Each commit should have exactly 1 serverEvent (all coalesced: same ID, consecutive)
      for (const c of commit.mock.calls) {
        const batch = c[0] as ServerEvent[];
        expect(batch).toHaveLength(1);
        expect(batch[0]?.t).toBe("APPEND_TEXT");
      }
    });

    it("multi-message streaming: 10 concurrent messages at 60fps", () => {
      const commit = vi.fn();
      const engine = createStreamingEngine(commit, { maxBufferSize: 10_000 });

      for (let frame = 0; frame < 60; frame++) {
        // 10 messages each get 5 chunks per frame
        for (let msg = 0; msg < 10; msg++) {
          for (let c = 0; c < 5; c++) {
            engine.push(appendTextServerEvent(`msg_${msg}`, `f${frame}c${c}`));
          }
        }
        flushRaf();
      }

      expect(commit).toHaveBeenCalledTimes(60);

      // Each commit: 10 messages × 1 coalesced serverEvent each = 10 serverEvents
      for (const call of commit.mock.calls) {
        const batch = call[0] as ServerEvent[];
        // Each message's 5 consecutive chunks coalesced → 1 per message
        // But messages interleave: m0*5, m1*5, m2*5... → coalescing within each group
        expect(batch.length).toBe(10);
      }
    });
  });
});
