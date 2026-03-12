import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAtomValue, useSetAtom } from "jotai";

import { useKeyboardShortcut } from "~shared/lib";
import { cn, Icon, ViewEmptyState } from "~shared/ui";

import { type OutputLine, outputLinesAtom } from "../model/outputAtoms";

const OUTPUT_ROW_HEIGHT = 22;

// ─── Sample Data (dev-only) ─────────────────────────────

const now = Date.now();

const SAMPLE_OUTPUT: OutputLine[] = [
  {
    text: "[Agent] Session initialized — model: claude-sonnet-4-20250514, context: 128k",
    level: "info",
    channel: "Agent",
    timestamp: now - 52000,
  },
  {
    text: "[Agent] Loading workspace context from src/...",
    level: "debug",
    channel: "Agent",
    timestamp: now - 51000,
  },
  {
    text: "[Agent] Indexed 847 files in 1.2s",
    level: "info",
    channel: "Agent",
    timestamp: now - 49800,
  },
  {
    text: "[Build] vite v6.4.1 — dev server starting...",
    level: "info",
    channel: "Build",
    timestamp: now - 45000,
  },
  {
    text: "[Build] Pre-bundling dependencies: react, react-dom, jotai, codemirror...",
    level: "info",
    channel: "Build",
    timestamp: now - 44000,
  },
  {
    text: "[Build] Dependencies bundled in 812ms",
    level: "info",
    channel: "Build",
    timestamp: now - 43200,
  },
  {
    text: "[Build] VITE ready in 1.4s — http://localhost:5173/",
    level: "info",
    channel: "Build",
    timestamp: now - 43000,
  },
  {
    text: "[LSP] tsserver started (pid 48291)",
    level: "info",
    channel: "LSP",
    timestamp: now - 42000,
  },
  {
    text: "[LSP] Project loaded: /Users/songmin/semantica-code-agent-plugin/tsconfig.json",
    level: "info",
    channel: "LSP",
    timestamp: now - 41500,
  },
  {
    text: "[LSP] 3 errors, 4 warnings in workspace",
    level: "warn",
    channel: "LSP",
    timestamp: now - 41000,
  },
  {
    text: "[Extensions] Loaded: prettier, eslint, tailwindcss-intellisense",
    level: "info",
    channel: "Extensions",
    timestamp: now - 40000,
  },
  {
    text: "[Extensions] tailwindcss-intellisense: scanning for config...",
    level: "debug",
    channel: "Extensions",
    timestamp: now - 39500,
  },
  {
    text: "[Extensions] tailwindcss-intellisense: using /tailwind.config.ts",
    level: "info",
    channel: "Extensions",
    timestamp: now - 39000,
  },
  {
    text: "[Build] HMR update: src/shared/views/output/ui/OutputView.tsx",
    level: "info",
    channel: "Build",
    timestamp: now - 30000,
  },
  {
    text: "[Build] HMR update applied in 45ms",
    level: "debug",
    channel: "Build",
    timestamp: now - 29950,
  },
  {
    text: "[Agent] Tool call: read_file src/app/shell/frames/TitleBar.tsx",
    level: "info",
    channel: "Agent",
    timestamp: now - 25000,
  },
  {
    text: "[Agent] Tool call: search_for_pattern 'activeSidebarViewAtom'",
    level: "info",
    channel: "Agent",
    timestamp: now - 22000,
  },
  {
    text: "[Agent] Found 12 references across 8 files",
    level: "debug",
    channel: "Agent",
    timestamp: now - 21500,
  },
  {
    text: "[LSP] File changed: src/shared/bootstrap/terminal/ui/TerminalPanel.tsx — revalidating...",
    level: "debug",
    channel: "LSP",
    timestamp: now - 15000,
  },
  {
    text: "[LSP] Diagnostics updated: 0 errors, 0 warnings in TerminalPanel.tsx",
    level: "info",
    channel: "LSP",
    timestamp: now - 14500,
  },
  {
    text: "[Build] HMR update: src/shared/bootstrap/terminal/ui/TerminalPanel.tsx",
    level: "info",
    channel: "Build",
    timestamp: now - 14000,
  },
  {
    text: "[Extensions] prettier: formatted 2 files on save",
    level: "debug",
    channel: "Extensions",
    timestamp: now - 10000,
  },
  {
    text: "[Build] Warning: chunk 'mermaid' exceeds 500kB (682kB) — consider code splitting",
    level: "warn",
    channel: "Build",
    timestamp: now - 8000,
  },
  {
    text: "[Agent] Error: tool 'execute_command' timed out after 30s",
    level: "error",
    channel: "Agent",
    timestamp: now - 5000,
  },
  {
    text: "[Agent] Retrying with increased timeout (60s)...",
    level: "warn",
    channel: "Agent",
    timestamp: now - 4500,
  },
  {
    text: "[LSP] tsserver: request tq/completions took 1250ms (threshold: 500ms)",
    level: "warn",
    channel: "LSP",
    timestamp: now - 3000,
  },
  {
    text: "[Build] HMR update: src/shared/views/problems/ui/ProblemsView.tsx",
    level: "info",
    channel: "Build",
    timestamp: now - 1000,
  },
];

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
  error: "text-vsc-error",
  warn: "text-vsc-warning",
  info: "text-vsc-text-secondary",
  debug: "text-vsc-text-ghost",
};

const LEVEL_BG: Record<OutputLine["level"], string> = {
  error: "bg-vsc-error/6",
  warn: "bg-vsc-warning/4",
  info: "",
  debug: "",
};

// ─── Output View ─────────────────────────────────────────

export const OutputView = React.memo(function OutputView() {
  const liveLines = useAtomValue(outputLinesAtom);
  const lines = liveLines.length > 0 ? liveLines : SAMPLE_OUTPUT;
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

  // ── Keyboard scope (closest [data-keyboard-zone]) ──
  const [keyboardScope, setKeyboardScope] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const el = scrollRef.current?.closest<HTMLElement>("[data-keyboard-zone]");
    setKeyboardScope(el ?? null);
  }, []);

  // ── Keyboard shortcuts ──
  useKeyboardShortcut("mod+f", toggleSearch, { scope: keyboardScope });

  const dismissSearch = useCallback(() => {
    setSearchVisible(false);
    setSearchQuery("");
  }, []);
  useKeyboardShortcut("Escape", dismissSearch, {
    enabled: searchVisible,
    scope: keyboardScope,
  });

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
                  "inline-flex items-center gap-1 px-1.5 h-[22px] rounded-md text-2xs cursor-pointer transition-colors duration-normal focus-ring border border-transparent",
                  isActive
                    ? "bg-vsc-surface-2 text-vsc-fg font-medium border-vsc-border/20 shadow-sm"
                    : "text-vsc-text-ghost hover:text-vsc-text-secondary hover:bg-vsc-surface-2/40",
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
        <div className="flex items-center gap-1.5 px-2 h-[30px] shrink-0 border-b border-vsc-border/10 bg-vsc-surface-0/30">
          <Icon name="search" tokenSize="2xs" className="text-vsc-text-ghost shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter output…"
            className="flex-1 bg-transparent border-none outline-none text-2xs text-vsc-fg placeholder:text-vsc-text-ghost"
          />
          {searchQuery && (
            <span className="text-3xs text-vsc-text-ghost tabular-nums">
              {filtered.length} match{filtered.length !== 1 ? "es" : ""}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setSearchVisible(false);
              setSearchQuery("");
            }}
            className="p-0.5 rounded hover:bg-vsc-surface-2 cursor-pointer border-none bg-transparent"
          >
            <Icon name="close" tokenSize="3xs" className="text-vsc-text-ghost" />
          </button>
        </div>
      )}

      {/* ── Log output ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden font-mono text-2xs"
        role="log"
      >
        {filtered.length === 0 ? (
          <OutputEmptyState
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
            "bg-vsc-surface-2/95 text-vsc-text-secondary text-2xs",
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
        "group/row flex items-start gap-1.5 pl-2 pr-2 text-2xs",
        "cursor-default transition-colors duration-75",
        hovered ? cn("bg-vsc-list-hover/80", LEVEL_BG[line.level]) : "hover:bg-vsc-list-hover/50",
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Level icon */}
      <Icon
        name={LEVEL_ICON[line.level]}
        tokenSize="2xs"
        className={cn(
          "shrink-0 mt-[5px]",
          LEVEL_COLOR[line.level],
          line.level === "info" && "opacity-40",
          line.level === "debug" && "opacity-30",
        )}
      />

      {/* Timestamp */}
      <span className="text-vsc-text-ghost tabular-nums shrink-0 select-none leading-snug mt-[4px] text-3xs font-mono opacity-40 group-hover/row:opacity-70 transition-opacity">
        {timeStr}
      </span>

      {/* Channel tag */}
      {showChannel && (
        <span
          className={cn(
            "shrink-0 w-[52px] truncate text-3xs leading-snug mt-[4px] uppercase tracking-wider font-medium",
            LEVEL_COLOR[line.level],
            "opacity-50 group-hover/row:opacity-80 transition-opacity",
          )}
        >
          {line.channel}
        </span>
      )}

      {/* Text */}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "leading-snug text-vsc-text-secondary",
            wordWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre truncate block",
          )}
        >
          {searchQuery ? <HighlightText text={line.text} query={searchQuery} /> : line.text}
        </span>
      </div>

      {/* Copy button on hover */}
      <span
        className={cn(
          "shrink-0 ml-1 opacity-0 group-hover/row:opacity-100 transition-opacity duration-normal",
          "inline-flex items-center mt-[3px]",
        )}
      >
        <button
          type="button"
          onClick={handleCopy}
          className="w-[18px] h-[18px] rounded flex items-center justify-center text-vsc-text-ghost/50 hover:text-vsc-fg hover:bg-vsc-surface-2 cursor-pointer border-none bg-transparent"
          title="Copy line"
        >
          <Icon name="copy" tokenSize="3xs" />
        </button>
      </span>
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

function OutputEmptyState({
  hasLines,
  activeChannel,
  searchQuery,
}: {
  hasLines: boolean;
  activeChannel: string;
  searchQuery: string;
}) {
  if (searchQuery) {
    return <ViewEmptyState icon="search" title={`No matches for \u201c${searchQuery}\u201d`} />;
  }

  if (hasLines) {
    return <ViewEmptyState icon="filter" title={`No output in ${activeChannel} channel`} />;
  }

  return (
    <ViewEmptyState
      icon="output"
      title="Waiting for output..."
      subtitle="Agent, Build, LSP, Extension logs will appear here"
    />
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
