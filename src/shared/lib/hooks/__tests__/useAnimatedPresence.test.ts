import { act, renderHook } from "@testing-library/react";

import { useAnimatedPresence } from "../useAnimatedPresence";

describe("useAnimatedPresence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("mounted is false when open starts as false", () => {
    const { result } = renderHook(() => useAnimatedPresence(false));

    expect(result.current.mounted).toBe(false);
  });

  it("mounted becomes true when open becomes true", () => {
    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) => useAnimatedPresence(open),
      { initialProps: { open: false } },
    );

    rerender({ open: true });

    expect(result.current.mounted).toBe(true);
  });

  it("exiting is false while open is true", () => {
    const { result } = renderHook(() => useAnimatedPresence(true));

    expect(result.current.exiting).toBe(false);
  });

  it("exiting becomes true immediately when open becomes false", () => {
    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) => useAnimatedPresence(open),
      { initialProps: { open: true } },
    );

    rerender({ open: false });

    expect(result.current.exiting).toBe(true);
    expect(result.current.mounted).toBe(true);
  });

  it("mounted becomes false after exitDurationMs elapses", () => {
    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) => useAnimatedPresence(open, 200),
      { initialProps: { open: true } },
    );

    rerender({ open: false });

    expect(result.current.mounted).toBe(true);
    expect(result.current.exiting).toBe(true);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.mounted).toBe(false);
  });

  it("exiting resets to false after unmount completes", () => {
    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) => useAnimatedPresence(open, 150),
      { initialProps: { open: true } },
    );

    rerender({ open: false });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(result.current.mounted).toBe(false);
    expect(result.current.exiting).toBe(false);
  });

  it("rapid open-close-open: cancels exit, stays mounted", () => {
    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) => useAnimatedPresence(open, 150),
      { initialProps: { open: true } },
    );

    // close
    rerender({ open: false });
    expect(result.current.exiting).toBe(true);

    // re-open before timer fires
    rerender({ open: true });

    expect(result.current.mounted).toBe(true);
    expect(result.current.exiting).toBe(false);

    // Advance past the original exit duration — should still be mounted
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.mounted).toBe(true);
    expect(result.current.exiting).toBe(false);
  });

  it("onAnimationEnd triggers immediate unmount (bypasses timer)", () => {
    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) => useAnimatedPresence(open, 5000),
      { initialProps: { open: true } },
    );

    rerender({ open: false });

    expect(result.current.mounted).toBe(true);
    expect(result.current.exiting).toBe(true);

    act(() => {
      result.current.onAnimationEnd();
    });

    expect(result.current.mounted).toBe(false);
    expect(result.current.exiting).toBe(false);
  });

  it("cleanup: timer cleared on unmount", () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout");

    const { rerender, unmount } = renderHook(
      ({ open }: { open: boolean }) => useAnimatedPresence(open, 150),
      { initialProps: { open: true } },
    );

    rerender({ open: false });

    unmount();

    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
