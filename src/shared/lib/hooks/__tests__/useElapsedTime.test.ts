import { act, renderHook } from "@testing-library/react";

import { useElapsedTime } from "../useElapsedTime";

// Mock requestAnimationFrame
let rafCallbacks: ((time: number) => void)[] = [];
let rafId = 0;

beforeEach(() => {
  rafCallbacks = [];
  rafId = 0;

  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    rafCallbacks.push(cb);
    return ++rafId;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {
    rafCallbacks = [];
  });
  vi.spyOn(Date, "now").mockReturnValue(1000);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function flushRaf() {
  const cbs = [...rafCallbacks];
  rafCallbacks = [];
  for (const cb of cbs) cb(performance.now());
}

describe("useElapsedTime", () => {
  it("returns empty string when inactive", () => {
    const { result } = renderHook(() => useElapsedTime(false));
    expect(result.current).toBe("");
  });

  it('returns formatted time when active (e.g., "0.0s")', () => {
    vi.mocked(Date.now).mockReturnValue(1000);
    const { result } = renderHook(() => useElapsedTime(true, 1000));

    act(() => flushRaf());

    // 0ms elapsed → "0.0s"
    expect(result.current).toBe("0.0s");
  });

  it("formats sub-second times", () => {
    vi.mocked(Date.now).mockReturnValue(1500);
    const { result } = renderHook(() => useElapsedTime(true, 1000));

    act(() => flushRaf());

    expect(result.current).toBe("0.5s");
  });

  it("formats second-level times", () => {
    vi.mocked(Date.now).mockReturnValue(6000);
    const { result } = renderHook(() => useElapsedTime(true, 1000));

    act(() => flushRaf());

    expect(result.current).toBe("5s");
  });

  it("formats minute-level times", () => {
    vi.mocked(Date.now).mockReturnValue(76000);
    const { result } = renderHook(() => useElapsedTime(true, 1000));

    act(() => flushRaf());

    expect(result.current).toBe("1m 15s");
  });

  it("resets to empty string when deactivated", async () => {
    const { result, rerender } = renderHook(
      ({ active }: { active: boolean }) => useElapsedTime(active, 1000),
      { initialProps: { active: true } },
    );

    vi.mocked(Date.now).mockReturnValue(3000);
    act(() => flushRaf());
    expect(result.current).not.toBe("");

    // Clear any pending rAF callbacks before rerendering
    rafCallbacks = [];
    // queueMicrotask is used internally for reset — await act to flush it
    await act(async () => {
      rerender({ active: false });
    });
    expect(result.current).toBe("");
  });

  it("calls requestAnimationFrame when active", () => {
    renderHook(() => useElapsedTime(true, 1000));
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it("calls cancelAnimationFrame on cleanup", () => {
    const { unmount } = renderHook(() => useElapsedTime(true, 1000));
    unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });

  it("does not call requestAnimationFrame when inactive", () => {
    vi.mocked(window.requestAnimationFrame).mockClear();
    renderHook(() => useElapsedTime(false));
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });
});
