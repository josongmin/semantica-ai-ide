import React from "react";

import type { Convention } from "~features/repo-explain";
import { cn } from "~shared/ui";

// ─── Types ────────────────────────────────────────────────

interface ConventionGridProps {
  conventions: Convention[];
  className?: string;
}

// ─── Component ────────────────────────────────────────────

export const ConventionGrid = React.memo(function ConventionGrid({
  conventions,
  className,
}: ConventionGridProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2", className)}>
      {conventions.map((c) => (
        <div key={c.label} className="flex items-baseline gap-2 min-w-0">
          <span className="text-xs font-medium text-vsc-text-secondary shrink-0">
            {c.label}
          </span>
          <span className="text-2xs text-vsc-text-ghost truncate">
            {c.value}
          </span>
        </div>
      ))}
    </div>
  );
});
