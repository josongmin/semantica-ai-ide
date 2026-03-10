/**
 * WorkflowPanel — Workflow Template Browser & Executor
 *
 * Thin orchestration shell that composes the workflow sub-components:
 * - WorkflowTabBar: tab navigation
 * - TemplateListPanel: browse/filter templates
 * - WorkflowParamForm: parameter entry + run
 * - WorkflowExecutionView: live execution progress
 * - WorkflowHistoryList: past executions
 */

import { memo } from "react";
import { useAtomValue } from "jotai";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import { workflowHistoryAtom, workflowTemplatesAtom } from "../model/workflowAtoms";
import { useWorkflowState } from "./hooks/useWorkflowState";
import { TemplateListPanel } from "./TemplateListPanel";
import { WorkflowExecutionView } from "./WorkflowExecutionView";
import { WorkflowHistoryList } from "./WorkflowHistoryList";
import { WorkflowParamForm } from "./WorkflowParamForm";
import { WorkflowTabBar } from "./WorkflowTabBar";

// ─── Types ──────────────────────────────────────────────────

export interface WorkflowPanelProps {
  /** Callback to execute a resolved command string in the terminal */
  onExecuteCommand: (command: string, cwd?: string) => void;
  /** Optional class name */
  className?: string;
}

// ─── Main Component ─────────────────────────────────────────

export const WorkflowPanel = memo(function WorkflowPanel({
  onExecuteCommand,
  className,
}: WorkflowPanelProps) {
  const templates = useAtomValue(workflowTemplatesAtom);
  const history = useAtomValue(workflowHistoryAtom);

  const {
    activeTab,
    handleTabChange,
    selectedTemplate,
    filterQuery,
    setFilterQuery,
    handleSelectTemplate,
    handleBack,
    activeExecution,
  } = useWorkflowState();

  return (
    <div
      className={cn(
        "flex flex-col h-full",
        "bg-vsc-surface-1 text-vsc-fg",
        "border-l border-vsc-border",
        className,
      )}
      role="region"
      aria-label="Workflow Templates"
    >
      {/* Tab bar */}
      <WorkflowTabBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hasRunning={activeExecution !== null}
        historyCount={history.length}
      />

      {/* Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === "templates" && (
          selectedTemplate ? (
            <WorkflowParamForm
              template={selectedTemplate}
              onBack={handleBack}
              onExecuteCommand={onExecuteCommand}
            />
          ) : (
            <TemplateListPanel
              templates={templates}
              filterQuery={filterQuery}
              onFilterChange={setFilterQuery}
              onSelectTemplate={handleSelectTemplate}
            />
          )
        )}
        {activeTab === "running" && (
          activeExecution ? (
            <WorkflowExecutionView execution={activeExecution} />
          ) : (
            <EmptyState icon="play" message="No workflow running" />
          )
        )}
        {activeTab === "history" && (
          history.length > 0 ? (
            <WorkflowHistoryList history={history} onExecuteCommand={onExecuteCommand} />
          ) : (
            <EmptyState icon="history" message="No workflow history yet" />
          )
        )}
      </div>
    </div>
  );
});

// ─── Empty State (small internal helper) ─────────────────────

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-vsc-text-ghost">
      <Icon name={icon} size={28} className="opacity-30" />
      <span className="text-2xs">{message}</span>
    </div>
  );
}
