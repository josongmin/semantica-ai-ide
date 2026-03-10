import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { approvalModeAtom } from "~entities/session/settings";

import { useApprovalGate } from "../model/useApprovalGate";

// ─── Mock vscodeApi ────────────────────────────────────────
const mockPostMessage = vi.fn();

vi.mock("~shared/lib/vscodeApi", () => ({
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

// ─── Tests ─────────────────────────────────────────────────
describe("useApprovalGate", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it("returns the current mode from the atom (defaults to 'auto')", () => {
    const store = createStore();
    const { result } = renderHook(() => useApprovalGate(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.mode).toBe("auto");
  });

  it("changeMode updates the atom and posts message to extension host", () => {
    const store = createStore();
    const { result } = renderHook(() => useApprovalGate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.changeMode("turbo");
    });

    expect(result.current.mode).toBe("turbo");
    expect(store.get(approvalModeAtom)).toBe("turbo");
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SET_APPROVAL_MODE",
      mode: "turbo",
    });
  });

  it("changeMode can cycle through all three modes", () => {
    const store = createStore();
    const { result } = renderHook(() => useApprovalGate(), {
      wrapper: createWrapper(store),
    });

    act(() => result.current.changeMode("auto"));
    expect(result.current.mode).toBe("auto");

    act(() => result.current.changeMode("turbo"));
    expect(result.current.mode).toBe("turbo");

    act(() => result.current.changeMode("auto"));
    expect(result.current.mode).toBe("auto");

    expect(mockPostMessage).toHaveBeenCalledTimes(3);
  });

  it("grantApproval posts GRANT_APPROVAL with actionId", () => {
    const store = createStore();
    const { result } = renderHook(() => useApprovalGate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.grantApproval("action_123");
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "GRANT_APPROVAL",
      action_id: "action_123",
    });
  });

  it("denyApproval posts DENY_APPROVAL with actionId", () => {
    const store = createStore();
    const { result } = renderHook(() => useApprovalGate(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.denyApproval("action_456");
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "DENY_APPROVAL",
      action_id: "action_456",
    });
  });

  it("mode defaults correctly when atom is pre-set", () => {
    const store = createStore();
    store.set(approvalModeAtom, "auto");

    const { result } = renderHook(() => useApprovalGate(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.mode).toBe("auto");
  });
});
