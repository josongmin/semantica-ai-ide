/**
 * TerminalSlashCommands — Warp-style slash command palette for terminal
 *
 * Triggered by typing "/" at the prompt. Shows a floating command palette
 * at the cursor position with AI, session, and utility commands.
 *
 * Layout:
 *   /                                    ⌨
 *   ─────────────────────────────────────
 *   ✦ AI
 *     Ask AI          자연어로 명령어 생성
 *     Fix Error        마지막 에러 분석
 *     Explain          마지막 출력 설명
 *   ⊞ Session
 *     Split            현재 탭 분할
 *     New Tab          새 터미널 탭
 *     Close            현재 세션 닫기
 *   ⚙ Utility
 *     Clear            터미널 클리어
 *     Search           출력 내 검색
 *     Copy Output      마지막 출력 복사
 */

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Icon } from "~shared/ui/primitives/Icon";
import { Kbd } from "~shared/ui/primitives/Kbd";
import { OverlayPortal } from "~shared/ui/primitives/OverlayPortal";
import { cn } from "~shared/ui/variants";

// ─── Command Definitions ────────────────────────────────────

export type TerminalSlashCommandId =
  | "ai-ask"
  | "ai-fix"
  | "ai-explain"
  | "session-split"
  | "session-new-tab"
  | "session-close"
  | "util-clear"
  | "util-search"
  | "util-copy-output"
  | "util-open-editor";

export interface TerminalSlashCommandDef {
  readonly id: TerminalSlashCommandId;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly category: "ai" | "session" | "utility";
  readonly shortcut?: string;
  readonly keywords?: readonly string[];
}

const CATEGORIES = [
  { key: "ai" as const, label: "AI" },
  { key: "session" as const, label: "Session" },
  { key: "utility" as const, label: "Utility" },
] as const;

export const TERMINAL_SLASH_COMMANDS: readonly TerminalSlashCommandDef[] = [
  // AI
  {
    id: "ai-ask",
    name: "Ask AI",
    description: "자연어로 명령어 생성",
    icon: "sparkle",
    category: "ai",
    shortcut: "⌘I",
    keywords: ["ai", "ask", "generate", "command", "warp"],
  },
  {
    id: "ai-fix",
    name: "Fix Error",
    description: "마지막 에러 분석 및 수정",
    icon: "lightbulb-autofix",
    category: "ai",
    keywords: ["fix", "error", "debug", "repair"],
  },
  {
    id: "ai-explain",
    name: "Explain",
    description: "마지막 출력 설명",
    icon: "comment-discussion",
    category: "ai",
    keywords: ["explain", "what", "why", "help"],
  },
  // Session
  {
    id: "session-split",
    name: "Split",
    description: "현재 탭 분할",
    icon: "split-horizontal",
    category: "session",
    shortcut: "⌘\\",
    keywords: ["split", "pane", "divide"],
  },
  {
    id: "session-new-tab",
    name: "New Tab",
    description: "새 터미널 탭",
    icon: "add",
    category: "session",
    shortcut: "⌘T",
    keywords: ["new", "tab", "terminal", "create"],
  },
  {
    id: "session-close",
    name: "Close",
    description: "현재 세션 닫기",
    icon: "close",
    category: "session",
    shortcut: "⌘W",
    keywords: ["close", "exit", "kill", "quit"],
  },
  // Utility
  {
    id: "util-clear",
    name: "Clear",
    description: "터미널 클리어",
    icon: "clear-all",
    category: "utility",
    shortcut: "⌘L",
    keywords: ["clear", "clean", "reset"],
  },
  {
    id: "util-search",
    name: "Search",
    description: "출력 내 검색",
    icon: "search",
    category: "utility",
    shortcut: "⌘F",
    keywords: ["search", "find", "grep"],
  },
  {
    id: "util-copy-output",
    name: "Copy Output",
    description: "마지막 출력 복사",
    icon: "copy",
    category: "utility",
    keywords: ["copy", "clipboard", "output"],
  },
  {
    id: "util-open-editor",
    name: "Open in Editor",
    description: "현재 디렉토리 열기",
    icon: "go-to-file",
    category: "utility",
    keywords: ["open", "editor", "file", "directory"],
  },
];

// ─── Fuzzy Match ────────────────────────────────────────────

function fuzzyMatch(query: string, target: string): { score: number; indices: number[] } {
  if (!query) return { score: 1, indices: [] };
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  let score = 0;
  const indices: number[] = [];

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      indices.push(ti);
      score += ti === 0 || t[ti - 1] === " " || t[ti - 1] === "-" ? 2 : 1;
      qi++;
    }
  }

  return qi === q.length ? { score, indices } : { score: 0, indices: [] };
}

// ─── Hook ───────────────────────────────────────────────────

export interface TerminalSlashCommandState {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  filteredGroups: { category: string; label: string; items: FilteredCommand[] }[];
  totalItems: number;
}

interface FilteredCommand {
  def: TerminalSlashCommandDef;
  score: number;
  matchIndices: number[];
}

export function useTerminalSlashCommand() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredGroups = useMemo(() => {
    const groups: { category: string; label: string; items: FilteredCommand[] }[] = [];

    for (const cat of CATEGORIES) {
      const items: FilteredCommand[] = [];

      for (const cmd of TERMINAL_SLASH_COMMANDS) {
        if (cmd.category !== cat.key) continue;

        // Match against name, description, and keywords
        const nameMatch = fuzzyMatch(query, cmd.name);
        const descMatch = fuzzyMatch(query, cmd.description);
        const kwMatch = cmd.keywords
          ? Math.max(...cmd.keywords.map((kw) => fuzzyMatch(query, kw).score))
          : 0;

        const bestScore = Math.max(nameMatch.score, descMatch.score, kwMatch);
        if (bestScore > 0) {
          items.push({
            def: cmd,
            score: bestScore,
            matchIndices: nameMatch.score >= descMatch.score ? nameMatch.indices : [],
          });
        }
      }

      if (items.length > 0) {
        items.sort((a, b) => b.score - a.score);
        groups.push({ category: cat.key, label: cat.label, items });
      }
    }

    return groups;
  }, [query]);

  const totalItems = useMemo(
    () => filteredGroups.reduce((sum, g) => sum + g.items.length, 0),
    [filteredGroups],
  );

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setSelectedIndex(0);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    handleQueryChange("");
  }, [handleQueryChange]);

  const close = useCallback(() => {
    setIsOpen(false);
    handleQueryChange("");
  }, [handleQueryChange]);

  const moveSelection = useCallback(
    (delta: number) => {
      setSelectedIndex((prev) => {
        if (totalItems === 0) return 0;
        return (prev + delta + totalItems) % totalItems;
      });
    },
    [totalItems],
  );

  const getSelectedCommandId = useCallback((): TerminalSlashCommandId | null => {
    let idx = 0;
    for (const group of filteredGroups) {
      for (const item of group.items) {
        if (idx === selectedIndex) return item.def.id;
        idx++;
      }
    }
    return null;
  }, [filteredGroups, selectedIndex]);

  return {
    isOpen,
    query,
    selectedIndex,
    filteredGroups,
    totalItems,
    open,
    close,
    setQuery: handleQueryChange,
    setSelectedIndex,
    moveSelection,
    getSelectedCommandId,
  };
}

// ─── Palette Component ──────────────────────────────────────

interface TerminalCommandPaletteProps {
  open: boolean;
  query: string;
  groups: { category: string; label: string; items: FilteredCommand[] }[];
  selectedIndex: number;
  anchorPosition: { x: number; y: number } | null;
  onSelect: (id: TerminalSlashCommandId) => void;
  onHover: (index: number) => void;
  onQueryChange: (query: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onClose: () => void;
}

const CategoryHeader = memo(function CategoryHeader({
  label,
  icon,
}: {
  label: string;
  icon: string;
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 text-3xs font-medium text-vsc-text-ghost tracking-wider uppercase select-none">
      <Icon name={icon} size={10} className="opacity-50" />
      {label}
    </div>
  );
});

const CATEGORY_ICONS: Record<string, string> = {
  ai: "sparkle",
  session: "layout",
  utility: "settings-gear",
};

const CommandRow = memo(function CommandRow({
  def,
  matchIndices,
  selected,
  onSelect,
  onMouseEnter,
}: {
  def: TerminalSlashCommandDef;
  matchIndices: number[];
  selected: boolean;
  onSelect: (id: TerminalSlashCommandId) => void;
  onMouseEnter: () => void;
}) {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected && itemRef.current) {
      itemRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [selected]);

  return (
    <div
      ref={itemRef}
      role="option"
      aria-selected={selected}
      onClick={() => onSelect(def.id)}
      onMouseEnter={onMouseEnter}
      className={cn(
        "flex items-center gap-2.5 px-3 py-1.5 cursor-pointer",
        "transition-colors duration-fast",
        selected ? "bg-vsc-list-active text-vsc-fg" : "text-vsc-fg hover:bg-vsc-list-hover",
      )}
    >
      <Icon
        name={def.icon}
        size={14}
        className={cn("shrink-0", selected ? "text-vsc-accent" : "text-vsc-text-secondary")}
      />
      <div className="flex-1 min-w-0 flex items-baseline gap-2">
        <span className="text-2xs font-medium whitespace-nowrap">
          {matchIndices.length > 0 ? highlightText(def.name, matchIndices) : def.name}
        </span>
        <span className="text-3xs text-vsc-text-tertiary truncate">{def.description}</span>
      </div>
      {def.shortcut && <Kbd className="shrink-0 ml-auto text-3xs">{def.shortcut}</Kbd>}
    </div>
  );
});

/** Render text with highlighted match characters */
function highlightText(text: string, indices: number[]) {
  const set = new Set(indices);
  return (
    <>
      {text.split("").map((ch, i) =>
        set.has(i) ? (
          <span key={i} className="text-vsc-accent font-semibold">
            {ch}
          </span>
        ) : (
          <span key={i}>{ch}</span>
        ),
      )}
    </>
  );
}

export const TerminalCommandPalette = memo(function TerminalCommandPalette({
  open,
  query,
  groups,
  selectedIndex,
  anchorPosition,
  onSelect,
  onHover,
  onQueryChange,
  onKeyDown,
  onClose,
}: TerminalCommandPaletteProps) {
  const paletteRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on open
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Click-outside to close
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (paletteRef.current && !paletteRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  if (!open || !anchorPosition) return null;

  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);
  const isEmpty = totalItems === 0 && query.length > 0;
  let globalIndex = 0;

  return (
    <OverlayPortal>
      <div
        ref={paletteRef}
        role="listbox"
        aria-label="Terminal commands"
        data-testid="terminal-slash-palette"
        className={cn(
          "z-[--z-overlay] w-[280px]",
          "glass-panel border border-vsc-border/40 rounded-lg shadow-xl",
          "animate-[slide-up-in_var(--duration-normal)_var(--ease-spring)]",
          "will-change-transform",
        )}
        style={{
          position: "fixed",
          left: Math.min(anchorPosition.x, window.innerWidth - 296),
          top: Math.max(anchorPosition.y - 8, 8),
          transform: "translateY(-100%)",
        }}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-vsc-border/30">
          <Icon name="terminal" size={12} className="text-vsc-text-ghost shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a command..."
            className={cn(
              "flex-1 bg-transparent text-2xs text-vsc-fg",
              "placeholder:text-vsc-text-ghost/60",
              "outline-none",
            )}
            autoComplete="off"
            spellCheck={false}
          />
          <Kbd className="text-3xs shrink-0">/</Kbd>
        </div>

        {/* Command list */}
        <div className="max-h-[240px] overflow-y-auto py-1 scroll-shadow">
          {isEmpty && (
            <div className="px-3 py-4 text-2xs text-vsc-text-ghost text-center">
              No commands found
            </div>
          )}

          {groups.map((group) => (
            <div key={group.category}>
              <CategoryHeader
                label={group.label}
                icon={CATEGORY_ICONS[group.category] ?? "symbol-misc"}
              />
              {group.items.map((item) => {
                const currentIndex = globalIndex++;
                return (
                  <CommandRow
                    key={item.def.id}
                    def={item.def}
                    matchIndices={item.matchIndices}
                    selected={currentIndex === selectedIndex}
                    onSelect={onSelect}
                    onMouseEnter={() => onHover(currentIndex)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </OverlayPortal>
  );
});
