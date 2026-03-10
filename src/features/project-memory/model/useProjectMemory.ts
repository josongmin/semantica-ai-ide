import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { memoryRuleIdsAtom, rulesCountAtom } from "../../../entities/memory-rule";
import { memoryPanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import type { MemoryRuleId, MemoryRuleSource } from "../../../shared/protocol";
import { editingRuleIdAtom } from "./atoms";

/**
 * Aggregates project-memory panel state and provides actions to
 * save, delete and toggle memory rules via the extension host.
 */
export function useProjectMemory(): {
  ruleIds: readonly MemoryRuleId[];
  rulesCount: { total: number };
  panelVisible: boolean;
  editingRuleId: MemoryRuleId | "new" | null;
  setEditingRuleId: (id: MemoryRuleId | "new" | null) => void;
  togglePanel: () => void;
  saveRule: (data: { title: string; content: string; source: MemoryRuleSource }) => void;
  deleteRule: (ruleId: string) => void;
  toggleActive: (ruleId: string, active: boolean) => void;
} {
  const ruleIds = useAtomValue(memoryRuleIdsAtom);
  const rulesCount = useAtomValue(rulesCountAtom);
  const panelVisible = useAtomValue(memoryPanelVisibleAtom);
  const editingRuleId = useAtomValue(editingRuleIdAtom);
  const setEditingRuleId = useSetAtom(editingRuleIdAtom);
  const setVisible = useSetAtom(memoryPanelVisibleAtom);

  const togglePanel = useCallback(() => setVisible((v) => !v), [setVisible]);

  const saveRule = useCallback(
    (data: { title: string; content: string; source: MemoryRuleSource }) => {
      getVscodeApi().postMessage({ type: "SAVE_MEMORY_RULE", ...data });
    },
    [],
  );

  const deleteRule = useCallback((ruleId: string) => {
    getVscodeApi().postMessage({ type: "DELETE_MEMORY_RULE", rule_id: ruleId });
  }, []);

  const toggleActive = useCallback((ruleId: string, active: boolean) => {
    getVscodeApi().postMessage({
      type: "TOGGLE_MEMORY_RULE",
      rule_id: ruleId,
      active,
    });
  }, []);

  return {
    ruleIds: ruleIds as readonly MemoryRuleId[],
    rulesCount,
    panelVisible,
    editingRuleId,
    setEditingRuleId,
    togglePanel,
    saveRule,
    deleteRule,
    toggleActive,
  };
}
