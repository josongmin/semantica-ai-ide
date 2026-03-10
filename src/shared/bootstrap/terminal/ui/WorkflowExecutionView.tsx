/**
 * WorkflowExecutionView — Live execution display with step-by-step progress
 *
 * Shows the running (or completed) workflow with a timeline of steps,
 * status badges, elapsed time, and parameter summary.
 */

import { memo } from "react";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import type {
  WorkflowExecution,
  WorkflowStepState,
  WorkflowStepStatus,
} from "../model/workflowTypes";
import { useNow } from "./hooks/useNow";
import { formatDuration } from "./workflowConstants";

// ─── Public Interface ────────────────────────────────────────

export interface WorkflowExecutionViewProps {
  execution: WorkflowExecution;
}

export const WorkflowExecutionView = memo(function WorkflowExecutionView({
  execution,
}: WorkflowExecutionViewProps) {
  const now = useNow(execution.completedAt === undefined);
  const elapsed = execution.completedAt !== undefined
    ? execution.completedAt - execution.startedAt
    : now - execution.startedAt;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-vsc-border/30 shrink-0">
        <ExecutionStatusBadge status={execution.status} />
        <span className="text-2xs font-medium text-vsc-fg truncate">
          {execution.templateName}
        </span>
        <span className="ml-auto text-3xs text-vsc-text-ghost tabular-nums">
          {formatDuration(elapsed)}
        </span>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-1">
        {execution.stepStates.map((step, i) => (
          <WorkflowStepIndicator
            key={step.stepId}
            step={step}
            index={i}
            isLast={i === execution.stepStates.length - 1}
            isCurrent={i === execution.currentStepIndex}
          />
        ))}
      </div>

      {/* Params summary */}
      {Object.keys(execution.params).length > 0 && (
        <div className="px-3 py-2 border-t border-vsc-border/30 shrink-0">
          <div className="text-3xs font-medium text-vsc-text-ghost uppercase tracking-wider mb-1">
            Parameters
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(execution.params).map(([key, val]) => (
              <span
                key={key}
                className="text-3xs bg-vsc-surface-2 text-vsc-text-secondary px-1.5 py-0.5 rounded font-mono"
              >
                {key}={String(val)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// ─── Step Indicator (internal) ───────────────────────────────

const STATUS_CONFIG: Record<WorkflowStepStatus, { icon: string; color: string; bg: string }> = {
  pending: { icon: "circle-outline", color: "text-vsc-text-ghost", bg: "bg-vsc-surface-2" },
  running: { icon: "loading~spin", color: "text-vsc-accent", bg: "bg-vsc-accent/10" },
  succeeded: { icon: "pass-filled", color: "text-vsc-success", bg: "bg-vsc-success/10" },
  failed: { icon: "error", color: "text-vsc-error", bg: "bg-vsc-error/10" },
  skipped: { icon: "circle-slash", color: "text-vsc-text-ghost/50", bg: "bg-vsc-surface-2/50" },
};

interface WorkflowStepIndicatorProps {
  step: WorkflowStepState;
  index: number;
  isLast: boolean;
  isCurrent: boolean;
}

const WorkflowStepIndicator = memo(function WorkflowStepIndicator({
  step,
  index: _index,
  isLast,
  isCurrent,
}: WorkflowStepIndicatorProps) {
  const config = STATUS_CONFIG[step.status];

  return (
    <div className="flex items-stretch gap-0">
      {/* Timeline connector */}
      <div className="flex flex-col items-center w-6 shrink-0">
        <div
          className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center",
            config.bg,
            isCurrent && step.status === "running" && "ring-1 ring-vsc-accent/40",
          )}
        >
          <Icon
            name={step.status === "running" ? "sync" : (config.icon.split("~")[0] ?? config.icon)}
            size={12}
            className={cn(
              config.color,
              step.status === "running" && "animate-spin",
            )}
          />
        </div>
        {!isLast && (
          <div className={cn(
            "w-px flex-1 min-h-[12px]",
            step.status === "succeeded" ? "bg-vsc-success/30" : "bg-vsc-border/30",
          )} />
        )}
      </div>

      {/* Step content */}
      <div className={cn("flex-1 min-w-0 pb-2 pl-1.5", isLast && "pb-0")}>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "text-2xs font-medium",
              step.status === "skipped" && "text-vsc-text-ghost/50 line-through",
              step.status === "failed" && "text-vsc-error",
              step.status !== "skipped" && step.status !== "failed" && "text-vsc-fg",
            )}
          >
            {step.stepId}
          </span>
          {step.duration !== undefined && (
            <span className="text-3xs text-vsc-text-ghost tabular-nums">
              {formatDuration(step.duration)}
            </span>
          )}
          {step.exitCode !== undefined && step.exitCode !== 0 && (
            <span className="text-3xs text-vsc-error tabular-nums">
              exit {step.exitCode}
            </span>
          )}
        </div>
        {step.error && (
          <p className="text-3xs text-vsc-error/80 mt-0.5 break-all">{step.error}</p>
        )}
        {step.output && (
          <pre className="text-3xs text-vsc-text-ghost font-mono mt-0.5 max-h-16 overflow-y-auto break-all whitespace-pre-wrap">
            {step.output}
          </pre>
        )}
      </div>
    </div>
  );
});

// ─── Execution Status Badge (internal) ──────────────────────

export function ExecutionStatusBadge({ status }: { status: WorkflowExecution["status"] }) {
  const config = {
    idle: { icon: "circle-outline", color: "text-vsc-text-ghost", label: "Idle" },
    running: { icon: "sync", color: "text-vsc-accent", label: "Running" },
    completed: { icon: "pass-filled", color: "text-vsc-success", label: "Completed" },
    failed: { icon: "error", color: "text-vsc-error", label: "Failed" },
    cancelled: { icon: "circle-slash", color: "text-vsc-warning", label: "Cancelled" },
  }[status];

  return (
    <span className={cn("flex items-center gap-1 text-3xs font-medium", config.color)}>
      <Icon
        name={config.icon}
        size={12}
        className={cn(status === "running" && "animate-spin")}
      />
      {config.label}
    </span>
  );
}
