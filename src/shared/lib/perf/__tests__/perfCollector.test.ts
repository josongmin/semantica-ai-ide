import { createPerfCollector, type PerfCollector } from "../perfCollector";

describe("perfCollector", () => {
  let collector: PerfCollector;

  beforeEach(() => {
    collector = createPerfCollector();
  });

  afterEach(() => {
    collector.destroy();
  });

  it("returns zero snapshot initially", () => {
    const snap = collector.snapshot();
    expect(snap.inp_p95_ms).toBe(0);
    expect(snap.long_tasks).toBe(0);
    expect(snap.frames_over_16ms_ratio).toBe(0);
    expect(snap.post_message_rx_per_sec).toBeGreaterThanOrEqual(0);
    expect(snap.ui_commit_per_sec).toBeGreaterThanOrEqual(0);
    expect(snap.uptime_sec).toBeGreaterThanOrEqual(0);
  });

  it("records INP samples and computes p95", () => {
    // Insert 100 samples: 1..100
    for (let i = 1; i <= 100; i++) {
      collector.recordINP(i);
    }
    const snap = collector.snapshot();
    // p95 of 1..100 should be ~95
    expect(snap.inp_p95_ms).toBeGreaterThanOrEqual(95);
    expect(snap.inp_p95_ms).toBeLessThanOrEqual(100);
  });

  it("ring buffer wraps after 100 samples", () => {
    // Insert 150 samples — only last 100 should be kept
    for (let i = 1; i <= 150; i++) {
      collector.recordINP(i);
    }
    const snap = collector.snapshot();
    // p95 of 51..150 should be around 145
    expect(snap.inp_p95_ms).toBeGreaterThanOrEqual(140);
  });

  it("tracks frame budget violations", () => {
    collector.recordFrame(10); // OK
    collector.recordFrame(20); // over 16ms
    collector.recordFrame(8); // OK
    collector.recordFrame(50); // over 16ms

    const snap = collector.snapshot();
    expect(snap.frames_over_16ms_ratio).toBe(0.5); // 2/4
  });

  it("counts postMessage and uiCommit", () => {
    collector.recordPostMessage();
    collector.recordPostMessage();
    collector.recordPostMessage();
    collector.recordUICommit();

    const snap = collector.snapshot();
    expect(snap.post_message_rx_per_sec).toBeGreaterThan(0);
    expect(snap.ui_commit_per_sec).toBeGreaterThan(0);
  });

  it("exposes collector on window.__perf", () => {
    expect((window as unknown as Record<string, unknown>).__perf).toBe(collector);
  });

  it("destroy disconnects observer", () => {
    collector.destroy();
    // After destroy, snapshot still works (no throw)
    const snap = collector.snapshot();
    expect(snap.uptime_sec).toBeGreaterThanOrEqual(0);
  });

  it("heap_mb is a number", () => {
    const snap = collector.snapshot();
    expect(typeof snap.heap_mb).toBe("number");
    expect(snap.heap_mb).toBeGreaterThanOrEqual(0);
  });
});
