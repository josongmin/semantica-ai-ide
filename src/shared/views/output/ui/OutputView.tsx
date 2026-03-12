import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { atom, useAtomValue, useSetAtom } from "jotai";

import { cn, Icon } from "~shared/ui";

// ─── Constants ────────────────────────────────────────────

const MAX_OUTPUT_LINES = 5000;
const RETAINED_LINES = 4000;
const OUTPUT_ROW_HEIGHT = 22;

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
type Channel = (typeof CHANNELS)[number];

const CHANNEL_ICONS: Record<Channel, string> = {
  All: "list-flat",
  Agent: "hubot",
  Build: "tools",
  LSP: "symbol-namespace",
  Extensions: "extensions",
};

const LEVELS = ["error", "warn", "info", "debug"] as const;

const LEVEL_ICON: Record<OutputLine["level"], string> = {
  error: "error",
  warn: "warning",
  info: "info",
  debug: "bug",
};

const LEVEL_COLOR: Record<OutputLine["level"], string> = {
  error: "text-rose-400",
  warn: "text-amber-400",
  info: "text-vsc-text-secondary",
  debug: "text-vsc-text-ghost",
};

const LEVEL_BG: Record<OutputLine["level"], string> = {
  error: "bg-rose-500/6",
  warn: "bg-amber-500/4",
  info: "",
  debug: "",
};

// ─── Output View ─────────────────────────────────────────

export const OutputView = React.memo(function OutputView() {
  const lines = useAtomValue(outputLinesAtom);
  const setLines = useSetAtom(outputLinesAtom);
  const [activeChannel, setActiveChannel] = useState<Channel>("All");
  const [levelFilter, setLevelFilter] = useState<Set<OutputLine["level"]>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Channel counts ──
  const channelCounts = useMemo(() => {
    const counts: Record<string, number> = { All: lines.length };
    for (const line of lines) {
      counts[line.channel] = (counts[line.channel] ?? 0) + 1;
    }
    return counts;
  }, [lines]);

  // ── Level counts (within active channel) ──
  const channelLines = useMemo(
    () => (activeChannel === "All" ? lines : lines.filter((l) => l.channel === activeChannel)),
    [lines, activeChannel],
  );

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const line of channelLines) {
      counts[line.level] = (counts[line.level] ?? 0) + 1;
    }
    return counts;
  }, [channelLines]);

  // ── Filtered lines ──
  const filtered = useMemo(() => {
    let result = channelLines;
    if (levelFilter.size > 0) {
      result = result.filter((l) => levelFilter.has(l.level));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((l) => l.text.toLowerCase().includes(q));
    }
    return result;
  }, [channelLines, levelFilter, searchQuery]);

  // ── Auto-scroll ──
  useEffect(() => {
    if (autoScroll) {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [filtered.length, autoScroll]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  }, []);

  // ── Actions ──
  const toggleLevel = useCallback((level: OutputLine["level"]) => {
    setLevelFilter((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }, []);

  const handleClear = useCallback(() => setLines([]), [setLines]);

  const handleScrollToBottom = useCallback(() => {
    setAutoScroll(true);
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const toggleSearch = useCallback(() => {
    setSearchVisible((v) => {
      if (!v) requestAnimationFrame(() => searchInputRef.current?.focus());
      else setSearchQuery("");
      return !v;
    });
  }, []);

  // ── Keyboard ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        e.stopPropagation();
        toggleSearch();
      }
      if (e.key === "Escape" && searchVisible) {
        setSearchVisible(false);
        setSearchQuery("");
      }
    };
    const el = scrollRef.current?.closest("[data-keyboard-zone]");
    (el ?? document).addEventListener("keydown", handler as EventListener);
    return () => (el ?? document).removeEventListener("keydown", handler as EventListener);
  }, [searchVisible, toggleSearch]);

  // ── Virtualizer ──
  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => OUTPUT_ROW_HEIGHT,
    overscan: 30,
  });

  return (
    <div className="flex flex-col h-full w-full bg-vsc-bg">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-0.5 px-2 h-[32px] shrink-0 border-b border-vsc-border/15 bg-vsc-surface-0/50">
        {/* Channel tabs */}
        <div className="flex items-center gap-px">
          {CHANNELS.map((ch) => {
            const count = channelCounts[ch] ?? 0;
            const isActive = activeChannel === ch;
            return (
              <button
                key={ch}
                type="button"
                onClick={() => setActiveChannel(ch)}
                className={cn(
                  "inline-flex items-center gap-1 px-2 h-[22px] rounded-md text-xs cursor-pointer border-none",
                  isActive
                    ? "bg-vsc-surface-2 text-vsc-fg font-medium"
                    : "bg-transparent text-vsc-text-ghost hover:text-vsc-text-secondary hover:bg-vsc-surface-1",
                )}
              >
                <Icon name={CHANNEL_ICONS[ch]} size={12} className="shrink-0 opacity-60" />
                <span>{ch}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "ml-0.5 min-w-[16px] h-[14px] inline-flex items-center justify-center rounded-full text-3xs font-medium leading-none px-1",
                      isActive
                        ? "bg-vsc-fg/10 text-vsc-text-secondary"
                        : "bg-vsc-surface-2/60 text-vsc-text-ghost",
                    )}
                  >
                    {count > 999 ? "999+" : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        {/* Level filters with counts */}
        <div className="flex items-center gap-px">
          {LEVELS.map((level) => {
            const count = levelCounts[level] ?? 0;
            const isActive = levelFilter.has(level);
            return (
              <button
                key={level}
                type="button"
                onClick={() => toggleLevel(level)}
                title={`${level} (${count})`}
                className={cn(
                  "inline-flex items-center gap-0.5 h-[20px] px-1.5 rounded-md text-2xs cursor-pointer border-none",
                  isActive
                    ? cn(LEVEL_COLOR[level], "bg-vsc-surface-2")
                    : "text-vsc-text-ghost/40 bg-transparent hover:text-vsc-text-ghost",
                  count === 0 && "opacity-40",
                )}
              >
                <Icon name={LEVEL_ICON[level]} size={12} className="shrink-0" />
                {count > 0 && <span className="tabular-nums">{count}</span>}
              </button>
            );
          })}
        </div>

        <Separator />

        {/* Action buttons */}
        <ToolbarButton
          icon="search"
          label="Search (Cmd+F)"
          isActive={searchVisible}
          onClick={toggleSearch}
        />
        <ToolbarButton
          icon={wordWrap ? "word-wrap" : "word-wrap"}
          label={wordWrap ? "Disable Word Wrap" : "Enable Word Wrap"}
          isActive={wordWrap}
          onClick={() => setWordWrap((v) => !v)}
        />
        <ToolbarButton icon="clear-all" label="Clear Output" onClick={handleClear} />
      </div>

      {/* ── Search bar ── */}
      {searchVisible && (
        <div className="flex items-center gap-2 px-2 h-[30px] shrink-0 border-b border-vsc-border/10 bg-vsc-surface-0/30">
          <Icon name="search" size={13} className="text-vsc-text-ghost shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter output..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-vsc-fg placeholder:text-vsc-text-ghost/40"
          />
          {searchQuery && (
            <span className="text-2xs text-vsc-text-ghost tabular-nums">
              {filtered.length} match{filtered.length !== 1 ? "es" : ""}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setSearchVisible(false);
              setSearchQuery("");
            }}
            className="w-[18px] h-[18px] rounded flex items-center justify-center text-vsc-text-ghost hover:text-vsc-fg cursor-pointer border-none bg-transparent"
          >
            <Icon name="close" size={12} />
          </button>
        </div>
      )}

      {/* ── Log output ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden font-mono text-xs leading-[22px]"
        role="log"
      >
        {filtered.length === 0 ? (
          <EmptyState
            hasLines={lines.length > 0}
            activeChannel={activeChannel}
            searchQuery={searchQuery}
          />
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
              if (!line) return null;
              return (
                <LogRow
                  key={`${line.timestamp}-${virtualRow.index}`}
                  line={line}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  showChannel={activeChannel === "All"}
                  wordWrap={wordWrap}
                  searchQuery={searchQuery}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Scroll-to-bottom ── */}
      {!autoScroll && filtered.length > 0 && (
        <button
          type="button"
          onClick={handleScrollToBottom}
          className={cn(
            "absolute bottom-3 left-1/2 -translate-x-1/2",
            "inline-flex items-center gap-1.5 px-3 h-[26px] rounded-full",
            "bg-vsc-surface-2/95 text-vsc-text-secondary text-xs",
            "border border-vsc-border/20 shadow-lg shadow-black/10",
            "cursor-pointer backdrop-blur-sm",
            "hover:text-vsc-fg hover:bg-vsc-surface-3/95",
          )}
        >
          <Icon name="arrow-down" size={12} />
          <span>New output</span>
        </button>
      )}
    </div>
  );
});

// ─── Log Row ─────────────────────────────────────────────

const LogRow = React.memo(function LogRow({
  line,
  style,
  showChannel,
  wordWrap,
  searchQuery,
}: {
  line: OutputLine;
  style: React.CSSProperties;
  showChannel: boolean;
  wordWrap: boolean;
  searchQuery: string;
}) {
  const [hovered, setHovered] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(line.text);
  }, [line.text]);

  const timeStr = useMemo(
    () =>
      new Date(line.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    [line.timestamp],
  );

  return (
    <div
      style={style}
      className={cn(
        "group flex items-start gap-0 px-0 hover:bg-vsc-list-hover/40",
        LEVEL_BG[line.level],
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Level icon */}
      <span
        className={cn(
          "shrink-0 w-[28px] h-[22px] flex items-center justify-center",
          LEVEL_COLOR[line.level],
          line.level === "info" && "opacity-40",
          line.level === "debug" && "opacity-30",
        )}
      >
        <Icon name={LEVEL_ICON[line.level]} size={12} />
      </span>

      {/* Timestamp */}
      <span className="text-vsc-text-ghost/35 tabular-nums shrink-0 w-[62px] select-none leading-[22px]">
        {timeStr}
      </span>

      {/* Channel tag */}
      {showChannel && (
        <span
          className={cn(
            "shrink-0 w-[64px] truncate text-2xs leading-[22px] uppercase tracking-wider font-medium",
            LEVEL_COLOR[line.level],
            "opacity-50",
          )}
        >
          {line.channel}
        </span>
      )}

      {/* Text */}
      <span
        className={cn(
          "flex-1 min-w-0 leading-[22px] pl-1",
          LEVEL_COLOR[line.level],
          wordWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre truncate",
        )}
      >
        {searchQuery ? <HighlightText text={line.text} query={searchQuery} /> : line.text}
      </span>

      {/* Copy button on hover */}
      {hovered && (
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 w-[24px] h-[22px] flex items-center justify-center text-vsc-text-ghost/50 hover:text-vsc-fg cursor-pointer border-none bg-transparent"
          title="Copy line"
        >
          <Icon name="copy" size={12} />
        </button>
      )}
    </div>
  );
});

// ─── Highlight Text ──────────────────────────────────────

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let lastIndex = 0;

  let idx = lower.indexOf(q, lastIndex);
  while (idx !== -1) {
    if (idx > lastIndex) parts.push(text.slice(lastIndex, idx));
    parts.push(
      <mark key={idx} className="bg-vsc-selection text-inherit rounded-sm px-px">
        {text.slice(idx, idx + query.length)}
      </mark>,
    );
    lastIndex = idx + query.length;
    idx = lower.indexOf(q, lastIndex);
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return <>{parts}</>;
}

// ─── Empty State ─────────────────────────────────────────

function EmptyState({
  hasLines,
  activeChannel,
  searchQuery,
}: {
  hasLines: boolean;
  activeChannel: string;
  searchQuery: string;
}) {
  if (searchQuery) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-vsc-text-ghost">
        <Icon name="search" size={28} className="opacity-20" />
        <span className="text-xs">No matches for &ldquo;{searchQuery}&rdquo;</span>
      </div>
    );
  }

  if (hasLines) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-vsc-text-ghost">
        <Icon name="filter" size={28} className="opacity-20" />
        <span className="text-xs">No output in {activeChannel} channel</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <Icon name="output" size={32} className="text-vsc-text-ghost/15" />
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-vsc-text-ghost/60">Waiting for output...</span>
        <span className="text-2xs text-vsc-text-ghost/30">
          Agent, Build, LSP, Extension logs will appear here
        </span>
      </div>
    </div>
  );
}

// ─── Toolbar Components ──────────────────────────────────

function ToolbarButton({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: string;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "w-[22px] h-[22px] rounded-md flex items-center justify-center cursor-pointer border-none",
        isActive
          ? "text-vsc-text-secondary bg-vsc-surface-2"
          : "text-vsc-text-ghost/50 bg-transparent hover:text-vsc-text-ghost hover:bg-vsc-surface-1",
      )}
    >
      <Icon name={icon} size={13} />
    </button>
  );
}

function Separator() {
  return <span className="w-px h-3 bg-vsc-border/20 mx-1 shrink-0" />;
}

/** @deprecated Use OutputView instead */
export { OutputView as OutputPanel };
