import React from "react";

import type { ImpactSeverity } from "~shared/protocol/types";
import { cn } from "~shared/ui/variants";

// ─── Severity Config ─────────────────────────────────────

const SEVERITY_STYLES: Record<ImpactSeverity, string> = {
  breaking: "bg-[var(--color-impact-breaking)]/20 text-[var(--color-impact-breaking)]",
  major: "bg-[var(--color-impact-major)]/20 text-[var(--color-impact-major)]",
  minor: "bg-[var(--color-impact-minor)]/20 text-[var(--color-impact-minor)]",
  cosmetic: "bg-vsc-surface-3 text-vsc-text-ghost",
};

const SEVERITY_LABEL: Record<ImpactSeverity, string> = {
  breaking: "BREAKING",
  major: "MAJOR",
  minor: "MINOR",
  cosmetic: "COSMETIC",
};

// ─── Component ───────────────────────────────────────────

export interface ImpactSeverityBadgeProps {
  severity: ImpactSeverity;
  className?: string;
}

export const ImpactSeverityBadge = React.memo(function ImpactSeverityBadge({
  severity,
  className,
}: ImpactSeverityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-1.5 py-0.5 text-3xs font-semibold uppercase leading-none",
        SEVERITY_STYLES[severity],
        className,
      )}
    >
      {SEVERITY_LABEL[severity]}
    </span>
  );
});
