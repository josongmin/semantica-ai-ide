import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import {
  addAlwaysAllowedToolAtom,
  alwaysAllowedToolsAtom,
  clearAlwaysAllowedToolsAtom,
  isToolAlwaysAllowed,
  removeAlwaysAllowedToolAtom,
} from "../model/approvalMemoryAtoms";
import { useToolApprovalMemory } from "../model/useToolApprovalMemory";

const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
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

describe("approvalMemoryAtoms", () => {
  it("starts with empty set", () => {
    const store = createStore();
    expect(store.get(alwaysAllowedToolsAtom).size).toBe(0);
  });

  it("adds tool to allowed set", () => {
    const store = createStore();
    store.set(addAlwaysAllowedToolAtom, "read_file");
    expect(store.get(alwaysAllowedToolsAtom).has("read_file")).toBe(true);
  });

  it("ignores duplicate add", () => {
    const store = createStore();
    store.set(addAlwaysAllowedToolAtom, "read_file");
    store.set(addAlwaysAllowedToolAtom, "read_file");
    expect(store.get(alwaysAllowedToolsAtom).size).toBe(1);
  });

  it("removes tool from allowed set", () => {
    const store = createStore();
    store.set(addAlwaysAllowedToolAtom, "read_file");
    store.set(removeAlwaysAllowedToolAtom, "read_file");
    expect(store.get(alwaysAllowedToolsAtom).size).toBe(0);
  });

  it("clears all allowed tools", () => {
    const store = createStore();
    store.set(addAlwaysAllowedToolAtom, "read_file");
    store.set(addAlwaysAllowedToolAtom, "write_file");
    store.set(clearAlwaysAllowedToolsAtom);
    expect(store.get(alwaysAllowedToolsAtom).size).toBe(0);
  });

  it("isToolAlwaysAllowed checks set membership", () => {
    const allowed = new Set(["read_file"]);
    expect(isToolAlwaysAllowed("read_file", allowed)).toBe(true);
    expect(isToolAlwaysAllowed("write_file", allowed)).toBe(false);
  });
});

describe("useToolApprovalMemory", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it("allowAlways adds tool and grants approval", () => {
    const store = createStore();
    const { result } = renderHook(() => useToolApprovalMemory(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.allowAlways("read_file", "action-1");
    });

    expect(store.get(alwaysAllowedToolsAtom).has("read_file")).toBe(true);
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "GRANT_APPROVAL",
      action_id: "action-1",
    });
  });

  it("isAllowed returns true for allowed tools", () => {
    const store = createStore();
    store.set(addAlwaysAllowedToolAtom, "read_file");

    const { result } = renderHook(() => useToolApprovalMemory(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.isAllowed("read_file")).toBe(true);
    expect(result.current.isAllowed("write_file")).toBe(false);
  });

  it("revokeAlways removes tool from allowed set", () => {
    const store = createStore();
    store.set(addAlwaysAllowedToolAtom, "read_file");

    const { result } = renderHook(() => useToolApprovalMemory(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.revokeAlways("read_file");
    });

    expect(store.get(alwaysAllowedToolsAtom).size).toBe(0);
  });

  it("clearAll removes all allowed tools", () => {
    const store = createStore();
    store.set(addAlwaysAllowedToolAtom, "read_file");
    store.set(addAlwaysAllowedToolAtom, "write_file");

    const { result } = renderHook(() => useToolApprovalMemory(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.clearAll();
    });

    expect(store.get(alwaysAllowedToolsAtom).size).toBe(0);
  });
});
