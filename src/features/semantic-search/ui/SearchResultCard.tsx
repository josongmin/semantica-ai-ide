/**
 * SearchResultCard — individual result item in the semantic search overlay.
 *
 * Displays symbol name, file path, AI-generated summary, and match score.
 */

import React, { useEffect, useRef } from "react";

import { cn } from "../../../shared/ui/variants";
import type { SemanticSearchResult } from "../model/semanticSearchAtoms";

// ─── Types ──────────────────────────────────────────────────

export interface SearchResultCardProps {
  result: SemanticSearchResult;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  /** Stagger delay for entrance animation (ms) */
  staggerDelay?: number;
}

// ─── Score Bar ──────────────────────────────────────────────

const ScoreBar = React.memo(function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="text-2xs tabular-nums text-vsc-text-ghost">{score.toFixed(2)}</span>
      <div className="w-10 h-1 rounded-full bg-vsc-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-vsc-accent/70 transition-[width] duration-slow ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
});

// ─── Component ──────────────────────────────────────────────

export const SearchResultCard = React.memo(function SearchResultCard({
  result,
  isSelected,
  onClick,
  onMouseEnter,
  staggerDelay = 0,
}: SearchResultCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.scrollIntoView({ block: "nearest" });
    }
  }, [isSelected]);

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={isSelected}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        "group relative px-3 py-2 cursor-pointer",
        "transition-colors duration-slow",
        isSelected
          ? "bg-vsc-accent/8 border-l-2 border-l-vsc-accent"
          : "border-l-2 border-l-transparent hover:bg-vsc-surface-2/50",
      )}
      style={{
        animation: `semantic-result-enter 200ms ease-out ${staggerDelay}ms both`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Left: symbol info */}
        <div className="min-w-0 flex-1">
          {/* Symbol name */}
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "codicon codicon-symbol-method text-2xs",
                isSelected ? "text-vsc-accent" : "text-vsc-text-ghost",
              )}
              aria-hidden="true"
            />
            <span className="text-xs font-medium text-vsc-fg truncate">{result.symbolName}</span>
          </div>

          {/* File path */}
          <div className="mt-0.5 text-2xs text-vsc-text-ghost truncate pl-4">
            {result.filePath}:{result.line}
          </div>

          {/* Summary */}
          <p className="mt-1 text-2xs text-vsc-text-secondary line-clamp-2 pl-4">
            {result.summary}
          </p>
        </div>

        {/* Right: score */}
        <div className="pt-0.5">
          <ScoreBar score={result.matchScore} />
        </div>
      </div>
    </div>
  );
});
