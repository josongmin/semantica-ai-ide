import { useCallback, useState } from "react";
import { useAtomValue } from "jotai";

import { activeWorkflowExecutionAtom } from "../../model/workflowAtoms";
import type { WorkflowTemplate } from "../../model/workflowTypes";
import type { PanelTab } from "../workflowConstants";

/**
 * Manages the top-level UI state for WorkflowPanel:
 * - active tab with auto-switch when a workflow is running
 * - selected template
 * - filter query
 */
export function useWorkflowState() {
  const activeExecution = useAtomValue(activeWorkflowExecutionAtom);

  const [userTab, setUserTab] = useState<PanelTab>("templates");
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [filterQuery, setFilterQuery] = useState("");

  // Auto-switch to "running" tab when a workflow starts
  const activeTab: PanelTab = activeExecution ? "running" : userTab;

  const handleSelectTemplate = useCallback((template: WorkflowTemplate) => {
    setSelectedTemplate(template);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedTemplate(null);
  }, []);

  const handleTabChange = useCallback(
    (tab: PanelTab) => {
      setUserTab(tab);
      setSelectedTemplate(null);
    },
    [],
  );

  return {
    activeTab,
    handleTabChange,
    selectedTemplate,
    filterQuery,
    setFilterQuery,
    handleSelectTemplate,
    handleBack,
    activeExecution,
  } as const;
}
