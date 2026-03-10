import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { sessionListAtom, setSessionListAtom } from "~shared/lib";
import { createSessionListEntry, resetIdCounter } from "~shared/lib/mocks";
import type { SessionId } from "~shared/protocol";

import { useSessionLifecycle } from "../model/useSessionLifecycle";
const mockPostMessage = vi.fn();
vi.mock("~shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
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
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("deleteSession optimistic rollback", () => {
  it("optimistically removes the session immediately", () => {
    const store = createStore();
    const entry1 = createSessionListEntry({ session_id: "sess_1" as SessionId });
    const entry2 = createSessionListEntry({ session_id: "sess_2" as SessionId });
    store.set(setSessionListAtom, [entry1, entry2]);

    const { result } = renderHook(() => useSessionLifecycle(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.deleteSession("sess_1");
    });

    const remaining = store.get(sessionListAtom);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.session_id).toBe("sess_2");
  });

  it("rolls back after 10s if no server update arrives", () => {
    const store = createStore();
    const entry1 = createSessionListEntry({ session_id: "sess_1" as SessionId });
    const entry2 = createSessionListEntry({ session_id: "sess_2" as SessionId });
    store.set(setSessionListAtom, [entry1, entry2]);

    const { result } = renderHook(() => useSessionLifecycle(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.deleteSession("sess_1");
    });

    // Session is removed optimistically
    expect(store.get(sessionListAtom)).toHaveLength(1);

    // Fast-forward 10 seconds — should trigger rollback
    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    // Session should be restored
    const afterRollback = store.get(sessionListAtom);
    expect(afterRollback).toHaveLength(2);
    expect(afterRollback.some((s) => s.session_id === "sess_1")).toBe(true);
  });

  it("does NOT roll back if server sends update within timeout", () => {
    const store = createStore();
    const entry1 = createSessionListEntry({ session_id: "sess_1" as SessionId });
    const entry2 = createSessionListEntry({ session_id: "sess_2" as SessionId });
    store.set(setSessionListAtom, [entry1, entry2]);

    const { result } = renderHook(() => useSessionLifecycle(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.deleteSession("sess_1");
    });

    // Simulate server acknowledgement by updating the session list
    act(() => {
      store.set(setSessionListAtom, [entry2]);
    });

    // Fast-forward past the timeout
    act(() => {
      vi.advanceTimersByTime(15_000);
    });

    // Should remain with only entry2 (no rollback)
    expect(store.get(sessionListAtom)).toHaveLength(1);
    expect(store.get(sessionListAtom)[0]?.session_id).toBe("sess_2");
  });
});
