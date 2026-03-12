/**
 * SearchModeToggle — segmented control for switching between search modes.
 *
 * Renders three pill-shaped buttons with a sliding active indicator.
 */

import React, { useCallback, useMemo } from "react";

import { cn } from "../../../shared/ui/variants";
import type { SearchMode } from "../model/semanticSearchAtoms";

// ─── Types ──────────────────────────────────────────────────

export interface SearchModeToggleProps {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
}

// ─── Constants ──────────────────────────────────────────────

const MODES: { id: SearchMode; label: string; icon: string }[] = [
  { id: "semantic", label: "Semantic", icon: "sparkle" },
  { id: "text", label: "Text", icon: "case-sensitive" },
  { id: "symbol", label: "Symbol", icon: "symbol-method" },
];

// ─── Component ──────────────────────────────────────────────

export const SearchModeToggle = React.memo(function SearchModeToggle({
  mode,
  onChange,
}: SearchModeToggleProps) {
  const activeIndex = useMemo(() => MODES.findIndex((m) => m.id === mode), [mode]);

  const handleClick = useCallback(
    (id: SearchMode) => {
      if (id !== mode) onChange(id);
    },
    [mode, onChange],
  );

  return (
    <div
      className="flex items-center gap-0.5 p-0.5 rounded-lg bg-vsc-surface-2/60"
      role="radiogroup"
      aria-label="Search mode"
    >
      {/* Sliding background indicator */}
      <div className="relative flex items-center gap-0.5 w-full">
        <div
          className="absolute top-0 bottom-0 rounded-md bg-vsc-accent/15 transition-transform duration-slow ease-out"
          style={{
            width: `${100 / MODES.length}%`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />

        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={mode === m.id}
            onClick={() => handleClick(m.id)}
            className={cn(
              "relative z-10 flex-1 flex items-center justify-center gap-1.5",
              "px-3 py-1 rounded-md text-2xs font-medium",
              "transition-colors duration-slow cursor-pointer select-none",
              mode === m.id
                ? "text-vsc-accent"
                : "text-vsc-text-tertiary hover:text-vsc-text-secondary",
            )}
          >
            <span className={cn("codicon", `codicon-${m.icon}`, "text-xs")} aria-hidden="true" />
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
});
