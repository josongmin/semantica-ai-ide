/**
 * WorkflowHistoryList — Past workflow execution history
 *
 * Renders a scrollable list of completed workflow runs with status,
 * step counts, duration, and relative timestamps.
 */

import { memo } from "react";

import { cn } from "~shared/ui/variants";

import type { WorkflowExecution } from "../model/workflowTypes";
import { useNow } from "./hooks/useNow";
import { formatDuration, formatRelativeTime } from "./workflowConstants";
import { ExecutionStatusBadge } from "./WorkflowExecutionView";

// ─── Public Interface ────────────────────────────────────────

export interface WorkflowHistoryListProps {
  history: readonly WorkflowExecution[];
  onExecuteCommand: (command: string, cwd?: string) => void;
}

export const WorkflowHistoryList = memo(function WorkflowHistoryList({
  history,
}: WorkflowHistoryListProps) {
  return (
    <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-1">
      {history.map((exec) => (
        <HistoryRow key={exec.executionId} execution={exec} />
      ))}
    </div>
  );
});

// ─── History Row (internal) ──────────────────────────────────

interface HistoryRowProps {
  execution: WorkflowExecution;
}

const HistoryRow = memo(function HistoryRow({ execution }: HistoryRowProps) {
  const now = useNow(execution.completedAt === undefined);
  const duration = (execution.completedAt ?? now) - execution.startedAt;
  const succeededCount = execution.stepStates.filter((s) => s.status === "succeeded").length;
  const totalCount = execution.stepStates.length;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 px-2.5 py-2 rounded-md",
        "bg-vsc-surface-2/40 hover:bg-vsc-surface-2/70",
        "transition-colors duration-normal",
      )}
    >
      <ExecutionStatusBadge status={execution.status} />

      <div className="flex-1 min-w-0">
        <span className="text-2xs text-vsc-fg truncate block">{execution.templateName}</span>
        <span className="text-3xs text-vsc-text-ghost">
          {succeededCount}/{totalCount} steps | {formatDuration(duration)}
        </span>
      </div>

      <span className="shrink-0 text-3xs text-vsc-text-ghost tabular-nums">
        {formatRelativeTime(execution.startedAt)}
      </span>
    </div>
  );
});
