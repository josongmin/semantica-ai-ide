import React, { useEffect, useRef, useState } from "react";

import { cn, Text } from "~shared/ui";

import type { ImpactSeverity } from "../model/impactPreviewAtoms";

// ─── Types ──────────────────────────────────────────────

export interface ImpactScoreCardProps {
  label: string;
  value: number | string;
  severity: ImpactSeverity;
  detail: string;
}

// ─── Severity Styles ────────────────────────────────────

const SEVERITY_STYLES: Record<ImpactSeverity, { badge: string; text: string }> = {
  safe: {
    badge: "bg-vsc-success/10 text-vsc-success",
    text: "text-vsc-success",
  },
  low: {
    badge: "bg-vsc-info/10 text-vsc-info",
    text: "text-vsc-info",
  },
  moderate: {
    badge: "bg-vsc-warning/10 text-vsc-warning",
    text: "text-vsc-warning",
  },
  high: {
    badge: "bg-vsc-error/10 text-vsc-error",
    text: "text-vsc-error",
  },
};

const SEVERITY_LABEL: Record<ImpactSeverity, string> = {
  safe: "safe",
  low: "check",
  moderate: "check",
  high: "risk",
};

const SEVERITY_ICON: Record<ImpactSeverity, string> = {
  safe: "\u2713",
  low: "\u2713",
  moderate: "\u26A0",
  high: "\u2717",
};

// ─── Animated Counter Hook ──────────────────────────────

function useCountUp(target: number, duration = 300): number {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setCurrent(Math.round(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return current;
}

// ─── Component ──────────────────────────────────────────

export const ImpactScoreCard = React.memo(function ImpactScoreCard({
  label,
  value,
  severity,
  detail,
}: ImpactScoreCardProps) {
  const styles = SEVERITY_STYLES[severity];
  const numericValue = typeof value === "number" ? value : 0;
  const animatedValue = useCountUp(numericValue);
  const displayValue = typeof value === "string" ? value : animatedValue;

  return (
    <div
      className="flex flex-col gap-1 px-3 py-2 bg-vsc-surface-1 border border-vsc-border/15 rounded-md min-w-0 sm:min-w-[120px] flex-1"
      title={detail}
    >
      <span className="text-lg font-bold text-vsc-fg tabular-nums leading-tight">
        {typeof value === "string" ? value : displayValue}
      </span>

      <Text size="2xs" tone="ghost" className="leading-tight">
        {label}
      </Text>

      <span
        className={cn(
          "inline-flex items-center gap-0.5 text-2xs px-1.5 py-0.5 rounded-sm w-fit",
          styles.badge,
        )}
      >
        <span>{SEVERITY_ICON[severity]}</span>
        {SEVERITY_LABEL[severity]}
      </span>
    </div>
  );
});
