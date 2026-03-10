import React from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { turnOrderAtom } from "~entities/message/turns";
import { focusedTurnIndexAtom } from "~shared/lib/atoms";
import type { TurnId } from "~shared/protocol";

import { FOCUS_PROMPT_EVENT, useKeyboardNavigation } from "../model/useKeyboardNavigation";

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(Provider, { store }, children);
  };
}

function fireKey(key: string, target?: HTMLElement) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
  });
  (target ?? document).dispatchEvent(event);
}

describe("useKeyboardNavigation", () => {
  let store: ReturnType<typeof createStore>;
  let scrollToIndex: (index: number) => void;

  beforeEach(() => {
    store = createStore();
    scrollToIndex = vi.fn<(index: number) => void>();
    store.set(
      turnOrderAtom,
      ["t1", "t2", "t3"].map((id) => id as TurnId),
    );
    store.set(focusedTurnIndexAtom, -1);
  });

  it("j key moves focus to next turn", () => {
    renderHook(() => useKeyboardNavigation({ scrollToIndex }), {
      wrapper: createWrapper(store),
    });

    act(() => fireKey("j"));

    expect(store.get(focusedTurnIndexAtom)).toBe(0);
    expect(scrollToIndex).toHaveBeenCalledWith(0);
  });

  it("k key moves focus to previous turn", () => {
    store.set(focusedTurnIndexAtom, 2);
    renderHook(() => useKeyboardNavigation({ scrollToIndex }), {
      wrapper: createWrapper(store),
    });

    act(() => fireKey("k"));

    expect(store.get(focusedTurnIndexAtom)).toBe(1);
    expect(scrollToIndex).toHaveBeenCalledWith(1);
  });

  it("j wraps around to first turn", () => {
    store.set(focusedTurnIndexAtom, 2);
    renderHook(() => useKeyboardNavigation({ scrollToIndex }), {
      wrapper: createWrapper(store),
    });

    act(() => fireKey("j"));

    expect(store.get(focusedTurnIndexAtom)).toBe(0);
  });

  it("k wraps around to last turn", () => {
    store.set(focusedTurnIndexAtom, 0);
    renderHook(() => useKeyboardNavigation({ scrollToIndex }), {
      wrapper: createWrapper(store),
    });

    act(() => fireKey("k"));

    expect(store.get(focusedTurnIndexAtom)).toBe(2);
  });

  it("G key focuses last turn", () => {
    renderHook(() => useKeyboardNavigation({ scrollToIndex }), {
      wrapper: createWrapper(store),
    });

    act(() => fireKey("G"));

    expect(store.get(focusedTurnIndexAtom)).toBe(2);
    expect(scrollToIndex).toHaveBeenCalledWith(2);
  });

  it("Escape key clears focus", () => {
    store.set(focusedTurnIndexAtom, 1);
    renderHook(() => useKeyboardNavigation({ scrollToIndex }), {
      wrapper: createWrapper(store),
    });

    act(() => fireKey("Escape"));

    expect(store.get(focusedTurnIndexAtom)).toBe(-1);
  });

  it("/ key dispatches FOCUS_PROMPT_EVENT", () => {
    const eventSpy = vi.fn();
    document.addEventListener(FOCUS_PROMPT_EVENT, eventSpy);

    renderHook(() => useKeyboardNavigation({ scrollToIndex }), {
      wrapper: createWrapper(store),
    });

    act(() => fireKey("/"));

    expect(eventSpy).toHaveBeenCalledOnce();

    document.removeEventListener(FOCUS_PROMPT_EVENT, eventSpy);
  });

  it("ignores keys when input is focused", () => {
    renderHook(() => useKeyboardNavigation({ scrollToIndex }), {
      wrapper: createWrapper(store),
    });

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    act(() => fireKey("j", input));

    // Focus should not change
    expect(store.get(focusedTurnIndexAtom)).toBe(-1);

    document.body.removeChild(input);
  });

  it("ignores keys when textarea is focused", () => {
    renderHook(() => useKeyboardNavigation({ scrollToIndex }), {
      wrapper: createWrapper(store),
    });

    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.focus();

    act(() => fireKey("j", textarea));

    expect(store.get(focusedTurnIndexAtom)).toBe(-1);

    document.body.removeChild(textarea);
  });

  it("returns focusedIndex", () => {
    store.set(focusedTurnIndexAtom, 1);
    const { result } = renderHook(() => useKeyboardNavigation({ scrollToIndex }), {
      wrapper: createWrapper(store),
    });

    expect(result.current.focusedIndex).toBe(1);
  });

  it("does nothing for j/k when no turns exist", () => {
    store.set(turnOrderAtom, []);
    renderHook(() => useKeyboardNavigation({ scrollToIndex }), {
      wrapper: createWrapper(store),
    });

    act(() => fireKey("j"));

    expect(scrollToIndex).not.toHaveBeenCalled();
    expect(store.get(focusedTurnIndexAtom)).toBe(-1);
  });

  it("cleans up event listener on unmount", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderHook(() => useKeyboardNavigation({ scrollToIndex }), {
      wrapper: createWrapper(store),
    });

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    removeSpy.mockRestore();
  });
});
