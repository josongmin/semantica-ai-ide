import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import {
  markPrefetchedAtom,
  prefetchedSessionsAtom,
  resetPrefetchedSessionsAtom,
} from "../model/prefetchAtoms";
import { useSessionPrefetch } from "../model/useSessionPrefetch";

// ─── Mock vscodeApi ────────────────────────────────────────
const mockPostMessage = vi.fn();

vi.mock("~shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

// ─── Helpers ───────────────────────────────────────────────
function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}

// ─── Atom Tests ────────────────────────────────────────────
describe("prefetchAtoms", () => {
  it("starts with an empty set", () => {
    const store = createStore();
    expect(store.get(prefetchedSessionsAtom).size).toBe(0);
  });

  it("markPrefetchedAtom adds a session ID", () => {
    const store = createStore();
    store.set(markPrefetchedAtom, "session_1");

    expect(store.get(prefetchedSessionsAtom).has("session_1")).toBe(true);
  });

  it("markPrefetchedAtom is idempotent for same session", () => {
    const store = createStore();
    store.set(markPrefetchedAtom, "session_1");
    store.set(markPrefetchedAtom, "session_1");

    expect(store.get(prefetchedSessionsAtom).size).toBe(1);
  });

  it("resetPrefetchedSessionsAtom clears all entries", () => {
    const store = createStore();
    store.set(markPrefetchedAtom, "session_1");
    store.set(markPrefetchedAtom, "session_2");
    store.set(resetPrefetchedSessionsAtom);

    expect(store.get(prefetchedSessionsAtom).size).toBe(0);
  });
});

// ─── Hook Tests ────────────────────────────────────────────
describe("useSessionPrefetch", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not prefetch immediately on mouse enter", () => {
    const store = createStore();
    const { result } = renderHook(() => useSessionPrefetch("session_1"), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.onMouseEnter();
    });

    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it("prefetches after 200ms debounce", () => {
    const store = createStore();
    const { result } = renderHook(() => useSessionPrefetch("session_1"), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.onMouseEnter();
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "PREFETCH_SESSION",
      session_id: "session_1",
    });
  });

  it("cancels prefetch on mouse leave before debounce", () => {
    const store = createStore();
    const { result } = renderHook(() => useSessionPrefetch("session_1"), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.onMouseEnter();
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current.onMouseLeave();
    });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it("does not send duplicate prefetch for same session", () => {
    const store = createStore();
    const { result } = renderHook(() => useSessionPrefetch("session_1"), {
      wrapper: createWrapper(store),
    });

    // First hover
    act(() => {
      result.current.onMouseEnter();
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(1);

    // Second hover - should not send again
    act(() => {
      result.current.onMouseEnter();
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });

  it("reports isPrefetched correctly", () => {
    const store = createStore();
    const { result } = renderHook(() => useSessionPrefetch("session_1"), {
      wrapper: createWrapper(store),
    });

    expect(result.current.isPrefetched).toBe(false);

    act(() => {
      result.current.onMouseEnter();
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.isPrefetched).toBe(true);
  });

  it("marks session in prefetched set after successful prefetch", () => {
    const store = createStore();
    const { result } = renderHook(() => useSessionPrefetch("session_1"), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.onMouseEnter();
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(store.get(prefetchedSessionsAtom).has("session_1")).toBe(true);
  });
});
