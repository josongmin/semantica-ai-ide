/**
 * SOTA Test: rAF Coalescing Verification
 *
 * Verifies that the StreamingEngine actually coalesces serverEvents and batches
 * commits per rAF frame, NOT per push. This is critical for performance:
 * 1000 rapid pushes should result in far fewer than 1000 commit calls.
 *
 * Tests that don't exist anywhere else:
 *   - Commit count verification (push N → commit M where M << N)
 *   - rAF scheduling: single rAF per flush cycle
 *   - Coalescing effectiveness: consecutive APPEND_TEXT for same ID merged
 *   - Back-pressure: buffer overflow → synchronous flush
 *   - Mixed serverEvent coalescing: non-adjacent APPEND_TEXT NOT merged
 */
import { flushAllRaf, rafScheduleCount, resetRafMock } from "../../../../../tests/utils/raf-mock";
import type { MessageId,ServerEvent } from "../../../protocol";
import { resetIdCounter } from "../../mocks";
import { createStreamingEngine } from "../streamingEngine";
// ─── Lifecycle ────────────────────────────────────────────
beforeEach(() => {
  resetRafMock();
  resetIdCounter();
});

// ─── Tests ────────────────────────────────────────────────
describe("rAF Coalescing Verification", () => {
  it("1000 pushes → exactly 1 rAF scheduled (before buffer overflow)", () => {
    const commitSpy = vi.fn();
    // Use large buffer to avoid back-pressure
    const engine = createStreamingEngine(commitSpy, { maxBufferSize: 2000 });

    for (let i = 0; i < 1_000; i++) {
      engine.push({ t: "APPEND_TEXT", id: "msg_1" as MessageId, chunk: `[${i}]` });
    }

    // Only 1 rAF should have been scheduled (subsequent pushes see rafId !== null)
    expect(rafScheduleCount()).toBe(1);
    // Zero commits so far (waiting for rAF)
    expect(commitSpy).not.toHaveBeenCalled();

    flushAllRaf();

    // Exactly 1 commit after rAF fires
    expect(commitSpy).toHaveBeenCalledTimes(1);
    // The committed batch should have coalesced all 1000 APPEND_TEXT into 1
    const committed = commitSpy.mock.calls[0]?.[0] as ServerEvent[];
    expect(committed).toHaveLength(1);
    expect(committed[0]?.t).toBe("APPEND_TEXT");
    if (committed[0]?.t === "APPEND_TEXT") {
      // All 1000 chunks concatenated
      expect(committed[0].chunk).toContain("[0]");
      expect(committed[0].chunk).toContain("[999]");
    }

    engine.destroy({ flush: false });
  });

  it("bufferSize reflects raw push count, NOT coalesced count", () => {
    const commitSpy = vi.fn();
    const engine = createStreamingEngine(commitSpy, { maxBufferSize: 10000 });

    // Push 3 consecutive same-ID → will coalesce to 1, but bufferSize should be 3
    engine.push({ t: "APPEND_TEXT", id: "msg_a" as MessageId, chunk: "Hello " });
    engine.push({ t: "APPEND_TEXT", id: "msg_a" as MessageId, chunk: "World " });
    engine.push({ t: "APPEND_TEXT", id: "msg_a" as MessageId, chunk: "!" });
    expect(engine.bufferSize).toBe(3);

    flushAllRaf();
    expect(engine.bufferSize).toBe(0);

    // Verify coalescing still happened
    const committed = commitSpy.mock.calls[0]?.[0] as ServerEvent[];
    expect(committed).toHaveLength(1);
    expect(committed[0]).toEqual({
      t: "APPEND_TEXT",
      id: "msg_a",
      chunk: "Hello World !",
    });

    engine.destroy({ flush: false });
  });

  it("non-consecutive APPEND_TEXT for same ID → NOT merged (different serverEvent in between)", () => {
    const commitSpy = vi.fn();
    const engine = createStreamingEngine(commitSpy, { maxBufferSize: 10000 });

    engine.push({ t: "APPEND_TEXT", id: "msg_a" as MessageId, chunk: "first " });
    engine.push({ t: "SET_MESSAGE_STATUS", id: "msg_a" as MessageId, status: "streaming" });
    engine.push({ t: "APPEND_TEXT", id: "msg_a" as MessageId, chunk: "second" });

    flushAllRaf();

    const committed = commitSpy.mock.calls[0]?.[0] as ServerEvent[];
    expect(committed).toHaveLength(3);
    expect(committed[0]).toEqual({ t: "APPEND_TEXT", id: "msg_a", chunk: "first " });
    expect(committed[1]).toEqual({ t: "SET_MESSAGE_STATUS", id: "msg_a", status: "streaming" });
    expect(committed[2]).toEqual({ t: "APPEND_TEXT", id: "msg_a", chunk: "second" });

    engine.destroy({ flush: false });
  });

  it("APPEND_TEXT for different IDs → NOT merged", () => {
    const commitSpy = vi.fn();
    const engine = createStreamingEngine(commitSpy, { maxBufferSize: 10000 });

    engine.push({ t: "APPEND_TEXT", id: "msg_a" as MessageId, chunk: "A" });
    engine.push({ t: "APPEND_TEXT", id: "msg_b" as MessageId, chunk: "B" });
    engine.push({ t: "APPEND_TEXT", id: "msg_a" as MessageId, chunk: "A2" });

    flushAllRaf();

    const committed = commitSpy.mock.calls[0]?.[0] as ServerEvent[];
    expect(committed).toHaveLength(3);
    expect(committed[0]).toEqual({ t: "APPEND_TEXT", id: "msg_a", chunk: "A" });
    expect(committed[1]).toEqual({ t: "APPEND_TEXT", id: "msg_b", chunk: "B" });
    expect(committed[2]).toEqual({ t: "APPEND_TEXT", id: "msg_a", chunk: "A2" });

    engine.destroy({ flush: false });
  });

  it("back-pressure: buffer exceeding maxBufferSize → synchronous flush", () => {
    const commitSpy = vi.fn();
    const engine = createStreamingEngine(commitSpy, { maxBufferSize: 10 });

    // Push 10 serverEvents → hits maxBufferSize → synchronous flush
    for (let i = 0; i < 10; i++) {
      engine.push({ t: "APPEND_TEXT", id: "msg_bp" as MessageId, chunk: `[${i}]` });
    }

    // Should have flushed synchronously (without waiting for rAF)
    expect(commitSpy).toHaveBeenCalledTimes(1);
    // First push scheduled an rAF before buffer was full; it's still pending
    // but when it fires, buffer is empty → no additional commit
    flushAllRaf();
    expect(commitSpy).toHaveBeenCalledTimes(1);

    engine.destroy({ flush: false });
  });

  it("back-pressure at exactly maxBufferSize boundary", () => {
    const commitSpy = vi.fn();
    const engine = createStreamingEngine(commitSpy, { maxBufferSize: 5 });

    // Push 4 serverEvents → below threshold, rAF scheduled
    for (let i = 0; i < 4; i++) {
      engine.push({ t: "NOP" });
    }
    expect(commitSpy).not.toHaveBeenCalled();
    expect(rafScheduleCount()).toBe(1);

    // Push 1 more → hits 5 → synchronous flush
    engine.push({ t: "NOP" });
    expect(commitSpy).toHaveBeenCalledTimes(1);

    engine.destroy({ flush: false });
  });

  it("multiple flush cycles: push-flush-push-flush → separate commits", () => {
    const commitSpy = vi.fn();
    const engine = createStreamingEngine(commitSpy);

    // Cycle 1
    engine.push({ t: "APPEND_TEXT", id: "msg_c" as MessageId, chunk: "cycle1" });
    flushAllRaf();
    expect(commitSpy).toHaveBeenCalledTimes(1);

    // Cycle 2
    engine.push({ t: "APPEND_TEXT", id: "msg_c" as MessageId, chunk: "cycle2" });
    flushAllRaf();
    expect(commitSpy).toHaveBeenCalledTimes(2);

    // Each commit should have its own data
    expect((commitSpy.mock.calls[0]?.[0] as ServerEvent[])[0]).toEqual({
      t: "APPEND_TEXT",
      id: "msg_c",
      chunk: "cycle1",
    });
    expect((commitSpy.mock.calls[1]?.[0] as ServerEvent[])[0]).toEqual({
      t: "APPEND_TEXT",
      id: "msg_c",
      chunk: "cycle2",
    });

    engine.destroy({ flush: false });
  });

  it("10,000 round-robin APPEND_TEXT across 10 messages → no coalescing (different adjacent IDs)", () => {
    const commitSpy = vi.fn();
    const engine = createStreamingEngine(commitSpy, { maxBufferSize: 20000 });

    const msgIds = Array.from({ length: 10 }, (_, i) => `msg_${i}` as MessageId);

    // Push 1000 chunks per message, round-robin style
    for (let round = 0; round < 1_000; round++) {
      for (const id of msgIds) {
        engine.push({ t: "APPEND_TEXT", id, chunk: `[${round}]` });
      }
    }

    expect(commitSpy).not.toHaveBeenCalled();
    flushAllRaf();
    expect(commitSpy).toHaveBeenCalledTimes(1);

    // round-robin means they alternate: msg_0, msg_1, ..., msg_9, msg_0, msg_1, ...
    // Adjacent pairs are different IDs, so NO coalescing happens → full 10,000 serverEvents
    const committed = commitSpy.mock.calls[0]?.[0] as ServerEvent[];
    expect(committed).toHaveLength(10_000);

    engine.destroy({ flush: false });
  });

  it("rAF schedule count resets after each flush cycle", () => {
    const commitSpy = vi.fn();
    const engine = createStreamingEngine(commitSpy, { maxBufferSize: 10000 });

    // Cycle 1: 100 pushes → 1 rAF
    for (let i = 0; i < 100; i++) {
      engine.push({ t: "APPEND_TEXT", id: "msg_c1" as MessageId, chunk: "x" });
    }
    expect(rafScheduleCount()).toBe(1);
    flushAllRaf();
    expect(commitSpy).toHaveBeenCalledTimes(1);

    // Cycle 2: 200 more pushes → 1 NEW rAF (total 2)
    for (let i = 0; i < 200; i++) {
      engine.push({ t: "APPEND_TEXT", id: "msg_c2" as MessageId, chunk: "y" });
    }
    expect(rafScheduleCount()).toBe(2);
    flushAllRaf();
    expect(commitSpy).toHaveBeenCalledTimes(2);

    // Cycle 3: 50 more → total 3 rAF scheduled
    for (let i = 0; i < 50; i++) {
      engine.push({ t: "APPEND_TEXT", id: "msg_c3" as MessageId, chunk: "z" });
    }
    expect(rafScheduleCount()).toBe(3);
    flushAllRaf();
    expect(commitSpy).toHaveBeenCalledTimes(3);

    engine.destroy({ flush: false });
  });

  it("flush() forces immediate commit even when rAF is pending", () => {
    const commitSpy = vi.fn();
    const engine = createStreamingEngine(commitSpy);

    engine.push({ t: "APPEND_TEXT", id: "msg_fl" as MessageId, chunk: "urgent" });

    // rAF is pending but we force flush
    engine.flush();

    expect(commitSpy).toHaveBeenCalledTimes(1);

    // Subsequent rAF should NOT re-commit (buffer already empty)
    flushAllRaf();
    expect(commitSpy).toHaveBeenCalledTimes(1);

    engine.destroy({ flush: false });
  });

  it("coalescing with RESET_STORES interleaved: splits APPEND_TEXT runs", () => {
    const commitSpy = vi.fn();
    const engine = createStreamingEngine(commitSpy, { maxBufferSize: 10000 });

    engine.push({ t: "APPEND_TEXT", id: "msg_r" as MessageId, chunk: "A" });
    engine.push({ t: "APPEND_TEXT", id: "msg_r" as MessageId, chunk: "B" });
    engine.push({ t: "RESET_STORES" });
    engine.push({ t: "APPEND_TEXT", id: "msg_r" as MessageId, chunk: "C" });
    engine.push({ t: "APPEND_TEXT", id: "msg_r" as MessageId, chunk: "D" });

    flushAllRaf();

    const committed = commitSpy.mock.calls[0]?.[0] as ServerEvent[];
    // RESET_STORES breaks the coalescing run: [AB, RESET, CD]
    expect(committed).toHaveLength(3);
    expect(committed[0]).toEqual({ t: "APPEND_TEXT", id: "msg_r", chunk: "AB" });
    expect(committed[1]).toEqual({ t: "RESET_STORES" });
    expect(committed[2]).toEqual({ t: "APPEND_TEXT", id: "msg_r", chunk: "CD" });

    engine.destroy({ flush: false });
  });

  it("empty-string chunk APPEND_TEXT still participates in coalescing", () => {
    const commitSpy = vi.fn();
    const engine = createStreamingEngine(commitSpy, { maxBufferSize: 10000 });

    engine.push({ t: "APPEND_TEXT", id: "msg_e" as MessageId, chunk: "A" });
    engine.push({ t: "APPEND_TEXT", id: "msg_e" as MessageId, chunk: "" });
    engine.push({ t: "APPEND_TEXT", id: "msg_e" as MessageId, chunk: "B" });

    flushAllRaf();

    const committed = commitSpy.mock.calls[0]?.[0] as ServerEvent[];
    // Empty chunk is still same-ID consecutive APPEND_TEXT → coalesces
    expect(committed).toHaveLength(1);
    expect(committed[0]).toEqual({ t: "APPEND_TEXT", id: "msg_e", chunk: "AB" });

    engine.destroy({ flush: false });
  });

  it("back-pressure mid-coalesce: synchronous flush preserves partial coalescing", () => {
    const commitSpy = vi.fn();
    const engine = createStreamingEngine(commitSpy, { maxBufferSize: 3 });

    // Push 3 same-ID → hits maxBuffer at 3rd push → sync flush
    engine.push({ t: "APPEND_TEXT", id: "msg_bp" as MessageId, chunk: "X" });
    engine.push({ t: "APPEND_TEXT", id: "msg_bp" as MessageId, chunk: "Y" });
    engine.push({ t: "APPEND_TEXT", id: "msg_bp" as MessageId, chunk: "Z" });

    expect(commitSpy).toHaveBeenCalledTimes(1);
    const committed = commitSpy.mock.calls[0]?.[0] as ServerEvent[];
    // All 3 same-ID consecutive → coalesced to 1 even under back-pressure
    expect(committed).toHaveLength(1);
    expect(committed[0]).toEqual({ t: "APPEND_TEXT", id: "msg_bp", chunk: "XYZ" });

    engine.destroy({ flush: false });
  });

  it("back-pressure triggers multiple synchronous flushes for very large input", () => {
    const commitSpy = vi.fn();
    const engine = createStreamingEngine(commitSpy, { maxBufferSize: 100 });

    // Push 350 different-ID serverEvents → should trigger 3 synchronous flushes + 1 rAF for remaining 50
    for (let i = 0; i < 350; i++) {
      engine.push({ t: "APPEND_TEXT", id: `msg_${i}` as MessageId, chunk: "x" });
    }

    // 3 synchronous flushes (at 100, 200, 300)
    expect(commitSpy).toHaveBeenCalledTimes(3);

    // Remaining 50 in buffer, waiting for rAF
    flushAllRaf();
    expect(commitSpy).toHaveBeenCalledTimes(4);

    // Verify batch sizes
    expect(commitSpy.mock.calls[0]?.[0] as ServerEvent[]).toHaveLength(100);
    expect(commitSpy.mock.calls[1]?.[0] as ServerEvent[]).toHaveLength(100);
    expect(commitSpy.mock.calls[2]?.[0] as ServerEvent[]).toHaveLength(100);
    expect(commitSpy.mock.calls[3]?.[0] as ServerEvent[]).toHaveLength(50);

    engine.destroy({ flush: false });
  });

  it("ServerEventBatch push: all serverEvents from batch are coalesced together", () => {
    const commitSpy = vi.fn();
    const engine = createStreamingEngine(commitSpy, { maxBufferSize: 10000 });

    engine.push({
      type: "SERVER_EVENT_BATCH",
      batch_id: "b1",
      created_at_ms: Date.now(),
      serverEvents: [
        { t: "APPEND_TEXT", id: "msg_db" as MessageId, chunk: "A" },
        { t: "APPEND_TEXT", id: "msg_db" as MessageId, chunk: "B" },
        { t: "APPEND_TEXT", id: "msg_db" as MessageId, chunk: "C" },
      ],
    });

    flushAllRaf();

    const committed = commitSpy.mock.calls[0]?.[0] as ServerEvent[];
    // All 3 consecutive same-ID APPEND_TEXT should be coalesced into 1
    expect(committed).toHaveLength(1);
    expect(committed[0]).toEqual({
      t: "APPEND_TEXT",
      id: "msg_db",
      chunk: "ABC",
    });

    engine.destroy({ flush: false });
  });

  it("single serverEvent → processed and committed correctly in batch", () => {
    const commitSpy = vi.fn();
    const engine = createStreamingEngine(commitSpy);

    engine.push({ t: "NOP" });
    flushAllRaf();

    const committed = commitSpy.mock.calls[0]?.[0] as ServerEvent[];
    expect(committed).toHaveLength(1);
    expect(committed[0]).toEqual({ t: "NOP" });

    engine.destroy({ flush: false });
  });
});
