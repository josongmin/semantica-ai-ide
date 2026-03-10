import React from "react";

import { cn } from "../variants";

export interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  className?: string;
  barClassName?: string;
}

/** Compact progress bar for phase/step tracking. */
export const ProgressBar = React.memo(
  React.forwardRef<HTMLDivElement, ProgressBarProps>(function ProgressBar(
    { value, max, label, className, barClassName },
    ref,
  ) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-1.5", className)}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div className="flex-1 h-1 rounded-full bg-vsc-surface-3 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-slow ease-out",
              barClassName ?? "bg-vsc-success",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        {label && (
          <span className="text-2xs text-vsc-text-tertiary tabular-nums shrink-0">{label}</span>
        )}
      </div>
    );
  }),
);
