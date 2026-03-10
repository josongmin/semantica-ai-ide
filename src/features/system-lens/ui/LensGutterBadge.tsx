/**
 * LensGutterBadge — inline badge in editor gutter
 *
 * Shows summary metrics (callers, callees, impacted tests, call frequency)
 * for a symbol. Left-border colored by risk level.
 */

import { memo, useCallback, useRef } from "react";

import { cn } from "~shared/ui/variants";

import type { LensBadgeData } from "../model/types";

// ─── Unicode metric symbols ─────────────────────────────
const ARROW_UP = "\u2191"; // ↑
const ARROW_DOWN = "\u2193"; // ↓
const LIGHTNING = "\u26A1"; // ⚡

// ─── Risk-level border colors ────────────────────────────
const riskBorderColor: Record<LensBadgeData["riskLevel"], string> = {
  none: "border-l-[var(--color-risk-none)]",
  low: "border-l-[var(--color-risk-low)]",
  medium: "border-l-[var(--color-risk-medium)]",
  high: "border-l-[var(--color-risk-high)]",
  critical: "border-l-[var(--color-risk-critical)]",
};

// ─── Props ───────────────────────────────────────────────

interface LensGutterBadgeProps {
  badge: LensBadgeData;
  onHover?: (symbolId: string, rect: DOMRect) => void;
  onHoverEnd?: () => void;
  onClick?: (symbolId: string) => void;
  className?: string;
}

// ─── Component ───────────────────────────────────────────

export const LensGutterBadge = memo(function LensGutterBadge({
  badge,
  onHover,
  onHoverEnd,
  onClick,
  className,
}: LensGutterBadgeProps) {
  const elRef = useRef<HTMLButtonElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (leaveTimer.current !== null) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    if (onHover !== undefined && elRef.current !== null) {
      onHover(badge.symbolId, elRef.current.getBoundingClientRect());
    }
  }, [onHover, badge.symbolId]);

  const handleMouseLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => {
      onHoverEnd?.();
      leaveTimer.current = null;
    }, 200);
  }, [onHoverEnd]);

  const handleClick = useCallback(() => {
    onClick?.(badge.symbolId);
  }, [onClick, badge.symbolId]);

  // Build metric fragments
  const fragments: string[] = [];
  if (badge.callerCount > 0) fragments.push(`${ARROW_UP}${badge.callerCount}`);
  if (badge.calleeCount > 0) fragments.push(`${ARROW_DOWN}${badge.calleeCount}`);
  if (badge.impactedTests > 0) fragments.push(`${LIGHTNING}${badge.impactedTests}`);
  if (badge.callFrequency !== null) {
    fragments.push(`~${(badge.callFrequency / 1000).toFixed(0)}k/h`);
  }

  if (fragments.length === 0) return null;

  return (
    <button
      ref={elRef}
      type="button"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      aria-label={`Code metrics: ${fragments.join(", ")}`}
      className={cn(
        "inline-flex items-center gap-1.5 px-1.5 py-0.5",
        "font-mono text-3xs leading-none select-none",
        "border-l-2 rounded-r-sm",
        "bg-vsc-surface-1/60 text-vsc-text-secondary",
        "hover:bg-vsc-surface-2 hover:text-vsc-text-primary",
        "transition-colors duration-fast cursor-pointer",
        riskBorderColor[badge.riskLevel],
        className,
      )}
    >
      {fragments.map((f) => (
        <span key={f}>{f}</span>
      ))}
    </button>
  );
});
