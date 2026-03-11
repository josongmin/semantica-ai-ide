import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtom, useAtomValue } from "jotai";

import {
  historySearchOpenAtom,
  historySearchQueryAtom,
  promptHistoryAtom,
} from "../../features/prompt-history";
import { fuzzyScore } from "../../shared/lib/fuzzyScore";
import { cn, Icon, Text } from "../../shared/ui";

interface PromptHistorySearchOverlayProps {
  onSelect: (text: string) => void;
}

export const PromptHistorySearchOverlay = React.memo(function PromptHistorySearchOverlay({
  onSelect,
}: PromptHistorySearchOverlayProps) {
  const [open, setOpen] = useAtom(historySearchOpenAtom);
  const [query, setQuery] = useAtom(historySearchQueryAtom);
  const history = useAtomValue(promptHistoryAtom);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter and sort history by fuzzy score
  const filtered = useMemo(() => {
    if (!query.trim()) {
      return history.map((text, i) => ({ text, index: i, score: 0 }));
    }
    const results: { text: string; index: number; score: number }[] = [];
    for (let i = 0; i < history.length; i++) {
      const item = history[i];
      if (item === undefined) continue;
      const result = fuzzyScore(query, item);
      if (result) {
        results.push({ text: item, index: i, score: result.score });
      }
    }
    return results.sort((a, b) => b.score - a.score);
  }, [history, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setSelectedIndex(0);
  }, [setOpen, setQuery]);

  const confirmSelection = useCallback(() => {
    const item = filtered[selectedIndex];
    if (item) {
      onSelect(item.text);
    }
    close();
  }, [filtered, selectedIndex, onSelect, close]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        confirmSelection();
      }
    },
    [close, filtered.length, confirmSelection],
  );

  // Focus input when opened
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();

      setSelectedIndex(0);
    }
  }, [open]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  return (
    <div
      className="absolute inset-x-0 bottom-full z-[--z-overlay] border border-vsc-border rounded-t-md bg-vsc-surface-1 shadow-lg max-h-[--panel-max-h-sm] flex flex-col"
      data-testid="history-search-overlay"
    >
      {/* Search input */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-vsc-border">
        <Icon name="search" tokenSize="sm" className="text-vsc-text-ghost shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search prompt history..."
          className="flex-1 bg-transparent text-xs text-vsc-input-fg placeholder:text-vsc-text-ghost focus:outline-none focus-ring"
          aria-label="Search prompt history"
          data-testid="history-search-input"
        />
        <Text size="2xs" tone="ghost">
          Esc to close
        </Text>
      </div>

      {/* Results */}
      <div
        className="overflow-y-auto flex-1 scroll-shadow"
        role="listbox"
        aria-label="History search results"
        data-scroll-contain
      >
        {filtered.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <Text size="xs" tone="ghost">
              No matching history entries
            </Text>
          </div>
        ) : (
          filtered.slice(0, 50).map((item, i) => (
            <button
              key={item.index}
              type="button"
              className={cn(
                "w-full text-left px-3 py-1.5 text-xs truncate cursor-pointer focus-ring",
                i === selectedIndex
                  ? "bg-vsc-list-active text-vsc-list-active-fg"
                  : "hover:bg-vsc-list-hover text-vsc-text-primary",
              )}
              role="option"
              aria-selected={i === selectedIndex}
              onClick={() => {
                onSelect(item.text);
                close();
              }}
              onMouseEnter={() => setSelectedIndex(i)}
              data-testid={`history-item-${i}`}
            >
              {item.text}
            </button>
          ))
        )}
      </div>
    </div>
  );
});
