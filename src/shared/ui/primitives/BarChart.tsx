import React from "react";

import { cn } from "../variants";

export interface BarChartProps {
  insertions: number;
  deletions: number;
  maxWidth?: number;
  className?: string;
}

export const BarChart = React.memo(function BarChart({
  insertions,
  deletions,
  maxWidth = 120,
  className,
}: BarChartProps) {
  const total = insertions + deletions;
  if (total === 0) return null;

  const insertWidth = Math.round((insertions / total) * maxWidth);
  const deleteWidth = maxWidth - insertWidth;

  return (
    <div
      role="img"
      aria-label={`${insertions} insertions, ${deletions} deletions`}
      className={cn("flex items-center gap-1.5 text-2xs", className)}
    >
      <span className="text-vsc-success">+{insertions}</span>
      <div className="flex h-1.5 rounded-full overflow-hidden" style={{ width: maxWidth }}>
        {insertions > 0 && (
          <div className="bg-vsc-success rounded-l-full" style={{ width: insertWidth }} />
        )}
        {deletions > 0 && (
          <div className="bg-vsc-error rounded-r-full" style={{ width: deleteWidth }} />
        )}
      </div>
      <span className="text-vsc-error">-{deletions}</span>
    </div>
  );
});
