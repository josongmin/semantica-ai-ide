/**
 * ConfidenceBar — confidence visualization with color-coded thresholds
 */

import { memo } from "react";

export const ConfidenceBar = memo(function ConfidenceBar({
  value,
}: {
  value: number;
}) {
  const pct = Math.round(value * 100);
  let color: string;
  if (value >= 0.8) {
    color = "bg-vsc-error";
  } else if (value >= 0.5) {
    color = "bg-vsc-warning";
  } else {
    color = "bg-vsc-info";
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-vsc-surface-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-3xs text-vsc-text-ghost w-8 text-right">
        {pct}%
      </span>
    </div>
  );
});
