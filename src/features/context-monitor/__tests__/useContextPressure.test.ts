import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { sessionMetaAtom } from "~entities/session/state";

import { createSessionMeta, resetIdCounter } from "../../../shared/lib/mocks";
import { useContextPressure } from "../model/useContextPressure";

// ─── Mock vscodeApi ────────────────────────────────────────
const mockPostMessage = vi.fn();

vi.mock("../../../shared/lib/vscodeApi", () => ({
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

beforeEach(() => {
  mockPostMessage.mockClear();
  resetIdCounter();
});

describe("useContextPressure", () => {
  it("returns correct usagePct", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 3000,
        tokens_out: 2000,
        max_context_tokens: 10000,
      }),
    );

    const { result } = renderHook(() => useContextPressure(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.usagePct).toBe(50);
    expect(result.current.pressureLevel).toBe("normal");
  });

  it("returns elevated at 75%", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 7500,
        tokens_out: 0,
        max_context_tokens: 10000,
      }),
    );

    const { result } = renderHook(() => useContextPressure(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.pressureLevel).toBe("elevated");
  });

  it("returns critical at 90%", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        tokens_in: 9000,
        tokens_out: 0,
        max_context_tokens: 10000,
      }),
    );

    const { result } = renderHook(() => useContextPressure(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.pressureLevel).toBe("critical");
  });

  it("requestCompaction posts COMPACT_CONTEXT to host", () => {
    const store = createStore();
    const { result } = renderHook(() => useContextPressure(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.requestCompaction();
    });

    expect(mockPostMessage).toHaveBeenCalledWith({ type: "COMPACT_CONTEXT" });
  });
});
