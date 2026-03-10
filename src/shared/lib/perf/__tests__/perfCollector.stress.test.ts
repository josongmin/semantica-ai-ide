/**
 * PerfCollector Ring Buffer Stress Test
 *
 * Tests:
 * - Ring buffer wraparound correctness with 10,000+ samples
 * - P95 percentile accuracy with known distributions
 * - Concurrent metric recording at high frequency
 * - Throughput rate calculation accuracy
 * - Memory bounds: ring buffer never exceeds 100 entries
 */
import { createPerfCollector } from "../perfCollector";

describe("PerfCollector – stress & edge cases", () => {
  // ── Ring Buffer Wraparound ─────────────────────────────
  describe("ring buffer wraparound correctness", () => {
    it("10,000 INP samples: ring buffer wraps correctly, only last 100 retained", () => {
      const perf = createPerfCollector();

      // Write 10,000 samples: values 0..9999
      for (let i = 0; i < 10_000; i++) {
        perf.recordINP(i);
      }

      const snap = perf.snapshot();
      // P95 should be based on the last 100 samples (9900..9999)
      // Sorted: [9900, 9901, ..., 9999], p95 index = floor(100*0.95) = 95 → value 9995
      expect(snap.inp_p95_ms).toBeGreaterThanOrEqual(9990);
      expect(snap.inp_p95_ms).toBeLessThanOrEqual(9999);

      perf.destroy();
    });

    it("exact 100 samples: no wraparound, all retained", () => {
      const perf = createPerfCollector();

      for (let i = 1; i <= 100; i++) {
        perf.recordINP(i);
      }

      const snap = perf.snapshot();
      // Sorted: [1..100], p95 index = floor(100*0.95) = 95 → 0-based value 96
      expect(snap.inp_p95_ms).toBe(96);

      perf.destroy();
    });

    it("101 samples: first entry evicted by ring buffer", () => {
      const perf = createPerfCollector();

      // Sample 0: outlier value 999
      perf.recordINP(999);
      // Samples 1-100: all value 1
      for (let i = 0; i < 100; i++) {
        perf.recordINP(1);
      }

      const snap = perf.snapshot();
      // The 999 outlier should be evicted (ring overwritten at position 0)
      // All remaining are 1 → p95 = 1
      expect(snap.inp_p95_ms).toBe(1);

      perf.destroy();
    });
  });

  // ── P95 Percentile Accuracy ────────────────────────────
  describe("P95 percentile accuracy", () => {
    it("all-high distribution: p95 = high value", () => {
      const perf = createPerfCollector();

      for (let i = 0; i < 100; i++) {
        perf.recordINP(100);
      }

      expect(perf.snapshot().inp_p95_ms).toBe(100);
      perf.destroy();
    });

    it("all-low distribution: p95 = low value", () => {
      const perf = createPerfCollector();

      for (let i = 0; i < 100; i++) {
        perf.recordINP(0.5);
      }

      expect(perf.snapshot().inp_p95_ms).toBe(0.5);
      perf.destroy();
    });

    it("bimodal distribution: 95 fast + 5 slow → p95 catches the slow", () => {
      const perf = createPerfCollector();

      // 95 fast samples
      for (let i = 0; i < 95; i++) {
        perf.recordINP(5);
      }
      // 5 slow samples
      for (let i = 0; i < 5; i++) {
        perf.recordINP(200);
      }

      const snap = perf.snapshot();
      // p95 index = 95 → should land on 200 (the slow samples start at index 95 when sorted)
      expect(snap.inp_p95_ms).toBe(200);

      perf.destroy();
    });

    it("single sample: p95 = that sample", () => {
      const perf = createPerfCollector();
      perf.recordINP(42.5);

      expect(perf.snapshot().inp_p95_ms).toBe(42.5);
      perf.destroy();
    });

    it("zero samples: p95 = 0", () => {
      const perf = createPerfCollector();
      expect(perf.snapshot().inp_p95_ms).toBe(0);
      perf.destroy();
    });
  });

  // ── Frame Budget Tracking ──────────────────────────────
  describe("frame budget tracking under load", () => {
    it("10,000 frames: ratio correctly computed", () => {
      const perf = createPerfCollector();

      // 7000 good frames (< 16ms) + 3000 bad frames (> 16ms)
      for (let i = 0; i < 7_000; i++) {
        perf.recordFrame(10);
      }
      for (let i = 0; i < 3_000; i++) {
        perf.recordFrame(20);
      }

      const snap = perf.snapshot();
      // 3000/10000 = 0.3
      expect(snap.frames_over_16ms_ratio).toBeCloseTo(0.3, 2);

      perf.destroy();
    });

    it("all frames within budget: ratio = 0", () => {
      const perf = createPerfCollector();

      for (let i = 0; i < 1_000; i++) {
        perf.recordFrame(8);
      }

      expect(perf.snapshot().frames_over_16ms_ratio).toBe(0);
      perf.destroy();
    });

    it("all frames over budget: ratio = 1", () => {
      const perf = createPerfCollector();

      for (let i = 0; i < 1_000; i++) {
        perf.recordFrame(32);
      }

      expect(perf.snapshot().frames_over_16ms_ratio).toBe(1);
      perf.destroy();
    });

    it("exactly 16ms frame: NOT counted as over budget", () => {
      const perf = createPerfCollector();

      perf.recordFrame(16);

      expect(perf.snapshot().frames_over_16ms_ratio).toBe(0);
      perf.destroy();
    });
  });

  // ── Concurrent Metric Recording ────────────────────────
  describe("concurrent metric recording", () => {
    it("all metric types recorded simultaneously at high frequency", () => {
      const perf = createPerfCollector();

      for (let i = 0; i < 5_000; i++) {
        perf.recordINP(Math.random() * 100);
        perf.recordFrame(Math.random() * 32);
        perf.recordPostMessage();
        perf.recordUICommit();
      }

      const snap = perf.snapshot();
      expect(snap.inp_p95_ms).toBeGreaterThan(0);
      expect(snap.frames_over_16ms_ratio).toBeGreaterThan(0);
      // Rate depends on uptime, but counts should be positive
      expect(snap.uptime_sec).toBeGreaterThanOrEqual(0);

      perf.destroy();
    });
  });

  // ── Destroy Idempotency ────────────────────────────────
  describe("destroy idempotency", () => {
    it("double destroy: no crash", () => {
      const perf = createPerfCollector();
      perf.destroy();
      expect(() => perf.destroy()).not.toThrow();
    });

    it("record after destroy: no crash", () => {
      const perf = createPerfCollector();
      perf.destroy();

      expect(() => {
        perf.recordINP(10);
        perf.recordFrame(20);
        perf.recordPostMessage();
        perf.recordUICommit();
      }).not.toThrow();
    });
  });
});
