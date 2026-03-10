/**
 * Shared rAF mock for streaming tests.
 *
 * Provides deterministic requestAnimationFrame control so tests can
 * push deltas and explicitly flush at known points.
 *
 * Usage:
 *   import { flushAllRaf, rafScheduleCount, resetRafMock } from "…/tests/utils/raf-mock";
 *   beforeEach(() => resetRafMock());
 */

let rafCallbacks: FrameRequestCallback[] = [];
let rafId = 0;
let _rafScheduleCount = 0;

/** Number of times requestAnimationFrame was called since last reset. */
export function rafScheduleCount(): number {
  return _rafScheduleCount;
}

// Install stubs at import time (vi.stubGlobal is idempotent across re-imports)
vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
  rafCallbacks.push(cb);
  _rafScheduleCount++;
  return ++rafId;
});
vi.stubGlobal("cancelAnimationFrame", vi.fn());

/** Drain all queued rAF callbacks (repeatedly until empty). */
export function flushAllRaf(): void {
  while (rafCallbacks.length > 0) {
    const batch = [...rafCallbacks];
    rafCallbacks = [];
    batch.forEach((cb) => cb(performance.now()));
  }
}

/** Reset rAF mock state. Call in beforeEach(). */
export function resetRafMock(): void {
  rafCallbacks = [];
  rafId = 0;
  _rafScheduleCount = 0;
  vi.mocked(cancelAnimationFrame).mockClear();
}
