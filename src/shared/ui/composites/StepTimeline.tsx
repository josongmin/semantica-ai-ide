import React from "react";

import { cn } from "../variants";

export type StepStatus = "pending" | "active" | "completed" | "error";

export interface Step {
  id: string;
  label: string;
  status: StepStatus;
}

export interface StepTimelineProps {
  steps: Step[];
  /** "horizontal" for banners, "vertical" for cards */
  direction?: "horizontal" | "vertical";
  className?: string;
}

const STATUS_STYLES: Record<StepStatus, { dot: string; label: string; connector: string }> = {
  pending: {
    dot: "bg-vsc-fg/20 border-vsc-fg/20",
    label: "text-vsc-text-ghost",
    connector: "bg-vsc-fg/10",
  },
  active: {
    dot: "bg-vsc-info border-vsc-info ring-2 ring-vsc-info/40",
    label: "text-vsc-info font-medium",
    connector: "bg-vsc-info/30",
  },
  completed: {
    dot: "bg-vsc-success border-vsc-success",
    label: "text-vsc-success",
    connector: "bg-vsc-success/60",
  },
  error: {
    dot: "bg-vsc-error border-vsc-error",
    label: "text-vsc-error",
    connector: "bg-vsc-error/30",
  },
};

/** Multi-step timeline for Plan Mode, Auto-Fix, Issue-to-PR, Self-Test. */
export const StepTimeline = React.memo(function StepTimeline({
  steps,
  direction = "horizontal",
  className,
}: StepTimelineProps) {
  const isHorizontal = direction === "horizontal";

  return (
    <div
      className={cn(
        "flex gap-0",
        isHorizontal ? "flex-row items-center" : "flex-col items-start",
        className,
      )}
      role="list"
      aria-label="Step progress"
    >
      {steps.map((step, i) => {
        const styles = STATUS_STYLES[step.status];
        const isLast = i === steps.length - 1;

        return (
          <div
            key={step.id}
            role="listitem"
            className={cn(
              "flex items-center gap-1.5",
              isHorizontal ? "flex-row" : "flex-col items-start",
              step.status === "active" && "animate-[step-reveal_200ms_ease-out]",
            )}
          >
            {/* Dot */}
            <span
              className={cn(
                "shrink-0 w-2 h-2 rounded-full border",
                styles.dot,
                step.status === "completed" && "animate-[check-pop_300ms_ease-out]",
              )}
            />

            {/* Label */}
            <span className={cn("text-2xs whitespace-nowrap", styles.label)}>
              {step.label}
            </span>

            {/* Connector */}
            {!isLast && (
              <span
                className={cn(
                  "shrink-0 rounded-full",
                  isHorizontal ? "w-4 h-px" : "w-px h-3 ml-1",
                  styles.connector,
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
});
