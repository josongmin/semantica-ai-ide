import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { messageOrderAtom } from "~entities/message/core";
import { turnOrderAtom } from "~entities/message/turns";

import { resetIdCounter } from "../../../shared/lib/mocks";
import { useClearConversation } from "../model/useClearConversation";

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

describe("useClearConversation", () => {
  it("posts CLEAR_CONVERSATION to host", () => {
    const store = createStore();
    const { result } = renderHook(() => useClearConversation(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.clearConversation();
    });

    expect(mockPostMessage).toHaveBeenCalledWith({ type: "CLEAR_CONVERSATION" });
  });

  it("resets local stores", () => {
    const store = createStore();
    const { result } = renderHook(() => useClearConversation(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.clearConversation();
    });

    // After clear, stores should be empty
    expect(store.get(messageOrderAtom)).toEqual([]);
    expect(store.get(turnOrderAtom)).toEqual([]);
  });
});
