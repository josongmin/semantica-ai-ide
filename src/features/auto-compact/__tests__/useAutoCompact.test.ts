import { createElement, type ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { sessionMetaAtom } from "~entities/session/state";

import { createSessionMeta } from "../../../shared/lib/mocks";
import type { SessionId } from "../../../shared/protocol";
import { pendingCompactAtom } from "../model/autoCompactAtoms";
import { useAutoCompact } from "../model/useAutoCompact";

const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

vi.mock("../../../shared/lib/atoms/toastAtoms", () => ({
  pushToastAtom: {
    write: vi.fn(),
    init: undefined,
    read: () => [],
  },
}));

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children);
  };
}

describe("useAutoCompact", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it("does not trigger when usage is below threshold", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        status: "running",
        tokens_in: 100,
        tokens_out: 100,
        max_context_tokens: 10000,
        session_id: "s1" as SessionId,
      }),
    );

    renderHook(() => useAutoCompact(), {
      wrapper: createWrapper(store),
    });

    // Should NOT set pending or directly call COMPACT_CONTEXT
    expect(mockPostMessage).not.toHaveBeenCalledWith({ type: "COMPACT_CONTEXT" });
    expect(store.get(pendingCompactAtom)).toBe(false);
  });

  it("does not trigger when session is not running", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        status: "idle",
        tokens_in: 9000,
        tokens_out: 0,
        max_context_tokens: 10000,
        session_id: "s1" as SessionId,
      }),
    );

    renderHook(() => useAutoCompact(), {
      wrapper: createWrapper(store),
    });

    expect(mockPostMessage).not.toHaveBeenCalledWith({ type: "COMPACT_CONTEXT" });
    expect(store.get(pendingCompactAtom)).toBe(false);
  });

  it("sets pendingCompactAtom when usage crosses 85% during running session", () => {
    const store = createStore();
    store.set(
      sessionMetaAtom,
      createSessionMeta({
        status: "running",
        tokens_in: 8600,
        tokens_out: 0,
        max_context_tokens: 10000,
        session_id: "s1" as SessionId,
      }),
    );

    renderHook(() => useAutoCompact(), {
      wrapper: createWrapper(store),
    });

    // Should set pending (user confirms via dialog) rather than auto-fire
    expect(store.get(pendingCompactAtom)).toBe(true);
    // Should NOT directly send COMPACT_CONTEXT — that happens in AutoCompactDialog
    expect(mockPostMessage).not.toHaveBeenCalledWith({ type: "COMPACT_CONTEXT" });
  });
});
