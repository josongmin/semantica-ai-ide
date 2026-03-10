import React from "react";
import { renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { overlayStackAtom } from "../../atoms";
import { useOverlayStack } from "../useOverlayStack";
function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(Provider, { store }, children);
  };
}

describe("useOverlayStack", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("does not push to stack when active is false", () => {
    renderHook(() => useOverlayStack("d1", "dialog", false, null), {
      wrapper: createWrapper(store),
    });

    expect(store.get(overlayStackAtom)).toEqual([]);
  });

  it("pushes entry when active becomes true", () => {
    renderHook(() => useOverlayStack("d1", "dialog", true, null), {
      wrapper: createWrapper(store),
    });

    const stack = store.get(overlayStackAtom);
    expect(stack).toHaveLength(1);
    expect(stack[0]).toEqual({ id: "d1", type: "dialog", dismiss: null });
  });

  it("pops entry on unmount (cleanup)", () => {
    const { unmount } = renderHook(() => useOverlayStack("d1", "dialog", true, null), {
      wrapper: createWrapper(store),
    });

    expect(store.get(overlayStackAtom)).toHaveLength(1);

    unmount();

    expect(store.get(overlayStackAtom)).toEqual([]);
  });

  it("pops entry when active transitions to false", () => {
    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => useOverlayStack("d1", "dialog", active, null),
      { initialProps: { active: true }, wrapper: createWrapper(store) },
    );

    expect(store.get(overlayStackAtom)).toHaveLength(1);

    rerender({ active: false });

    expect(store.get(overlayStackAtom)).toEqual([]);
  });

  it("isTop returns true when overlay is the only one", () => {
    const { result } = renderHook(() => useOverlayStack("d1", "dialog", true, null), {
      wrapper: createWrapper(store),
    });

    expect(result.current.isTop).toBe(true);
  });

  it("isTop returns true for the last-pushed overlay", () => {
    const wrapper = createWrapper(store);

    renderHook(() => useOverlayStack("d1", "dialog", true, null), { wrapper });
    const { result } = renderHook(() => useOverlayStack("d2", "dropdown", true, null), { wrapper });

    expect(result.current.isTop).toBe(true);
  });

  it("isTop returns false for non-top overlays", () => {
    const wrapper = createWrapper(store);

    const { result: first } = renderHook(() => useOverlayStack("d1", "dialog", true, null), {
      wrapper,
    });
    renderHook(() => useOverlayStack("d2", "dropdown", true, null), {
      wrapper,
    });

    expect(first.current.isTop).toBe(false);
  });

  it("multiple overlays: stack maintains order", () => {
    const wrapper = createWrapper(store);

    renderHook(() => useOverlayStack("a", "dialog", true, null), { wrapper });
    renderHook(() => useOverlayStack("b", "dropdown", true, null), { wrapper });
    renderHook(() => useOverlayStack("c", "popover", true, null), { wrapper });

    const stack = store.get(overlayStackAtom);
    expect(stack.map((e) => e.id)).toEqual(["a", "b", "c"]);
  });

  it("handles rapid mount/unmount without stale state", () => {
    const wrapper = createWrapper(store);

    const { unmount: unmount1 } = renderHook(() => useOverlayStack("d1", "dialog", true, null), {
      wrapper,
    });

    unmount1();

    const { unmount: unmount2 } = renderHook(() => useOverlayStack("d2", "dialog", true, null), {
      wrapper,
    });

    const stack = store.get(overlayStackAtom);
    expect(stack).toHaveLength(1);
    expect(stack[0]?.id).toBe("d2");

    unmount2();

    expect(store.get(overlayStackAtom)).toEqual([]);
  });
});
