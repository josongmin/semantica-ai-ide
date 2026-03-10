import React from "react";

import type { ConflictRisk } from "../../shared/protocol";
import { cn } from "../../shared/ui";

interface ConflictBadgeProps {
  readonly risk: ConflictRisk;
  readonly className?: string;
}

const riskStyles: Record<ConflictRisk, string> = {
  none: "bg-vsc-success/15 text-vsc-success",
  low: "bg-vsc-success/15 text-vsc-success",
  medium: "bg-vsc-warning/15 text-vsc-warning",
  high: "bg-vsc-error/15 text-vsc-error",
};

const riskLabels: Record<ConflictRisk, string> = {
  none: "Safe",
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const ConflictBadge = React.memo(function ConflictBadge({
  risk,
  className,
}: ConflictBadgeProps) {
  if (risk === "none") return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-2xs font-medium transition-[filter,box-shadow] duration-fast hover:brightness-110 hover:shadow-sm",
        riskStyles[risk],
        className,
      )}
      data-testid="conflict-badge"
      title={`Conflict risk: ${riskLabels[risk]}`}
    >
      {riskLabels[risk]}
    </span>
  );
});
