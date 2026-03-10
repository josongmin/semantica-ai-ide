/**
 * CommandSearchOverlay — Terminal Command Search (Cmd+K)
 *
 * A command palette-style overlay for searching through:
 * - Recent commands (from active session history)
 * - Package.json scripts (from AI context)
 * - Common dev commands (curated list)
 *
 * Fuzzy-searched via shared `fuzzyScore` utility.
 * Positioned at z-[24] between AI command input (z-22) and search (z-25).
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { fuzzyScore } from "~shared/lib/fuzzyScore";
import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import { terminalAIContextAtom, terminalCommandSearchVisibleAtom } from "../model/aiAtoms";
import { activeSessionCommandsAtom } from "../model/atoms";
import { workflowTemplatesAtom } from "../model/workflowAtoms";

// ─── Types ──────────────────────────────────────────────────

interface CommandEntry {
  readonly id: string;
  readonly command: string;
  readonly label: string;
  readonly icon: string;
  readonly category: "recent" | "script" | "common" | "workflow";
  /** For recent commands: timestamp (ms) */
  readonly timestamp?: number;
  /** For scripts: the script body */
  readonly scriptBody?: string;
}

export interface CommandSearchOverlayProps {
  onExecute: (command: string) => void;
}

// ─── Common Commands ────────────────────────────────────────

const COMMON_COMMANDS: readonly CommandEntry[] = [
  { id: "common:git-status", command: "git status", label: "Git status", icon: "git-commit", category: "common" },
  { id: "common:git-diff", command: "git diff", label: "Git diff", icon: "diff", category: "common" },
  { id: "common:git-log", command: "git log --oneline -10", label: "Git log (last 10)", icon: "history", category: "common" },
  { id: "common:ls", command: "ls -la", label: "List files", icon: "files", category: "common" },
  { id: "common:pwd", command: "pwd", label: "Print working directory", icon: "folder", category: "common" },
];

// ─── Helpers ────────────────────────────────────────────────

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

// ─── Component ──────────────────────────────────────────────

export const CommandSearchOverlay = memo(function CommandSearchOverlay({
  onExecute,
}: CommandSearchOverlayProps) {
  const visible = useAtomValue(terminalCommandSearchVisibleAtom);
  const setVisible = useSetAtom(terminalCommandSearchVisibleAtom);
  const aiContext = useAtomValue(terminalAIContextAtom);
  const activeCommands = useAtomValue(activeSessionCommandsAtom);
  const workflows = useAtomValue(workflowTemplatesAtom);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // ─── Build unified entry list ───────────────────────────
  const allEntries = useMemo<CommandEntry[]>(() => {
    const entries: CommandEntry[] = [];

    // Recent commands (deduplicated, most recent first)
    const seen = new Set<string>();
    const reversed = [...activeCommands].reverse();
    for (const cmd of reversed) {
      if (!seen.has(cmd.command)) {
        seen.add(cmd.command);
        entries.push({
          id: `recent:${cmd.commandId}`,
          command: cmd.command,
          label: cmd.command,
          icon: "history",
          category: "recent",
          timestamp: cmd.startedAt,
        });
      }
    }

    // Package.json scripts
    const scripts = aiContext?.availableScripts ?? [];
    const pkgMgr = aiContext?.packageManager ?? "npm";
    for (const script of scripts) {
      // script format may be "name" or "name → body"
      const sepIdx = script.indexOf(" → ");
      const name = sepIdx >= 0 ? script.slice(0, sepIdx).trim() : script.trim();
      const body = sepIdx >= 0 ? script.slice(sepIdx + 3).trim() : undefined;
      entries.push({
        id: `script:${name}`,
        command: `${pkgMgr} run ${name}`,
        label: name,
        icon: "zap",
        category: "script",
        ...(body ? { scriptBody: body } : {}),
      } as CommandEntry);
    }

    // Workflow templates
    for (const wf of workflows) {
      entries.push({
        id: `workflow:${wf.id}`,
        command: wf.steps[0]?.command ?? wf.name,
        label: wf.name,
        icon: wf.icon || "rocket",
        category: "workflow",
        scriptBody: `${wf.steps.length} steps`,
      });
    }

    // Common commands
    entries.push(...COMMON_COMMANDS);

    return entries;
  }, [activeCommands, aiContext, workflows]);

  // ─── Filtered + scored results ──────────────────────────
  const filteredEntries = useMemo(() => {
    if (!query.trim()) return allEntries;

    const scored: { entry: CommandEntry; score: number }[] = [];
    for (const entry of allEntries) {
      // Score against both command and label
      const commandResult = fuzzyScore(query, entry.command);
      const labelResult = fuzzyScore(query, entry.label);
      const best = Math.max(commandResult?.score ?? 0, labelResult?.score ?? 0);
      if (best > 0) {
        scored.push({ entry, score: best });
      }
    }

    return scored.sort((a, b) => b.score - a.score).map((s) => s.entry);
  }, [allEntries, query]);

  // ─── Reset selected index on filter change ─────────────
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredEntries.length]);

  // ─── Focus on open ──────────────────────────────────────
  useEffect(() => {
    if (visible) {
      setQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [visible]);

  // ─── Close handler ──────────────────────────────────────
  const handleClose = useCallback(() => {
    setVisible(false);
  }, [setVisible]);

  // ─── Execute handler ────────────────────────────────────
  const handleExecute = useCallback(
    (command: string) => {
      onExecute(command);
      setVisible(false);
    },
    [onExecute, setVisible],
  );

  // ─── Scroll selected item into view ─────────────────────
  useEffect(() => {
    if (!visible) return;
    const list = listRef.current;
    if (!list) return;
    const item = list.querySelector(`[data-index="${selectedIndex}"]`);
    if (item) {
      item.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, visible]);

  // ─── Keyboard navigation ────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredEntries.length - 1 ? prev + 1 : 0,
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredEntries.length - 1,
        );
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const entry = filteredEntries[selectedIndex];
        if (entry) {
          handleExecute(entry.command);
        }
        
      }
    },
    [filteredEntries, selectedIndex, handleClose, handleExecute],
  );

  if (!visible) return null;

  // ─── Group entries by category for rendering ────────────
  const recentEntries = filteredEntries.filter((e) => e.category === "recent");
  const scriptEntries = filteredEntries.filter((e) => e.category === "script");
  const workflowEntries = filteredEntries.filter((e) => e.category === "workflow");
  const commonEntries = filteredEntries.filter((e) => e.category === "common");

  // Build flat index for keyboard navigation
  let flatIndex = 0;
  const assignIndex = () => flatIndex++;

  return (
    <div
      className={cn(
        "pointer-events-auto",
        "absolute bottom-4 left-1/2 -translate-x-1/2 z-[24]",
        "w-[calc(100vw-2rem)] sm:w-[420px] max-h-[360px] flex flex-col",
        "bg-vsc-surface-2/95 backdrop-blur-md",
        "border border-vsc-border rounded-lg shadow-xl",
        "animate-[slide-in-bottom_100ms_var(--ease-spring)]",
      )}
      role="dialog"
      aria-label="Command search"
      onKeyDown={handleKeyDown}
    >
      {/* Header / Search input */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-vsc-border/30">
        <Icon name="search" size={14} className="text-vsc-text-ghost shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search commands..."
          className={cn(
            "flex-1 bg-transparent text-2xs text-vsc-fg",
            "placeholder:text-vsc-text-ghost/60",
            "outline-none",
          )}
          spellCheck={false}
          autoComplete="off"
        />
        <kbd className="text-3xs text-vsc-text-ghost bg-vsc-surface-1 px-1.5 py-0.5 rounded border border-vsc-border/30 font-mono">
          ⌘K
        </kbd>
      </div>

      {/* Scrollable results */}
      <div ref={listRef} className="flex-1 overflow-y-auto min-h-0 py-1">
        {filteredEntries.length === 0 ? (
          <div className="px-3 py-4 text-center text-2xs text-vsc-text-ghost">
            No matching commands
          </div>
        ) : (
          <>
            {recentEntries.length > 0 && (
              <CommandGroup label="Recent">
                {recentEntries.map((entry) => {
                  const idx = assignIndex();
                  return (
                    <CommandRow
                      key={entry.id}
                      entry={entry}
                      dataIndex={idx}
                      selected={selectedIndex === idx}
                      onSelect={() => setSelectedIndex(idx)}
                      onExecute={handleExecute}
                    />
                  );
                })}
              </CommandGroup>
            )}
            {scriptEntries.length > 0 && (
              <CommandGroup label="Scripts">
                {scriptEntries.map((entry) => {
                  const idx = assignIndex();
                  return (
                    <CommandRow
                      key={entry.id}
                      entry={entry}
                      dataIndex={idx}
                      selected={selectedIndex === idx}
                      onSelect={() => setSelectedIndex(idx)}
                      onExecute={handleExecute}
                    />
                  );
                })}
              </CommandGroup>
            )}
            {workflowEntries.length > 0 && (
              <CommandGroup label="Workflows">
                {workflowEntries.map((entry) => {
                  const idx = assignIndex();
                  return (
                    <CommandRow
                      key={entry.id}
                      entry={entry}
                      dataIndex={idx}
                      selected={selectedIndex === idx}
                      onSelect={() => setSelectedIndex(idx)}
                      onExecute={handleExecute}
                    />
                  );
                })}
              </CommandGroup>
            )}
            {commonEntries.length > 0 && (
              <CommandGroup label="Common">
                {commonEntries.map((entry) => {
                  const idx = assignIndex();
                  return (
                    <CommandRow
                      key={entry.id}
                      entry={entry}
                      dataIndex={idx}
                      selected={selectedIndex === idx}
                      onSelect={() => setSelectedIndex(idx)}
                      onExecute={handleExecute}
                    />
                  );
                })}
              </CommandGroup>
            )}
          </>
        )}
      </div>

      {/* Footer hints */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-t border-vsc-border/30 text-3xs text-vsc-text-ghost select-none">
        <span>↑↓ navigate</span>
        <span>↵ execute</span>
        <span>Esc close</span>
      </div>
    </div>
  );
});

// ─── Command Group ──────────────────────────────────────────

interface CommandGroupProps {
  label: string;
  children: React.ReactNode;
}

const CommandGroup = memo(function CommandGroup({ label, children }: CommandGroupProps) {
  return (
    <div className="mb-0.5">
      <div className="px-3 py-1 text-3xs font-medium text-vsc-text-ghost uppercase tracking-wider">
        {label}
      </div>
      {children}
    </div>
  );
});

// ─── Command Row ────────────────────────────────────────────

interface CommandRowProps {
  entry: CommandEntry;
  dataIndex: number;
  selected: boolean;
  onSelect: () => void;
  onExecute: (command: string) => void;
}

const CommandRow = memo(function CommandRow({
  entry,
  dataIndex,
  selected,
  onSelect,
  onExecute,
}: CommandRowProps) {
  return (
    <button
      type="button"
      data-index={dataIndex}
      className={cn(
        "flex items-center gap-2 w-full px-3 py-1.5 text-left text-2xs",
        "transition-colors duration-fast",
        selected
          ? "bg-vsc-accent/15 text-vsc-fg"
          : "text-vsc-text-secondary hover:bg-vsc-surface-1",
      )}
      onClick={() => onExecute(entry.command)}
      onMouseEnter={onSelect}
      aria-selected={selected}
      role="option"
    >
      <Icon
        name={entry.icon}
        size={14}
        className={cn(
          "shrink-0",
          entry.category === "script" && "text-vsc-accent",
          entry.category === "workflow" && "text-vsc-warning",
          entry.category !== "script" && entry.category !== "workflow" && "text-vsc-text-ghost",
        )}
      />

      <span className="flex-1 min-w-0 truncate font-mono">
        {entry.category === "recent" && (
          <span className="text-vsc-text-ghost mr-1">$</span>
        )}
        {entry.category === "script" ? entry.label : entry.command}
      </span>

      {/* Right-side metadata */}
      {entry.category === "recent" && entry.timestamp !== undefined && entry.timestamp !== 0 && (
        <span className="shrink-0 text-3xs text-vsc-text-ghost tabular-nums">
          {formatRelativeTime(entry.timestamp)}
        </span>
      )}
      {entry.category === "script" && entry.scriptBody && (
        <span className="shrink-0 text-3xs text-vsc-text-ghost truncate max-w-[160px]">
          → {entry.scriptBody}
        </span>
      )}
      {entry.category === "workflow" && entry.scriptBody && (
        <span className="shrink-0 text-3xs text-vsc-warning/60 font-medium">
          {entry.scriptBody}
        </span>
      )}
    </button>
  );
});
