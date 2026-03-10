/**
 * GhostHint — Subtle inline hint for code lens.
 *
 * A semi-transparent text hint that appears next to function names.
 * Low-opacity at rest, slightly more visible on hover.
 * Clicking opens the full CodeLens card.
 */

import { memo } from "react";

import { cn } from "~shared/ui";

// ─── Types ─────────────────────────────────────────────────

export interface GhostHintProps {
  text: string;
  onClick: () => void;
  className?: string;
}

// ─── Component ─────────────────────────────────────────────

export const GhostHint = memo(function GhostHint({ text, onClick, className }: GhostHintProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1",
        "text-3xs text-vsc-text-ghost italic",
        "opacity-30 hover:opacity-60",
        "transition-opacity duration-normal",
        "cursor-pointer select-none",
        "rounded px-1 py-px",
        "hover:bg-vsc-surface-2/50",
        "focus-ring",
        className,
      )}
      aria-label={`Code hint: ${text}`}
    >
      <span aria-hidden className="text-vsc-accent/50">
        &lsaquo;/&rsaquo;
      </span>
      <span className="max-w-[200px] truncate">{text}</span>
    </button>
  );
});
