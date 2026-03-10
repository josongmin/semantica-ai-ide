/**
 * RFC-003 Performance Collector
 *
 * Lightweight performance metrics collection for the webview.
 * Uses a fixed-size ring buffer for INP samples to bound memory.
 * Exposes metrics via `window.__perf` for debugging.
 */

export interface PerfSnapshot {
  readonly inp_p95_ms: number;
  readonly long_tasks: number;
  readonly frames_over_16ms_ratio: number;
  readonly heap_mb: number;
  readonly post_message_rx_per_sec: number;
  readonly ui_commit_per_sec: number;
  readonly uptime_sec: number;
}

export interface PerfCollector {
  recordINP(ms: number): void;
  recordFrame(ms: number): void;
  recordPostMessage(): void;
  recordUICommit(): void;
  snapshot(): PerfSnapshot;
  destroy(): void;
}

const INP_RING_SIZE = 100;
const BYTES_PER_MB = 1024 * 1024;
const FRAME_BUDGET_MS = 16;

/** Chrome-only Performance.memory API */
interface PerformanceWithMemory extends Performance {
  memory?: { readonly usedJSHeapSize: number };
}

/** Dev-only global for debugging perf metrics */
declare global {
  var __perf: PerfCollector | undefined;
}

export function createPerfCollector(): PerfCollector {
  const startTime = performance.now();

  // Ring buffer for INP samples — avoids shift() O(n) cost
  const inpRing = new Float64Array(INP_RING_SIZE);
  let inpHead = 0;
  let inpCount = 0;

  let longTaskCount = 0;
  let frameOverCount = 0;
  let totalFrames = 0;
  let postMessageCount = 0;
  let uiCommitCount = 0;

  let longTaskObserver: PerformanceObserver | null = null;
  try {
    longTaskObserver = new PerformanceObserver((list) => {
      longTaskCount += list.getEntries().length;
    });
    longTaskObserver.observe({ entryTypes: ["longtask"] });
  } catch {
    /* silently ignore — PerformanceObserver 'longtask' is not supported in all environments */
  }

  function recordINP(ms: number) {
    inpRing[inpHead] = ms;
    inpHead = (inpHead + 1) % INP_RING_SIZE;
    if (inpCount < INP_RING_SIZE) inpCount++;
  }

  function recordFrame(ms: number) {
    totalFrames++;
    if (ms > FRAME_BUDGET_MS) frameOverCount++;
  }

  function recordPostMessage() {
    postMessageCount++;
  }

  function recordUICommit() {
    uiCommitCount++;
  }

  function snapshot(): PerfSnapshot {
    const uptimeSec = (performance.now() - startTime) / 1000;

    // Extract and sort filled portion of ring buffer for percentile
    const samples = Array.from(inpRing.subarray(0, inpCount)).sort((a, b) => a - b);
    const p95Index = Math.min(Math.floor(samples.length * 0.95), samples.length - 1);
    const inpP95 = samples.length > 0 ? (samples[p95Index] ?? 0) : 0;

    const usedHeap = (performance as PerformanceWithMemory).memory?.usedJSHeapSize;
    const heapMb = usedHeap !== undefined ? usedHeap / BYTES_PER_MB : 0;

    return {
      inp_p95_ms: Math.round(inpP95 * 100) / 100,
      long_tasks: longTaskCount,
      frames_over_16ms_ratio:
        totalFrames > 0 ? Math.round((frameOverCount / totalFrames) * 1000) / 1000 : 0,
      heap_mb: Math.round(heapMb * 10) / 10,
      post_message_rx_per_sec:
        uptimeSec > 0 ? Math.round((postMessageCount / uptimeSec) * 10) / 10 : 0,
      ui_commit_per_sec: uptimeSec > 0 ? Math.round((uiCommitCount / uptimeSec) * 10) / 10 : 0,
      uptime_sec: Math.round(uptimeSec * 10) / 10,
    };
  }

  function destroy() {
    longTaskObserver?.disconnect();
    longTaskObserver = null;
    // Clean up global reference
    if (import.meta.env.DEV && globalThis.__perf === collector) {
      globalThis.__perf = undefined;
    }
  }

  const collector: PerfCollector = {
    recordINP,
    recordFrame,
    recordPostMessage,
    recordUICommit,
    snapshot,
    destroy,
  };

  // Only expose on window in dev for debugging — avoid info leak in production
  if (import.meta.env.DEV) {
    globalThis.__perf = collector;
  }

  return collector;
}
