import React from "react";

import { cn, Icon } from "../../shared/ui";

export interface LoopIteration {
  id: string;
  label: string;
  status: "running" | "success" | "error" | "skipped";
}

export interface LoopVisualizerProps {
  iterations: LoopIteration[];
  currentIndex: number;
  maxIterations: number;
  className?: string;
}

const ITER_STYLES: Record<LoopIteration["status"], string> = {
  running: "border-vsc-info bg-vsc-info/10 text-vsc-info",
  success: "border-vsc-success/60 bg-vsc-success/10 text-vsc-success",
  error: "border-vsc-error/60 bg-vsc-error/10 text-vsc-error",
  skipped: "border-vsc-fg/20 bg-vsc-surface-2 text-vsc-text-ghost",
};

/** Loop iteration visualizer for Auto-Fix and Self-Test loops. */
export const LoopVisualizer = React.memo(function LoopVisualizer({
  iterations,
  currentIndex,
  maxIterations,
  className,
}: LoopVisualizerProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 text-2xs text-vsc-text-secondary">
        <span
          className={cn(
            "inline-flex items-center justify-center w-4 h-4",
            currentIndex < maxIterations && "animate-[slow-spin_3s_linear_infinite]",
          )}
        >
          <Icon name="sync" tokenSize="2xs" />
        </span>
        <span className="tabular-nums">
          Iteration {currentIndex + 1} / {maxIterations}
        </span>
      </div>

      {/* Iteration chips */}
      <div className="flex flex-wrap gap-1">
        {iterations.map((iter, i) => (
          <span
            key={iter.id}
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-2xs",
              "transition-colors duration-normal",
              ITER_STYLES[iter.status],
              i === currentIndex && "ring-1 ring-vsc-info/40",
            )}
          >
            <span className="tabular-nums">#{i + 1}</span>
            {iter.status === "running" && (
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            )}
          </span>
        ))}
      </div>
    </div>
  );
});
