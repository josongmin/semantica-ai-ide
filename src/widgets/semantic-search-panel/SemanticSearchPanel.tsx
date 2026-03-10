import React, { useCallback, useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { useSemanticSearch } from "../../features/semantic-search";
import { getVscodeApi } from "../../shared/lib/vscodeApi";
import type { SemanticSearchResult } from "../../shared/protocol";
import { Button, cn, Icon, Input, Text } from "../../shared/ui";
import { IndexStatusBadge } from "./IndexStatusBadge";

/** 검색 결과 클릭 시 에디터에서 해당 위치 열기 */
function openResult(result: SemanticSearchResult) {
  getVscodeApi().postMessage({
    type: "OPEN_FILE",
    file_path: result.file_path,
    line: result.line_number,
  });
}

export const SemanticSearchPanel = React.memo(function SemanticSearchPanel() {
  const { panelVisible, results, indexStatus, triggerSearch, triggerReindex } =
    useSemanticSearch();

  const [query, setQuery] = useState("");
  const [focusIndex, setFocusIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 56,
    overscan: 8,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      setFocusIndex(0);
      clearTimeout(debounceRef.current);
      if (value.trim().length > 0) {
        debounceRef.current = setTimeout(() => {
          triggerSearch(value.trim());
        }, 280);
      }
    },
    [triggerSearch],
  );

  const selectResult = useCallback((result: SemanticSearchResult) => {
    openResult(result);
  }, []);

  // 키보드 네비게이션 (Cmd/Ctrl+K 스타일)
  useEffect(() => {
    if (!panelVisible) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusIndex((i) => Math.min(i + 1, results.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        const focused = results[focusIndex];
        if (!focused) return;
        e.preventDefault();
        selectResult(focused);
        
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panelVisible, results, focusIndex, selectResult]);

  // Scroll focused item into view via virtualizer
  useEffect(() => {
    if (!panelVisible) return;
    if (results.length > 0 && focusIndex >= 0) {
      virtualizer.scrollToIndex(focusIndex, { align: "auto" });
    }
  }, [panelVisible, focusIndex, results.length, virtualizer]);

  useEffect(() => {
    if (!panelVisible) return;
    setFocusIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [panelVisible]);

  if (!panelVisible) return null;

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      className="flex flex-col flex-1 min-h-0 min-w-0"
      role="region"
      aria-label="Semantic search"
      data-testid="semantic-search-panel"
    >
      {/* Status + Reindex — SOTA: Ready (N files) 그린 pill + Reindex */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-vsc-border/40 shrink-0">
        <IndexStatusBadge />
        <Button
          variant="ghost"
          size="sm"
          onClick={triggerReindex}
          aria-label="Reindex codebase"
          data-testid="reindex-button"
          className="text-vsc-text-secondary hover:text-vsc-fg transition-colors duration-fast text-xs"
        >
          Reindex
        </Button>
      </div>

      {/* Search input — prominent, SOTA-style */}
      <div className="px-4 py-3 border-b border-vsc-border/40 shrink-0">
        <div className="relative">
          <Icon
            name="search"
            tokenSize="sm"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-vsc-text-tertiary pointer-events-none"
          />
          <Input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search codebase semantically..."
            className="pl-8 pr-3 py-2 rounded-lg text-sm"
            aria-label="Semantic search query"
            data-testid="search-input"
          />
        </div>
      </div>

      {/* Results — SOTA: file:line, snippet, confidence pill */}
      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain py-1 scroll-shadow"
        role="list"
        aria-label="Search results"
      >
        {results.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Icon
              name="search"
              tokenSize="lg"
              className="mx-auto mb-2 text-vsc-text-ghost opacity-60"
            />
            <Text size="sm" tone="tertiary">
              {(() => { if (query.trim().length === 0) return "Enter a query to search the codebase"; if (indexStatus === "indexing") return "Indexing\u2026 try again shortly"; return "No results found"; })()}
            </Text>
          </div>
        ) : (
          <div
            className="relative w-full px-2"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualItems.map((virtualRow) => {
              const result = results[virtualRow.index];
              if (!result) return null;
              const idx = virtualRow.index;
              return (
                <button
                  key={`${result.file_path}:${result.line_number}`}
                  ref={virtualizer.measureElement}
                  data-index={virtualRow.index}
                  type="button"
                  role="listitem"
                  onClick={() => selectResult(result)}
                  className={cn(
                    "absolute left-2 right-2 text-left px-2.5 py-2 rounded-lg transition-colors duration-fast",
                    "hover:bg-vsc-list-hover focus:bg-vsc-list-hover focus:outline-none focus-ring",
                    focusIndex === idx && "bg-vsc-list-hover",
                  )}
                  style={{
                    top: 0,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  data-testid={`search-result-${idx}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Text
                      size="xs"
                      mono
                      tone="primary"
                      truncate
                      className="flex-1 min-w-0 shrink-0"
                    >
                      {result.file_path}:{result.line_number}
                    </Text>
                    <span
                      className={cn(
                        "shrink-0 px-2 py-0.5 rounded-md text-2xs font-medium",
                        "bg-vsc-surface-3 text-vsc-text-secondary",
                        "border border-vsc-border/60",
                      )}
                    >
                      {result.score.toFixed(2)}
                    </span>
                  </div>
                  {result.snippet && (
                    <Text
                      size="2xs"
                      tone="tertiary"
                      mono
                      className="mt-1 line-clamp-2 break-words"
                    >
                      {result.snippet}
                    </Text>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
