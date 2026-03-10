import React from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { pushOverlayAtom } from "../../atoms";
import { useEscapeDismiss } from "../useEscapeDismiss";

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(Provider, { store }, children);
  };
}

function fireEscape() {
  const event = new KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
  return event;
}

function fireKey(key: string) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
  return event;
}

describe("useEscapeDismiss", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("calls onDismiss when Escape is pressed and active", () => {
    const onDismiss = vi.fn();
    // Push this overlay to the stack so it's the topmost
    store.set(pushOverlayAtom, { id: "d1", type: "dialog" as const, dismiss: null });

    renderHook(() => useEscapeDismiss("d1", true, onDismiss), {
      wrapper: createWrapper(store),
    });

    act(() => {
      fireEscape();
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not call onDismiss when inactive", () => {
    const onDismiss = vi.fn();
    store.set(pushOverlayAtom, { id: "d1", type: "dialog" as const, dismiss: null });

    renderHook(() => useEscapeDismiss("d1", false, onDismiss), {
      wrapper: createWrapper(store),
    });

    act(() => {
      fireEscape();
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("does not call onDismiss for non-Escape keys (e.g., Enter)", () => {
    const onDismiss = vi.fn();
    store.set(pushOverlayAtom, { id: "d1", type: "dialog" as const, dismiss: null });

    renderHook(() => useEscapeDismiss("d1", true, onDismiss), {
      wrapper: createWrapper(store),
    });

    act(() => {
      fireKey("Enter");
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("only fires for the topmost overlay", () => {
    const onDismissFirst = vi.fn();
    const onDismissSecond = vi.fn();

    // Push two overlays to the stack
    store.set(pushOverlayAtom, { id: "d1", type: "dialog" as const, dismiss: null });
    store.set(pushOverlayAtom, { id: "d2", type: "dropdown" as const, dismiss: null });

    const wrapper = createWrapper(store);

    renderHook(() => useEscapeDismiss("d1", true, onDismissFirst), { wrapper });
    renderHook(() => useEscapeDismiss("d2", true, onDismissSecond), { wrapper });

    act(() => {
      fireEscape();
    });

    expect(onDismissSecond).toHaveBeenCalledTimes(1);
    expect(onDismissFirst).not.toHaveBeenCalled();
  });

  it("non-top overlay does NOT dismiss on Escape", () => {
    const onDismiss = vi.fn();

    // Push two overlays; d1 is not on top
    store.set(pushOverlayAtom, { id: "d1", type: "dialog" as const, dismiss: null });
    store.set(pushOverlayAtom, { id: "d2", type: "dropdown" as const, dismiss: null });

    renderHook(() => useEscapeDismiss("d1", true, onDismiss), {
      wrapper: createWrapper(store),
    });

    act(() => {
      fireEscape();
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("cleans up listener on deactivation", () => {
    const onDismiss = vi.fn();
    store.set(pushOverlayAtom, { id: "d1", type: "dialog" as const, dismiss: null });

    const { rerender } = renderHook(
      ({ active }: { active: boolean }) => useEscapeDismiss("d1", active, onDismiss),
      { initialProps: { active: true }, wrapper: createWrapper(store) },
    );

    rerender({ active: false });

    act(() => {
      fireEscape();
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("cleans up listener on unmount", () => {
    const onDismiss = vi.fn();
    store.set(pushOverlayAtom, { id: "d1", type: "dialog" as const, dismiss: null });

    const { unmount } = renderHook(() => useEscapeDismiss("d1", true, onDismiss), {
      wrapper: createWrapper(store),
    });

    unmount();

    act(() => {
      fireEscape();
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("stopPropagation is called on the event", () => {
    const onDismiss = vi.fn();
    store.set(pushOverlayAtom, { id: "d1", type: "dialog" as const, dismiss: null });

    renderHook(() => useEscapeDismiss("d1", true, onDismiss), {
      wrapper: createWrapper(store),
    });

    const stopPropagationSpy = vi.fn();
    const event = new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, "stopPropagation", { value: stopPropagationSpy });

    act(() => {
      document.dispatchEvent(event);
    });

    expect(stopPropagationSpy).toHaveBeenCalled();
  });
});
