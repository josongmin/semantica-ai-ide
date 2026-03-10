import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { promptHistoryAtom, pushPromptHistoryAtom } from "../model/promptHistoryAtoms";
import { usePromptHistory } from "../model/usePromptHistory";

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}

describe("promptHistoryAtoms", () => {
  it("pushes entries to front of history", () => {
    const store = createStore();
    store.set(pushPromptHistoryAtom, "hello");
    store.set(pushPromptHistoryAtom, "world");

    expect(store.get(promptHistoryAtom)).toEqual(["world", "hello"]);
  });

  it("deduplicates consecutive identical entries", () => {
    const store = createStore();
    store.set(pushPromptHistoryAtom, "hello");
    store.set(pushPromptHistoryAtom, "hello");

    expect(store.get(promptHistoryAtom)).toEqual(["hello"]);
  });

  it("limits history to MAX_HISTORY_SIZE", () => {
    const store = createStore();
    for (let i = 0; i < 60; i++) {
      store.set(pushPromptHistoryAtom, `msg-${i}`);
    }

    expect(store.get(promptHistoryAtom)).toHaveLength(50);
    expect(store.get(promptHistoryAtom)[0]).toBe("msg-59");
  });
});

describe("usePromptHistory", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("push adds to history", () => {
    const { result } = renderHook(() => usePromptHistory(), {
      wrapper: createWrapper(store),
    });

    act(() => result.current.push("hello"));

    expect(store.get(promptHistoryAtom)).toEqual(["hello"]);
  });

  it("navigate up returns most recent entry", () => {
    store.set(pushPromptHistoryAtom, "first");
    store.set(pushPromptHistoryAtom, "second");

    const { result } = renderHook(() => usePromptHistory(), {
      wrapper: createWrapper(store),
    });

    let text: string | null = null;
    act(() => {
      text = result.current.navigate("up", "current draft");
    });

    expect(text).toBe("second");
  });

  it("navigate up twice returns older entry", () => {
    store.set(pushPromptHistoryAtom, "first");
    store.set(pushPromptHistoryAtom, "second");

    const { result } = renderHook(() => usePromptHistory(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.navigate("up", "draft");
    });
    let text: string | null = null;
    act(() => {
      text = result.current.navigate("up", "");
    });

    expect(text).toBe("first");
  });

  it("navigate down from history returns to draft", () => {
    store.set(pushPromptHistoryAtom, "first");
    store.set(pushPromptHistoryAtom, "second");

    const { result } = renderHook(() => usePromptHistory(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.navigate("up", "my draft");
    });

    let text: string | null = null;
    act(() => {
      text = result.current.navigate("down", "");
    });

    expect(text).toBe("my draft");
  });

  it("navigate up at oldest entry returns null", () => {
    store.set(pushPromptHistoryAtom, "only");

    const { result } = renderHook(() => usePromptHistory(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.navigate("up", "");
    });

    let text: string | null = null;
    act(() => {
      text = result.current.navigate("up", "");
    });

    expect(text).toBeNull();
  });

  it("navigate down when not in history returns null", () => {
    const { result } = renderHook(() => usePromptHistory(), {
      wrapper: createWrapper(store),
    });

    let text: string | null = null;
    act(() => {
      text = result.current.navigate("down", "");
    });

    expect(text).toBeNull();
  });

  it("navigate returns null for empty history", () => {
    const { result } = renderHook(() => usePromptHistory(), {
      wrapper: createWrapper(store),
    });

    let text: string | null = null;
    act(() => {
      text = result.current.navigate("up", "");
    });

    expect(text).toBeNull();
  });

  it("resetNavigation clears index so next up starts fresh", () => {
    store.set(pushPromptHistoryAtom, "first");
    store.set(pushPromptHistoryAtom, "second");

    const { result } = renderHook(() => usePromptHistory(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.navigate("up", "draft");
      result.current.navigate("up", "");
    });
    act(() => {
      result.current.resetNavigation();
    });

    let text: string | null = null;
    act(() => {
      text = result.current.navigate("up", "new draft");
    });

    expect(text).toBe("second");
  });

  it("push resets navigation index", () => {
    store.set(pushPromptHistoryAtom, "old");

    const { result } = renderHook(() => usePromptHistory(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.navigate("up", "");
    });
    act(() => {
      result.current.push("new");
    });

    let text: string | null = null;
    act(() => {
      text = result.current.navigate("up", "");
    });

    expect(text).toBe("new");
  });
});
