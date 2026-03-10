import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { fastModeAtom } from "../../../shared/lib";
import { resetIdCounter } from "../../../shared/lib/mocks";
import { useFastMode } from "../model/useFastMode";

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

describe("useFastMode", () => {
  it("returns current fast mode state", () => {
    const store = createStore();
    store.set(fastModeAtom, true);

    const { result } = renderHook(() => useFastMode(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.enabled).toBe(true);
  });

  it("toggle posts SET_FAST_MODE with inverted value", () => {
    const store = createStore();
    store.set(fastModeAtom, false);

    const { result } = renderHook(() => useFastMode(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.toggle();
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SET_FAST_MODE",
      enabled: true,
    });
  });
});
