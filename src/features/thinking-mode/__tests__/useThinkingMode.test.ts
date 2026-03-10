import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { thinkingModeAtom } from "../../../shared/lib";
import { resetIdCounter } from "../../../shared/lib/mocks";
import { useThinkingMode } from "../model/useThinkingMode";

const mockPostMessage = vi.fn();

vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: vi.fn(),
  }),
}));

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}

beforeEach(() => {
  mockPostMessage.mockClear();
  resetIdCounter();
});

describe("useThinkingMode", () => {
  it("returns current thinking mode state", () => {
    const store = createStore();
    store.set(thinkingModeAtom, true);

    const { result } = renderHook(() => useThinkingMode(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.enabled).toBe(true);
  });

  it("toggle posts SET_THINKING_MODE with inverted value", () => {
    const store = createStore();
    store.set(thinkingModeAtom, false);

    const { result } = renderHook(() => useThinkingMode(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.toggle();
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SET_THINKING_MODE",
      enabled: true,
    });
  });

  it("toggle from ON posts enabled: false", () => {
    const store = createStore();
    store.set(thinkingModeAtom, true);

    const { result } = renderHook(() => useThinkingMode(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.toggle();
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SET_THINKING_MODE",
      enabled: false,
    });
  });
});
