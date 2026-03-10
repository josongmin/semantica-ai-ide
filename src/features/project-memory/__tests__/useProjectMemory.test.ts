import { createElement, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { upsertMemoryRuleAtom } from "../../../entities/memory-rule";
import { memoryPanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import { createMemoryRule } from "../../../shared/lib/mocks";
import type { MemoryRuleId } from "../../../shared/protocol";
import { editingRuleIdAtom } from "../model/atoms";
import { useProjectMemory } from "../model/useProjectMemory";

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

// ─── Tests ─────────────────────────────────────────────────
describe("useProjectMemory", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it("returns default values when atoms are empty", () => {
    const store = createStore();
    const { result } = renderHook(() => useProjectMemory(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.ruleIds).toEqual([]);
    expect(result.current.rulesCount).toEqual({ total: 0 });
    expect(result.current.panelVisible).toBe(false);
    expect(result.current.editingRuleId).toBeNull();
  });

  it("togglePanel flips memoryPanelVisibleAtom", () => {
    const store = createStore();
    const { result } = renderHook(() => useProjectMemory(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.panelVisible).toBe(false);
    act(() => result.current.togglePanel());
    expect(result.current.panelVisible).toBe(true);
    expect(store.get(memoryPanelVisibleAtom)).toBe(true);

    act(() => result.current.togglePanel());
    expect(result.current.panelVisible).toBe(false);
  });

  it("setEditingRuleId updates editingRuleIdAtom", () => {
    const store = createStore();
    const { result } = renderHook(() => useProjectMemory(), {
      wrapper: createWrapper(store),
    });

    act(() => result.current.setEditingRuleId("rule-1" as MemoryRuleId));
    expect(result.current.editingRuleId).toBe("rule-1");
    expect(store.get(editingRuleIdAtom)).toBe("rule-1");

    act(() => result.current.setEditingRuleId("new"));
    expect(result.current.editingRuleId).toBe("new");

    act(() => result.current.setEditingRuleId(null));
    expect(result.current.editingRuleId).toBeNull();
  });

  it("saveRule posts SAVE_MEMORY_RULE message with correct payload", () => {
    const store = createStore();
    const { result } = renderHook(() => useProjectMemory(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      result.current.saveRule({
        title: "My Rule",
        content: "Always write tests",
        source: "custom",
      });
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SAVE_MEMORY_RULE",
      title: "My Rule",
      content: "Always write tests",
      source: "custom",
    });
  });

  it("deleteRule posts DELETE_MEMORY_RULE message with correct rule_id", () => {
    const store = createStore();
    const { result } = renderHook(() => useProjectMemory(), {
      wrapper: createWrapper(store),
    });

    act(() => result.current.deleteRule("rule-42"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "DELETE_MEMORY_RULE",
      rule_id: "rule-42",
    });
  });

  it("toggleActive posts TOGGLE_MEMORY_RULE message with correct args", () => {
    const store = createStore();
    const { result } = renderHook(() => useProjectMemory(), {
      wrapper: createWrapper(store),
    });

    act(() => result.current.toggleActive("rule-7", false));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "TOGGLE_MEMORY_RULE",
      rule_id: "rule-7",
      active: false,
    });

    act(() => result.current.toggleActive("rule-7", true));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "TOGGLE_MEMORY_RULE",
      rule_id: "rule-7",
      active: true,
    });
  });

  it("reflects pre-seeded atom values", () => {
    const store = createStore();
    store.set(upsertMemoryRuleAtom, createMemoryRule({ id: "rule-a" as MemoryRuleId }));
    store.set(upsertMemoryRuleAtom, createMemoryRule({ id: "rule-b" as MemoryRuleId }));
    store.set(memoryPanelVisibleAtom, true);

    const { result } = renderHook(() => useProjectMemory(), {
      wrapper: createWrapper(store),
    });

    expect(result.current.ruleIds).toEqual(["rule-a", "rule-b"]);
    expect(result.current.rulesCount).toEqual({ total: 2 });
    expect(result.current.panelVisible).toBe(true);
  });
});
