import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import {
  confirmOptimisticAtom,
  optimisticApprovalAtom,
  resetOptimisticApprovalsAtom,
  rollbackOptimisticAtom,
  setOptimisticApprovalAtom,
} from "../model/optimisticApprovalAtoms";
import { useOptimisticApproval } from "../model/useOptimisticApproval";

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

// ─── Atom Tests ────────────────────────────────────────────
describe("optimisticApprovalAtoms", () => {
  it("starts with an empty map", () => {
    const store = createStore();
    expect(store.get(optimisticApprovalAtom).size).toBe(0);
  });

  it("setOptimisticApprovalAtom adds an entry", () => {
    const store = createStore();
    store.set(setOptimisticApprovalAtom, { toolCallId: "tc_1", status: "approved" });

    const map = store.get(optimisticApprovalAtom);
    expect(map.get("tc_1")).toBe("approved");
  });

  it("setOptimisticApprovalAtom overwrites existing entry", () => {
    const store = createStore();
    store.set(setOptimisticApprovalAtom, { toolCallId: "tc_1", status: "approved" });
    store.set(setOptimisticApprovalAtom, { toolCallId: "tc_1", status: "rejected" });

    expect(store.get(optimisticApprovalAtom).get("tc_1")).toBe("rejected");
  });

  it("rollbackOptimisticAtom removes the entry", () => {
    const store = createStore();
    store.set(setOptimisticApprovalAtom, { toolCallId: "tc_1", status: "approved" });
    store.set(rollbackOptimisticAtom, "tc_1");

    expect(store.get(optimisticApprovalAtom).has("tc_1")).toBe(false);
  });

  it("rollbackOptimisticAtom is a no-op for non-existent entries", () => {
    const store = createStore();
    store.set(rollbackOptimisticAtom, "nonexistent");
    expect(store.get(optimisticApprovalAtom).size).toBe(0);
  });

  it("confirmOptimisticAtom removes the entry", () => {
    const store = createStore();
    store.set(setOptimisticApprovalAtom, { toolCallId: "tc_1", status: "approved" });
    store.set(confirmOptimisticAtom, "tc_1");

    expect(store.get(optimisticApprovalAtom).has("tc_1")).toBe(false);
  });

  it("resetOptimisticApprovalsAtom clears all entries", () => {
    const store = createStore();
    store.set(setOptimisticApprovalAtom, { toolCallId: "tc_1", status: "approved" });
    store.set(setOptimisticApprovalAtom, { toolCallId: "tc_2", status: "rejected" });
    store.set(resetOptimisticApprovalsAtom);

    expect(store.get(optimisticApprovalAtom).size).toBe(0);
  });

  it("supports multiple concurrent tool call entries", () => {
    const store = createStore();
    store.set(setOptimisticApprovalAtom, { toolCallId: "tc_1", status: "approved" });
    store.set(setOptimisticApprovalAtom, { toolCallId: "tc_2", status: "rejected" });
    store.set(setOptimisticApprovalAtom, { toolCallId: "tc_3", status: "pending" });

    const map = store.get(optimisticApprovalAtom);
    expect(map.size).toBe(3);
    expect(map.get("tc_1")).toBe("approved");
    expect(map.get("tc_2")).toBe("rejected");
    expect(map.get("tc_3")).toBe("pending");
  });
});

// ─── Hook Tests ────────────────────────────────────────────
describe("useOptimisticApproval", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it("returns undefined optimisticStatus when no optimistic state exists", () => {
    const store = createStore();
    const { result } = renderHook(() => useOptimisticApproval("tc_1"), {
      wrapper: createWrapper(store),
    });

    expect(result.current.optimisticStatus).toBeUndefined();
  });

  it("approveOptimistic sets local state immediately and posts GRANT_APPROVAL", () => {
    const store = createStore();
    const { result } = renderHook(() => useOptimisticApproval("tc_1"), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.approveOptimistic("action_abc");
    });

    expect(result.current.optimisticStatus).toBe("approved");
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "GRANT_APPROVAL",
      action_id: "action_abc",
    });
  });

  it("denyOptimistic sets local state immediately and posts DENY_APPROVAL", () => {
    const store = createStore();
    const { result } = renderHook(() => useOptimisticApproval("tc_1"), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.denyOptimistic("action_xyz");
    });

    expect(result.current.optimisticStatus).toBe("rejected");
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "DENY_APPROVAL",
      action_id: "action_xyz",
    });
  });

  it("rollback removes optimistic state", () => {
    const store = createStore();
    const { result } = renderHook(() => useOptimisticApproval("tc_1"), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.approveOptimistic("action_1");
    });
    expect(result.current.optimisticStatus).toBe("approved");

    act(() => {
      result.current.rollback();
    });
    expect(result.current.optimisticStatus).toBeUndefined();
  });

  it("confirm removes optimistic state after server acknowledges", () => {
    const store = createStore();
    const { result } = renderHook(() => useOptimisticApproval("tc_1"), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.approveOptimistic("action_1");
    });
    expect(result.current.optimisticStatus).toBe("approved");

    act(() => {
      result.current.confirm();
    });
    expect(result.current.optimisticStatus).toBeUndefined();
  });

  it("separate tool calls have independent optimistic states", () => {
    const store = createStore();
    const { result: result1 } = renderHook(() => useOptimisticApproval("tc_1"), {
      wrapper: createWrapper(store),
    });
    const { result: result2 } = renderHook(() => useOptimisticApproval("tc_2"), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result1.current.approveOptimistic("action_a");
    });
    act(() => {
      result2.current.denyOptimistic("action_b");
    });

    expect(result1.current.optimisticStatus).toBe("approved");
    expect(result2.current.optimisticStatus).toBe("rejected");

    // Rolling back one doesn't affect the other
    act(() => {
      result1.current.rollback();
    });
    expect(result1.current.optimisticStatus).toBeUndefined();
    expect(result2.current.optimisticStatus).toBe("rejected");
  });
});
