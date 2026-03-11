import React, { useCallback, useEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { atom, useAtomValue, useSetAtom } from "jotai";

import { cn, Icon } from "~shared/ui";

// ─── Constants ────────────────────────────────────────────

const MAX_OUTPUT_LINES = 5000;
const RETAINED_LINES = 4000;
const OUTPUT_ROW_HEIGHT = 20;

// ─── Output Channel Model ────────────────────────────────

export interface OutputLine {
  readonly text: string;
  readonly level: "info" | "warn" | "error" | "debug";
  readonly channel: string;
  readonly timestamp: number;
}

/** Global output lines atom — append from anywhere via useSetAtom */
// eslint-disable-next-line react-refresh/only-export-components
export const outputLinesAtom = atom<OutputLine[]>([]);
// eslint-disable-next-line react-refresh/only-export-components
export const appendOutputLineAtom = atom(null, (get, set, line: OutputLine) => {
  const prev = get(outputLinesAtom);
  const next =
    prev.length >= MAX_OUTPUT_LINES ? [...prev.slice(-RETAINED_LINES), line] : [...prev, line];
  set(outputLinesAtom, next);
});

const CHANNELS = ["All", "Agent", "Build", "LSP", "Extensions"] as const;

function levelIcon(level: OutputLine["level"]): string {
  if (level === "error") return "error";
  if (level === "warn") return "warning";
  if (level === "debug") return "bug";
  return "info";
}

const LEVEL_STYLE: Record<OutputLine["level"], string> = {
  info: "text-vsc-text-secondary",
  warn: "text-vsc-warning",
  error: "text-vsc-error",
  debug: "text-vsc-text-ghost",
};

// ─── Output View (Bottom Zone) ──────────────────────────

export const OutputView = React.memo(function OutputView() {
  const lines = useAtomValue(outputLinesAtom);
  const set = useSetAtom(outputLinesAtom);
  const [activeChannel, setActiveChannel] = useState<string>("All");
  const [levelFilter, setLevelFilter] = useState<Set<OutputLine["level"]>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const filtered = React.useMemo(() => {
    let result = lines;
    if (activeChannel !== "All") {
      result = result.filter((l) => l.channel === activeChannel);
    }
    if (levelFilter.size > 0) {
      result = result.filter((l) => levelFilter.has(l.level));
    }
    return result;
  }, [lines, activeChannel, levelFilter]);

  useEffect(() => {
    if (autoScroll) {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [filtered.length, autoScroll]);

  const handleScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(isAtBottom);
  }, []);

  const toggleLevel = useCallback((level: OutputLine["level"]) => {
    setLevelFilter((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }, []);

  const handleClear = useCallback(() => set([]), [set]);

  const handleScrollToBottom = useCallback(() => {
    setAutoScroll(true);
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => OUTPUT_ROW_HEIGHT,
    overscan: 20,
  });

  return (
    <div className="flex flex-col h-full w-full">
      {/* Channel tabs + controls */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-vsc-border/30 shrink-0">
        {CHANNELS.map((ch) => (
          <button
            key={ch}
            type="button"
            onClick={() => setActiveChannel(ch)}
            className={cn(
              "px-1.5 py-0.5 rounded text-2xs cursor-pointer transition-colors duration-fast focus-ring",
              activeChannel === ch
                ? "bg-vsc-surface-2 text-vsc-fg font-medium"
                : "text-vsc-text-ghost hover:text-vsc-text-secondary",
            )}
          >
            {ch}
          </button>
        ))}
        <div className="flex-1" />

        {/* Level toggles */}
        {(["error", "warn", "info", "debug"] as const).map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => toggleLevel(level)}
            className={cn(
              "w-5 h-5 rounded-sm flex items-center justify-center cursor-pointer transition-colors duration-fast",
              levelFilter.has(level)
                ? LEVEL_STYLE[level]
                : "text-vsc-text-ghost/50 hover:text-vsc-text-ghost",
            )}
            title={level}
            aria-label={level}
          >
            <Icon name={levelIcon(level)} tokenSize="2xs" />
          </button>
        ))}

        {/* Clear */}
        <button
          type="button"
          onClick={handleClear}
          className="w-5 h-5 rounded-sm flex items-center justify-center text-vsc-text-ghost
                     hover:text-vsc-fg cursor-pointer transition-colors duration-fast"
          title="Clear Output"
          aria-label="Clear Output"
        >
          <Icon name="clear-all" tokenSize="2xs" />
        </button>
      </div>

      {/* Output lines */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto font-mono text-2xs leading-relaxed scroll-shadow"
        role="log"
      >
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-vsc-text-ghost text-xs">
            No output
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const line = filtered[virtualRow.index];
              if (line === undefined) return null;
              return (
                <div
                  key={`${line.timestamp}-${virtualRow.index}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className={cn(
                    "flex items-start gap-2 px-2 py-px hover:bg-vsc-list-hover/50",
                    LEVEL_STYLE[line.level],
                  )}
                >
                  <span className="text-vsc-text-ghost/50 tabular-nums shrink-0 w-[60px] select-none">
                    {new Date(line.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  {activeChannel === "All" && (
                    <span className="text-vsc-text-ghost/50 shrink-0 w-[56px] truncate">
                      [{line.channel}]
                    </span>
                  )}
                  <span className="whitespace-pre-wrap break-all">{line.text}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scroll-to-bottom indicator */}
      {!autoScroll && (
        <button
          type="button"
          onClick={handleScrollToBottom}
          className="absolute bottom-8 right-4 px-2 py-1 rounded-full text-2xs
                     bg-vsc-surface-2 text-vsc-accent border border-vsc-border/30
                     hover:bg-vsc-surface-2/80 cursor-pointer shadow-md transition-colors duration-fast"
        >
          <Icon name="arrow-down" tokenSize="2xs" className="mr-1" />
          New output
        </button>
      )}
    </div>
  );
});

/** @deprecated Use OutputView instead */
export { OutputView as OutputPanel };
