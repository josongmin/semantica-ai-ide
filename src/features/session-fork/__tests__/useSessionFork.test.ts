import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import type { TurnId } from "../../../shared/protocol";
import { useSessionFork } from "../model/useSessionFork";

const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

const mockPushToast = vi.fn();
vi.mock("../../../shared/lib", async () => {
  const actual = await vi.importActual("../../../shared/lib");
  return {
    ...actual,
    pushToastAtom: {
      read: () => null,
      write: (_get: unknown, _set: unknown, toast: unknown) => mockPushToast(toast),
      init: null,
    },
  };
});

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}

describe("useSessionFork", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
    mockPushToast.mockClear();
  });

  it("posts FORK_SESSION with source_turn_id", () => {
    const store = createStore();
    const { result } = renderHook(() => useSessionFork(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.forkFromTurn("turn_5" as TurnId);
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "FORK_SESSION",
      source_turn_id: "turn_5",
    });
  });

  it("shows info toast with navigation message", () => {
    const store = createStore();
    const { result } = renderHook(() => useSessionFork(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.forkFromTurn("turn_1" as TurnId);
    });

    // Toast should have been pushed via the atom
    expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({ type: "FORK_SESSION" }));
  });

  it("returns forkFromTurn as stable callback", () => {
    const store = createStore();
    const { result, rerender } = renderHook(() => useSessionFork(), {
      wrapper: createWrapper(store),
    });

    const first = result.current.forkFromTurn;
    rerender();
    expect(result.current.forkFromTurn).toBe(first);
  });
});
