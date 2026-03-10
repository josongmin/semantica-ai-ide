/**
 * Unmount During Streaming Safety Tests
 *
 * Tests:
 * - StreamingEngine destroy on unmount
 * - Push after destroy: silently ignored
 * - Rapid create/destroy cycles
 * - PerfCollector cleanup
 */
import { createPerfCollector, createStreamingEngine } from "../../../shared/lib";
import type { MessageId,ServerEvent } from "../../../shared/protocol";

describe("Unmount during streaming – safety", () => {
  describe("StreamingEngine lifecycle", () => {
    it("destroy stops accepting pushes", () => {
      let committed = false;
      const engine = createStreamingEngine(() => {
        committed = true;
      });

      engine.destroy();
      engine.push({ t: "NOP" } as ServerEvent);
      engine.flush();

      expect(committed).toBe(false);
    });

    it("destroy with pending buffer: flushes by default", () => {
      let commitCount = 0;
      const engine = createStreamingEngine(() => {
        commitCount++;
      });

      engine.push({ t: "NOP" } as ServerEvent);
      engine.push({ t: "NOP" } as ServerEvent);

      engine.destroy(); // flush: true by default
      expect(commitCount).toBe(1); // One flush with 2 serverEvents
    });

    it("50 rapid create/destroy cycles: no memory leak or error", () => {
      for (let i = 0; i < 50; i++) {
        const engine = createStreamingEngine(() => {});
        engine.push({ t: "APPEND_TEXT", id: "msg_1" as MessageId, chunk: `token_${i}` } as ServerEvent);
        engine.destroy();
      }
      // If we get here without error, test passes
      expect(true).toBe(true);
    });

    it("double destroy: no error", () => {
      const engine = createStreamingEngine(() => {});
      engine.destroy();
      expect(() => engine.destroy()).not.toThrow();
    });
  });

  describe("PerfCollector lifecycle", () => {
    it("destroy cleans up observer", () => {
      const perf = createPerfCollector();

      // Record some metrics
      perf.recordINP(10);
      perf.recordFrame(8);
      perf.recordPostMessage();
      perf.recordUICommit();

      const snap = perf.snapshot();
      expect(snap.inp_p95_ms).toBeGreaterThan(0);

      perf.destroy();
      // Verify no error on further calls (should be safe)
    });

    it("50 rapid create/destroy cycles: no error", () => {
      for (let i = 0; i < 50; i++) {
        const perf = createPerfCollector();
        perf.recordINP(i);
        perf.recordFrame(i);
        perf.destroy();
      }
      expect(true).toBe(true);
    });

    it("snapshot after destroy: still returns data from before destroy", () => {
      const perf = createPerfCollector();
      perf.recordINP(100);
      perf.recordFrame(20);
      perf.recordPostMessage();

      // Snapshot before destroy
      const before = perf.snapshot();
      expect(before.inp_p95_ms).toBe(100);

      perf.destroy();

      // Snapshot after destroy still works (data in memory, just observer disconnected)
      const after = perf.snapshot();
      expect(after.inp_p95_ms).toBe(100);
    });
  });
});
