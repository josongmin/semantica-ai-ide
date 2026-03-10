import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAtomValue, useSetAtom, useStore } from "jotai";

import { messageAtomFamily, messageOrderAtom } from "~entities/message/core";

import {
  type CodeBlockEntry,
  codeBlockPickerOpenAtom,
  extractCodeBlocks,
} from "../../features/code-block-picker";
import { fuzzyScore, getVscodeApi, writeToClipboard } from "../../shared/lib";
import { Button, cn, Dialog, Icon, Text, Tooltip } from "../../shared/ui";

// ─── Constants ───────────────────────────────────────────────

const COPY_FEEDBACK_MS = 1500;

// ─── CodeBlockRow ────────────────────────────────────────────

interface CodeBlockRowProps {
  entry: CodeBlockEntry;
  focused: boolean;
  onCopy: (code: string) => void;
  onInsert: (code: string) => void;
}

const CodeBlockRow = React.memo(function CodeBlockRow({
  entry,
  focused,
  onCopy,
  onInsert,
}: CodeBlockRowProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ block: "nearest" });
  }, [focused]);

  return (
    <div
      ref={ref}
      className={cn(
        "group/cb rounded-md border overflow-hidden transition-colors duration-fast",
        focused ? "border-vsc-focus bg-vsc-focus/5" : "border-vsc-border hover:border-vsc-focus/50",
      )}
      data-testid={`cb-row-${entry.id}`}
    >
      {/* Header — language + actions */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-vsc-surface-3/50">
        <Icon name="code" tokenSize="2xs" className="text-vsc-text-tertiary shrink-0" />
        <Text size="2xs" weight="medium" tone="secondary" className="flex-1 min-w-0">
          {entry.language}
        </Text>
        <Text size="2xs" tone="ghost" mono>
          {entry.lineCount} line{entry.lineCount !== 1 ? "s" : ""}
        </Text>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover/cb:opacity-100 focus-within:opacity-100 transition-opacity duration-fast">
          <Tooltip content="Copy code">
            <button
              type="button"
              onClick={() => onCopy(entry.code)}
              aria-label={`Copy ${entry.language} code block`}
              className="flex items-center justify-center w-5 h-5 rounded hover:bg-vsc-toolbar transition-colors duration-fast cursor-pointer focus-ring"
            >
              <Icon name="copy" tokenSize="2xs" className="text-vsc-text-tertiary" />
            </button>
          </Tooltip>
          <Tooltip content="Insert at cursor">
            <button
              type="button"
              onClick={() => onInsert(entry.code)}
              aria-label={`Insert ${entry.language} code at cursor`}
              className="flex items-center justify-center w-5 h-5 rounded hover:bg-vsc-toolbar transition-colors duration-fast cursor-pointer focus-ring"
            >
              <Icon name="insert" tokenSize="2xs" className="text-vsc-text-tertiary" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Code preview */}
      <pre className="px-2.5 py-1.5 text-2xs leading-relaxed text-vsc-text-secondary overflow-hidden max-h-[60px] font-mono">
        {entry.preview}
        {entry.lineCount > 3 && <span className="text-vsc-text-ghost">…</span>}
      </pre>
    </div>
  );
});

// ─── CodeBlockPickerDialog ───────────────────────────────────

/**
 * Code Block Picker — Claude Code-style /copy dialog.
 * Extracts all code blocks from conversation, searchable, with copy/insert actions.
 */
export const CodeBlockPickerDialog = React.memo(function CodeBlockPickerDialog() {
  const open = useAtomValue(codeBlockPickerOpenAtom);
  const setOpen = useSetAtom(codeBlockPickerOpenAtom);
  const store = useStore();

  const [query, setQuery] = useState("");
  const [focusIndex, setFocusIndex] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Extract all code blocks from conversation
  const allBlocks = useMemo(() => {
    if (!open) return [];
    const msgIds = store.get(messageOrderAtom);
    const blocks: CodeBlockEntry[] = [];
    for (const id of msgIds) {
      const msg = store.get(messageAtomFamily(id));
      if (!msg || !msg.text || msg.role === "user") continue;
      blocks.push(...extractCodeBlocks(msg.id, msg.text));
    }
    // Reverse so newest blocks appear first
    return blocks.reverse();
  }, [open, store]);

  // Filter by query
  const filtered = useMemo(() => {
    if (!query.trim()) return allBlocks;
    return allBlocks
      .map((block) => {
        const langScore = fuzzyScore(query, block.language);
        const codeScore = fuzzyScore(query, block.preview);
        const bestScore = Math.max(langScore?.score ?? 0, codeScore?.score ?? 0);
        return { block, score: bestScore };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.block);
  }, [allBlocks, query]);

  // Reset on open
  useEffect(() => {
    if (open) {
       
      setQuery("");
      setFocusIndex(0);
      setCopyFeedback(null);
      // Focus input after dialog animation
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    return () => {
      if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
    };
  }, [open]);

  // Clamp focus index
  useEffect(() => {
    setFocusIndex((i) => Math.min(i, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  const handleClose = useCallback(() => setOpen(false), [setOpen]);

  const handleCopy = useCallback((code: string) => {
    void writeToClipboard(code).then(() => {
      setCopyFeedback("Copied!");
      if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopyFeedback(null), COPY_FEEDBACK_MS);
    });
  }, []);

  const handleInsert = useCallback(
    (code: string) => {
      getVscodeApi().postMessage({ type: "INSERT_CODE_BLOCK", code });
      setOpen(false);
    },
    [setOpen],
  );

  const handleCopyAll = useCallback(() => {
    const allCode = allBlocks.map((b) => `// ${b.language}\n${b.code}`).join("\n\n");
    void writeToClipboard(allCode).then(() => {
      setCopyFeedback("All copied!");
      if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopyFeedback(null), COPY_FEEDBACK_MS);
    });
  }, [allBlocks]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && filtered[focusIndex]) {
        e.preventDefault();
        handleCopy(filtered[focusIndex].code);
      }
    },
    [filtered, focusIndex, handleCopy],
  );

  if (!open) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Code Blocks"
      description={
        copyFeedback
          ?? `${allBlocks.length} block${allBlocks.length !== 1 ? "s" : ""} in conversation`
      }
      maxWidth="lg"
    >
      {/* Search input */}
      <div className="relative mb-2">
        <Icon
          name="search"
          tokenSize="xs"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-vsc-text-ghost pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Filter by language or content..."
          className="w-full pl-8 pr-3 py-1.5 rounded-md border border-vsc-border bg-vsc-input
                     text-sm text-vsc-fg placeholder:text-vsc-text-ghost
                     focus:outline-none focus:border-vsc-focus transition-colors duration-fast"
          aria-label="Filter code blocks"
        />
      </div>

      {/* Code block list */}
      {filtered.length === 0 ? (
        <div className="py-6 text-center">
          <Text size="sm" tone="tertiary">
            {allBlocks.length === 0 ? "No code blocks in conversation" : "No matching blocks"}
          </Text>
        </div>
      ) : (
        <div
          className="max-h-[--panel-max-h-md] overflow-y-auto scroll-shadow space-y-1.5"
          role="list"
          aria-label="Code blocks"
          data-scroll-contain
        >
          {filtered.map((entry, i) => (
            <CodeBlockRow
              key={entry.id}
              entry={entry}
              focused={focusIndex === i}
              onCopy={handleCopy}
              onInsert={handleInsert}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-vsc-border">
        <div className="flex items-center gap-1">
          <Text size="2xs" tone="ghost">
            ↑↓ navigate
          </Text>
          <Text size="2xs" tone="ghost">
            Enter copy
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Close
          </Button>
          {allBlocks.length > 1 && (
            <Button variant="ghost" size="sm" onClick={handleCopyAll}>
              Copy All
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
});
