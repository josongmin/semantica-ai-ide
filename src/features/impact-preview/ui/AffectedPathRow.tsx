import React from "react";

import { cn } from "~shared/ui";

import type { AffectedPath } from "../model/impactPreviewAtoms";

// ─── Types ──────────────────────────────────────────────

export interface AffectedPathRowProps {
  path: AffectedPath;
  onClick?: () => void;
}

// ─── Component ──────────────────────────────────────────

export const AffectedPathRow = React.memo(function AffectedPathRow({
  path,
  onClick,
}: AffectedPathRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Navigate to affected path"
      className={cn(
        "flex items-center gap-1.5 w-full px-3 py-0.5 text-left",
        "hover:bg-vsc-surface-2/50 cursor-pointer transition-colors duration-fast",
        "bg-transparent border-none focus-ring",
      )}
    >
      {/* Relationship indicator */}
      <span
        className={cn(
          "shrink-0 text-2xs leading-none",
          path.relationship === "direct" ? "text-vsc-accent" : "text-vsc-text-ghost",
        )}
      >
        {path.relationship === "direct" ? "\u25CF" : "\u25CB"}
      </span>

      {/* Symbol name */}
      <span className="text-xs font-medium text-vsc-text-secondary truncate">
        {path.symbolName}
      </span>

      {/* File path + line — right-aligned */}
      <span className="ml-auto text-2xs text-vsc-text-ghost shrink-0 tabular-nums">
        {path.filePath}:{path.line}
      </span>
    </button>
  );
});
