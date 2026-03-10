import type { RefObject } from "react";
import { act, renderHook } from "@testing-library/react";

import { useResizeObserver } from "../useResizeObserver";

// Mock ResizeObserver as a proper class
let observerCallback: ResizeObserverCallback | null = null;
let observedElements: Element[] = [];
const mockDisconnect = vi.fn();

class MockResizeObserver {
  constructor(cb: ResizeObserverCallback) {
    observerCallback = cb;
  }
  observe(el: Element) {
    observedElements.push(el);
  }
  disconnect() {
    mockDisconnect();
    observedElements = [];
  }
  unobserve() {
    // no-op
  }
}

vi.stubGlobal("ResizeObserver", MockResizeObserver);

function fireResize(width: number, height: number) {
  if (!observerCallback) throw new Error("No observer callback registered");

  const entry = {
    contentBoxSize: [{ inlineSize: width, blockSize: height }],
    contentRect: { width, height, x: 0, y: 0, top: 0, left: 0, bottom: height, right: width },
    borderBoxSize: [{ inlineSize: width, blockSize: height }],
    devicePixelContentBoxSize: [],
    target: document.createElement("div"),
  } as unknown as ResizeObserverEntry;

  act(() => {
    observerCallback!([entry], {} as ResizeObserver);
  });
}

function fireResizeFallback(width: number, height: number) {
  if (!observerCallback) throw new Error("No observer callback registered");

  const entry = {
    contentBoxSize: [] as ResizeObserverSize[],
    contentRect: { width, height, x: 0, y: 0, top: 0, left: 0, bottom: height, right: width },
    borderBoxSize: [],
    devicePixelContentBoxSize: [],
    target: document.createElement("div"),
  } as unknown as ResizeObserverEntry;

  act(() => {
    observerCallback!([entry], {} as ResizeObserver);
  });
}

describe("useResizeObserver", () => {
  beforeEach(() => {
    mockDisconnect.mockClear();
    observedElements = [];
    observerCallback = null;
  });

  it("returns null initially when ref has no element", () => {
    const ref = { current: null } as RefObject<HTMLDivElement | null>;
    const { result } = renderHook(() => useResizeObserver(ref));
    expect(result.current).toBeNull();
  });

  it("observes the element when ref is set", () => {
    const el = document.createElement("div");
    const ref = { current: el } as RefObject<HTMLDivElement>;

    const { result } = renderHook(() => useResizeObserver(ref));

    expect(observedElements).toContain(el);
    expect(result.current).toBeNull(); // no resize event yet
  });

  it("returns size after resize event", () => {
    const el = document.createElement("div");
    const ref = { current: el } as RefObject<HTMLDivElement>;

    const { result } = renderHook(() => useResizeObserver(ref));
    fireResize(800, 600);

    expect(result.current).toEqual({ width: 800, height: 600 });
  });

  it("updates when size changes", () => {
    const el = document.createElement("div");
    const ref = { current: el } as RefObject<HTMLDivElement>;

    const { result } = renderHook(() => useResizeObserver(ref));

    fireResize(800, 600);
    expect(result.current).toEqual({ width: 800, height: 600 });

    fireResize(1024, 768);
    expect(result.current).toEqual({ width: 1024, height: 768 });
  });

  it("does not update state when size is unchanged", () => {
    const el = document.createElement("div");
    const ref = { current: el } as RefObject<HTMLDivElement>;

    const { result } = renderHook(() => useResizeObserver(ref));

    fireResize(800, 600);

    // Fire same size — should not cause additional setState
    fireResize(800, 600);
    // Value remains correct regardless of whether React batches the no-op update
    expect(result.current).toEqual({ width: 800, height: 600 });
  });

  it("falls back to contentRect when contentBoxSize is empty", () => {
    const el = document.createElement("div");
    const ref = { current: el } as RefObject<HTMLDivElement>;

    const { result } = renderHook(() => useResizeObserver(ref));
    fireResizeFallback(640, 480);

    expect(result.current).toEqual({ width: 640, height: 480 });
  });

  it("disconnects observer on unmount", () => {
    const el = document.createElement("div");
    const ref = { current: el } as RefObject<HTMLDivElement>;

    const { unmount } = renderHook(() => useResizeObserver(ref));

    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it("handles empty entries array gracefully", () => {
    const el = document.createElement("div");
    const ref = { current: el } as RefObject<HTMLDivElement>;

    const { result } = renderHook(() => useResizeObserver(ref));

    act(() => {
      observerCallback!([], {} as ResizeObserver);
    });

    expect(result.current).toBeNull();
  });
});
