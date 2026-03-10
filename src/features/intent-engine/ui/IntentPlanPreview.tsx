/**
 * IntentPlanPreview — Plan step list with status indicators.
 *
 * Shows each step with status icon, action badge, description,
 * optional target file, and indented substeps.
 */

import React, { useCallback } from "react";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import type { IntentPlan, IntentPlanStep } from "../model/types";

// ─── Status Icon Mapping ────────────────────────────────

const statusIcons: Record<IntentPlanStep["status"], { name: string; className: string }> = {
  pending: { name: "circle-outline", className: "text-vsc-text-ghost/40" },
  running: { name: "loading", className: "text-vsc-accent animate-spin" },
  done: { name: "check", className: "text-(--color-status-completed)" },
  skipped: { name: "circle-slash", className: "text-vsc-text-ghost/30" },
};

// ─── Action Badge Colors ────────────────────────────────

const actionColors: Record<IntentPlanStep["action"], string> = {
  locate: "text-(--color-intent-refactor) bg-(--color-intent-refactor)/10",
  analyze: "text-(--color-intent-investigate) bg-(--color-intent-investigate)/10",
  modify: "text-(--color-intent-performance) bg-(--color-intent-performance)/10",
  test: "text-(--color-intent-test) bg-(--color-intent-test)/10",
  verify: "text-(--color-intent-feature) bg-(--color-intent-feature)/10",
};

// ─── Step Row ───────────────────────────────────────────

const PlanStepRow = React.memo(function PlanStepRow({ step }: { step: IntentPlanStep }) {
  const statusIcon = statusIcons[step.status];
  const actionColor = actionColors[step.action];

  return (
    <div className="space-y-0.5">
      <div className="flex items-start gap-2">
        {/* Status icon */}
        <Icon
          name={statusIcon.name}
          className={cn("mt-0.5 shrink-0", statusIcon.className)}
          tokenSize="xs"
        />

        {/* Action badge */}
        <span className={cn("shrink-0 px-1.5 py-0.5 rounded text-2xs font-medium", actionColor)}>
          {step.action}
        </span>

        {/* Description + target */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-xs",
            step.status === "done" ? "text-vsc-text-ghost/60 line-through" : "text-vsc-text-secondary",
            step.status === "skipped" && "text-vsc-text-ghost/40 line-through",
          )}>
            {step.description}
          </p>
          {step.targetFile && (
            <p className="text-2xs text-vsc-text-ghost/50 font-mono mt-0.5 truncate cursor-pointer hover:text-vsc-accent transition-colors duration-150">
              {step.targetFile}
              {step.targetLine !== undefined && `:${String(step.targetLine)}`}
            </p>
          )}
        </div>
      </div>

      {/* Substeps */}
      {step.substeps && step.substeps.length > 0 && (
        <ul className="ml-7 space-y-0.5">
          {step.substeps.map((sub, i) => (
            <li key={i} className="flex items-start gap-1.5 text-2xs text-vsc-text-ghost/50">
              <span className="mt-0.5 shrink-0">&ndash;</span>
              <span>{sub}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

// ─── Props ──────────────────────────────────────────────

interface IntentPlanPreviewProps {
  plan: IntentPlan;
  onExecute?: () => void;
  onCancel?: () => void;
  className?: string;
}

// ─── Main Component ─────────────────────────────────────

export const IntentPlanPreview = React.memo(function IntentPlanPreview({
  plan,
  onExecute,
  onCancel,
  className,
}: IntentPlanPreviewProps) {
  const handleExecute = useCallback(() => onExecute?.(), [onExecute]);
  const handleCancel = useCallback(() => onCancel?.(), [onCancel]);

  const completedSteps = plan.steps.filter((s) => s.status === "done").length;
  const totalSteps = plan.steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const isExecuting = plan.steps.some((s) => s.status === "running");

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-2xs font-medium text-vsc-text-ghost uppercase tracking-wider">
            Execution Plan
          </p>
          <span className="text-2xs text-vsc-text-ghost/40 tabular-nums">
            {completedSteps}/{totalSteps} steps
          </span>
        </div>

        {/* Impact summary */}
        <div className="flex items-center gap-2 text-2xs text-vsc-text-ghost/50">
          {plan.estimatedImpact.newFiles > 0 && (
            <span className="text-(--color-intent-feature)">+{plan.estimatedImpact.newFiles} new</span>
          )}
          {plan.estimatedImpact.modifiedFiles > 0 && (
            <span className="text-(--color-intent-investigate)">~{plan.estimatedImpact.modifiedFiles} mod</span>
          )}
          {plan.estimatedImpact.deletedFiles > 0 && (
            <span className="text-(--color-intent-bugfix)">-{plan.estimatedImpact.deletedFiles} del</span>
          )}
          {plan.estimatedImpact.testsNeeded > 0 && (
            <span className="text-(--color-intent-test)">{plan.estimatedImpact.testsNeeded} tests</span>
          )}
        </div>
      </div>

      {/* Progress bar (visible during execution) */}
      {isExecuting && (
        <div className="h-0.5 w-full rounded-full bg-vsc-surface-2/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-vsc-accent transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Steps */}
      <div className="space-y-2">
        {plan.steps.map((step) => (
          <PlanStepRow key={step.id} step={step} />
        ))}
      </div>

      {/* Action Buttons */}
      {(onExecute ?? onCancel) && (
        <div className="flex items-center gap-2 pt-1">
          {onExecute && (
            <button
              type="button"
              onClick={handleExecute}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium",
                "bg-vsc-accent/20 text-vsc-accent",
                "hover:bg-vsc-accent/30 transition-colors duration-150",
                "cursor-pointer",
              )}
            >
              Execute Plan
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium",
                "text-vsc-text-ghost hover:text-vsc-text-secondary",
                "hover:bg-vsc-surface-2/40 transition-colors duration-150",
                "cursor-pointer",
              )}
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
});
