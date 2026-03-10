/**
 * DurationLabel — Human-readable duration display.
 *
 * Formats milliseconds into readable form:
 * - < 1s: "120ms"
 * - < 60s: "3.2s"
 * - < 60m: "2m 15s"
 * - >= 60m: "1h 5m"
 */

import { memo, useMemo } from "react";

import { cn } from "../variants";

export interface DurationLabelProps {
  /** Duration in milliseconds */
  durationMs: number | undefined | null;
  className?: string;
}

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export const DurationLabel = memo(function DurationLabel({
  durationMs,
  className,
}: DurationLabelProps) {
  const text = useMemo(
    () => (durationMs !== null && durationMs !== undefined ? formatDuration(durationMs) : null),
    [durationMs],
  );

  if (!text) return null;

  return (
    <span
      className={cn("text-3xs font-mono text-vsc-text-tertiary tabular-nums", className)}
    >
      {text}
    </span>
  );
});
