/**
 * SemanticSearchOverlay — full-screen overlay for AI-powered code search.
 *
 * Features:
 * - Three search modes: Semantic (AI), Text (substring), Symbol (code symbols)
 * - Debounced search with streaming result animations
 * - Keyboard navigation: Arrow keys, Enter to open, Escape to close
 * - Grouped results with collapsible category headers
 * - Loading skeleton, empty state, and no-results state
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { useOverlayBehavior } from "../../../shared/lib";
import { OverlayPortal } from "../../../shared/ui/primitives/OverlayPortal";
import { cn } from "../../../shared/ui/variants";
import {
  closeSemanticSearchAtom,
  executeSemanticSearchAtom,
  type SearchMode,
  semanticSearchLoadingAtom,
  semanticSearchModeAtom,
  semanticSearchOpenAtom,
  semanticSearchQueryAtom,
  semanticSearchResultsAtom,
  semanticSearchSelectedIndexAtom,
  semanticSearchTotalCountAtom,
} from "../model/semanticSearchAtoms";
import { SearchModeToggle } from "./SearchModeToggle";
import { SearchResultCard } from "./SearchResultCard";

function alternativeModeName(mode: SearchMode): string {
  if (mode === "semantic") return "Text";
  if (mode === "text") return "Symbol";
  return "Semantic";
}

// ─── Constants ──────────────────────────────────────────────

const OVERLAY_ID = "semantic-search-overlay";
const RESULT_STAGGER_MS = 40;

// ─── Skeleton Loading State ─────────────────────────────────

const SkeletonCard = React.memo(function SkeletonCard({ index }: { index: number }) {
  return (
    <div
      className="px-3 py-2 border-l-2 border-l-transparent"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="animate-pulse space-y-1.5">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-vsc-surface-2" />
          <div className="h-3 rounded bg-vsc-surface-2" style={{ width: `${50 + index * 10}%` }} />
        </div>
        <div className="pl-4">
          <div className="h-2.5 rounded bg-vsc-surface-2/60 w-3/5" />
        </div>
        <div className="pl-4 space-y-1">
          <div className="h-2.5 rounded bg-vsc-surface-2/40 w-full" />
          <div className="h-2.5 rounded bg-vsc-surface-2/40 w-4/5" />
        </div>
      </div>
    </div>
  );
});

// ─── Category Group Header ──────────────────────────────────

const CategoryGroupHeader = React.memo(function CategoryGroupHeader({
  category,
  count,
  collapsed,
  onToggle,
}: {
  category: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "w-full flex items-center justify-between px-3 py-1.5",
        "text-2xs font-medium text-vsc-text-ghost/70 uppercase tracking-wider",
        "hover:text-vsc-text-secondary transition-colors duration-150 cursor-pointer select-none",
      )}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "codicon codicon-chevron-down text-2xs transition-transform duration-150",
            collapsed && "-rotate-90",
          )}
          aria-hidden="true"
        />
        {category}
      </div>
      <span className="text-vsc-text-ghost/50 tabular-nums">
        {count} {count === 1 ? "result" : "results"}
      </span>
    </button>
  );
});

// ─── Main Component ─────────────────────────────────────────

export const SemanticSearchOverlay = React.memo(function SemanticSearchOverlay() {
  const open = useAtomValue(semanticSearchOpenAtom);
  const [query, setQuery] = useAtom(semanticSearchQueryAtom);
  const [mode, setMode] = useAtom(semanticSearchModeAtom);
  const [selectedIndex, setSelectedIndex] = useAtom(semanticSearchSelectedIndexAtom);
  const groups = useAtomValue(semanticSearchResultsAtom);
  const loading = useAtomValue(semanticSearchLoadingAtom);
  const totalCount = useAtomValue(semanticSearchTotalCountAtom);
  const executeSearch = useSetAtom(executeSemanticSearchAtom);
  const closeSearch = useSetAtom(closeSemanticSearchAtom);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // ─── Overlay behavior ────────────────────────────────────
  const handleClose = useCallback(() => {
    closeSearch();
  }, [closeSearch]);

  const { mounted, exiting } = useOverlayBehavior({
    id: OVERLAY_ID,
    type: "dialog",
    open,
    onClose: handleClose,
    containerRef,
    clickOutside: true,
    bodyLock: true,
    exitDurationMs: 150,
  });

  // ─── Focus input on open ─────────────────────────────────
  useEffect(() => {
    if (mounted && !exiting) {
      // Use rAF to ensure the DOM is painted before focusing
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [mounted, exiting]);

  // ─── Search execution ────────────────────────────────────
  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const {value} = e.target;
      setQuery(value);
      executeSearch(value);
    },
    [setQuery, executeSearch],
  );

  // ─── Mode change re-triggers search ──────────────────────
  const handleModeChange = useCallback(
    (newMode: SearchMode) => {
      setMode(newMode);
      // Re-execute search with current query + new mode
      // Need to set mode first, then trigger search
      executeSearch(query);
    },
    [setMode, executeSearch, query],
  );

  // ─── Visible results (accounting for collapsed groups) ───
  const flatResults = useMemo(() => {
    const flat: { result: (typeof groups)[number]["results"][number]; groupIndex: number }[] = [];
    for (let gi = 0; gi < groups.length; gi++) {
      const group = groups[gi];
      if (group && !collapsedCategories.has(group.category)) {
        for (const result of group.results) {
          flat.push({ result, groupIndex: gi });
        }
      }
    }
    return flat;
  }, [groups, collapsedCategories]);

  // ─── Keyboard navigation ─────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (flatResults[selectedIndex]) {
            // In a real app, this would navigate to the file
            // For now, just close the overlay
            handleClose();
          }
          break;
        }
        case "Tab": {
          // Cycle through modes with Tab
          e.preventDefault();
          const modes: SearchMode[] = ["semantic", "text", "symbol"];
          const currentIdx = modes.indexOf(mode);
          const nextIdx = e.shiftKey
            ? (currentIdx - 1 + modes.length) % modes.length
            : (currentIdx + 1) % modes.length;
          const nextMode = modes[nextIdx];
          if (nextMode) handleModeChange(nextMode);
          break;
        }
      }
    },
    [flatResults, selectedIndex, setSelectedIndex, handleClose, mode, handleModeChange],
  );

  // ─── Category toggle ─────────────────────────────────────
  const toggleCategory = useCallback((category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  // ─── Render ──────────────────────────────────────────────

  if (!mounted) return null;

  const hasQuery = query.trim().length > 0;
  const noResults = hasQuery && !loading && totalCount === 0;

  let globalFlatIndex = 0;

  return (
    <OverlayPortal>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[--z-overlay] bg-black/40 backdrop-blur-sm",
          "transition-opacity",
          exiting ? "opacity-0 duration-150" : "opacity-100 duration-200",
        )}
        aria-hidden="true"
      />

      {/* Overlay container */}
      <div className="fixed inset-0 z-[--z-overlay] flex items-start justify-center pt-[12vh]">
        <div
          ref={containerRef}
          role="dialog"
          aria-label="Semantic search"
          aria-modal="true"
          data-testid="semantic-search-overlay"
          onKeyDown={handleKeyDown}
          className={cn(
            "w-full max-w-2xl flex flex-col",
            "bg-vsc-surface-0/95 backdrop-blur-md",
            "border border-vsc-border/20 rounded-xl",
            "shadow-2xl shadow-black/20",
            "will-change-transform",
            exiting
              ? "animate-[semantic-overlay-exit_150ms_ease-in_forwards]"
              : "animate-[semantic-overlay-enter_200ms_ease-out]",
          )}
        >
          {/* Search Input */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-vsc-border/10">
            <span className="codicon codicon-search text-sm text-vsc-text-ghost" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleQueryChange}
              placeholder="Search code semantically..."
              aria-label="Search query"
              autoComplete="off"
              spellCheck={false}
              className={cn(
                "flex-1 bg-transparent text-sm text-vsc-fg",
                "placeholder:text-vsc-text-ghost/50",
                "outline-none border-none",
              )}
            />
            {loading && (
              <span
                className="codicon codicon-loading animate-spin text-xs text-vsc-text-ghost"
                aria-label="Searching..."
              />
            )}
          </div>

          {/* Mode Toggle */}
          <div className="px-4 py-2 border-b border-vsc-border/10">
            <SearchModeToggle mode={mode} onChange={handleModeChange} />
          </div>

          {/* Results Area */}
          <div
            ref={listRef}
            role="listbox"
            aria-label="Search results"
            className={cn(
              "flex-1 overflow-y-auto [scrollbar-gutter:stable]",
              "max-h-[50vh] min-h-[120px]",
            )}
          >
            {/* Empty state — no query yet */}
            {!hasQuery && !loading && (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <span
                  className="codicon codicon-search text-2xl text-vsc-text-ghost/30"
                  aria-hidden="true"
                />
                <p className="text-xs text-vsc-text-ghost/50">
                  Type to search across your codebase
                </p>
                <p className="text-2xs text-vsc-text-ghost/30">
                  Use Tab to switch between Semantic, Text, and Symbol modes
                </p>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="py-1">
                <SkeletonCard index={0} />
                <SkeletonCard index={1} />
                <SkeletonCard index={2} />
              </div>
            )}

            {/* No results */}
            {noResults && (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <span
                  className="codicon codicon-info text-lg text-vsc-text-ghost/40"
                  aria-hidden="true"
                />
                <p className="text-xs text-vsc-text-secondary">No results found</p>
                <p className="text-2xs text-vsc-text-ghost/50">
                  Try a different search term or switch to{" "}
                  {alternativeModeName(mode)} mode
                </p>
              </div>
            )}

            {/* Grouped results */}
            {!loading &&
              groups.map((group) => {
                const isCollapsed = collapsedCategories.has(group.category);
                return (
                  <div key={group.category}>
                    <CategoryGroupHeader
                      category={group.category}
                      count={group.results.length}
                      collapsed={isCollapsed}
                      onToggle={() => toggleCategory(group.category)}
                    />
                    {!isCollapsed &&
                      group.results.map((result) => {
                        const currentIndex = globalFlatIndex++;
                        return (
                          <SearchResultCard
                            key={result.id}
                            result={result}
                            isSelected={currentIndex === selectedIndex}
                            onClick={handleClose}
                            onMouseEnter={() => setSelectedIndex(currentIndex)}
                            staggerDelay={currentIndex * RESULT_STAGGER_MS}
                          />
                        );
                      })}
                  </div>
                );
              })}
          </div>

          {/* Footer hints */}
          <div className="flex items-center gap-3 px-4 py-2 border-t border-vsc-border/10 text-2xs text-vsc-text-ghost/50 select-none">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-vsc-surface-2/60 text-vsc-text-ghost font-mono text-2xs">
                &uarr;&darr;
              </kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-vsc-surface-2/60 text-vsc-text-ghost font-mono text-2xs">
                Enter
              </kbd>
              open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-vsc-surface-2/60 text-vsc-text-ghost font-mono text-2xs">
                Tab
              </kbd>
              switch mode
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-vsc-surface-2/60 text-vsc-text-ghost font-mono text-2xs">
                Esc
              </kbd>
              close
            </span>
            {totalCount > 0 && (
              <span className="ml-auto tabular-nums text-vsc-text-ghost/40">
                {totalCount} {totalCount === 1 ? "result" : "results"}
              </span>
            )}
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
});
