/**
 * TerminalSearchOverlay — RFC-TERMINAL-004 §4
 *
 * In-terminal search bar for filtering command output.
 * Supports regex, case-sensitive toggle, and match navigation.
 * Triggered by Cmd+F when terminal is focused.
 */

import { memo, useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

// ─── Types ─────────────────────────────────────────────────

export interface TerminalSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string, options: SearchOptions) => void;
  onNavigate: (direction: "next" | "prev") => void;
  matchCount: number;
  currentMatch: number;
  className?: string;
}

export interface SearchOptions {
  caseSensitive: boolean;
  regex: boolean;
  wholeWord: boolean;
}

// ─── Component ─────────────────────────────────────────────

export const TerminalSearchOverlay = memo(function TerminalSearchOverlay({
  isOpen,
  onClose,
  onSearch,
  onNavigate,
  matchCount,
  currentMatch,
  className,
}: TerminalSearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [regex, setRegex] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [regexError, setRegexError] = useState<string | null>(null);

  // Auto-focus on open; reset state on close
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [isOpen]);

  // Debounced search trigger (150ms for typing, immediate for option toggles)
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;

    // Validate regex before passing to search handler
    if (regex && debouncedQuery) {
      try {
        new RegExp(debouncedQuery);
        setRegexError(null);
      } catch (e) {
        setRegexError(e instanceof SyntaxError ? e.message : String(e));
        return;
      }
    } else {
      setRegexError(null);
    }

    onSearch(debouncedQuery, { caseSensitive, regex, wholeWord });
  }, [debouncedQuery, caseSensitive, regex, wholeWord, isOpen, onSearch]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        onNavigate(e.shiftKey ? "prev" : "next");
      }
    },
    [onClose, onNavigate],
  );

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "pointer-events-auto",
        "absolute top-1 right-2 z-[25]",
        "flex items-center gap-1.5 px-2 py-1",
        "bg-vsc-surface-2 border border-vsc-border rounded-md shadow-lg",
        "animate-[slide-in-top_80ms_var(--ease-spring)]",
        className,
      )}
      role="search"
      aria-label="Terminal search"
    >
      {/* Search input */}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Find in terminal..."
        className={cn(
          "w-[180px] bg-transparent text-2xs text-vsc-fg",
          "placeholder:text-vsc-text-ghost/60",
          "outline-none focus-visible:ring-1 focus-visible:ring-vsc-accent/40 rounded-sm",
          regexError && "text-vsc-error bg-vsc-error/5",
        )}
        title={regexError ?? undefined}
        spellCheck={false}
        autoComplete="off"
      />

      {/* Match counter */}
      {query && (
        <span className="text-3xs text-vsc-text-ghost tabular-nums whitespace-nowrap min-w-[3.5rem] text-right">
          {matchCount > 0 ? `${currentMatch + 1}/${matchCount}` : "No results"}
        </span>
      )}

      {/* Toggle buttons */}
      <div className="flex items-center gap-0.5 border-l border-vsc-border/30 pl-1.5">
        <ToggleButton
          icon="case-sensitive"
          title="Case Sensitive"
          active={caseSensitive}
          onClick={() => setCaseSensitive((v) => !v)}
        />
        <ToggleButton
          icon="whole-word"
          title="Whole Word"
          active={wholeWord}
          onClick={() => setWholeWord((v) => !v)}
        />
        <ToggleButton
          icon="regex"
          title="Regular Expression"
          active={regex}
          onClick={() => setRegex((v) => !v)}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-0.5 border-l border-vsc-border/30 pl-1.5">
        <button
          type="button"
          className="p-0.5 rounded hover:bg-vsc-surface-1 text-vsc-text-secondary transition-colors duration-fast focus-visible:ring-1 focus-visible:ring-vsc-accent/40"
          onClick={() => onNavigate("prev")}
          title="Previous match (Shift+Enter)"
          aria-label="Previous match"
        >
          <Icon name="arrow-up" size={12} />
        </button>
        <button
          type="button"
          className="p-0.5 rounded hover:bg-vsc-surface-1 text-vsc-text-secondary transition-colors duration-fast focus-visible:ring-1 focus-visible:ring-vsc-accent/40"
          onClick={() => onNavigate("next")}
          title="Next match (Enter)"
          aria-label="Next match"
        >
          <Icon name="arrow-down" size={12} />
        </button>
      </div>

      {/* Close */}
      <button
        type="button"
        className="p-0.5 rounded hover:bg-vsc-error/20 hover:text-vsc-error text-vsc-text-ghost transition-colors duration-fast"
        onClick={onClose}
        title="Close (Esc)"
        aria-label="Close search"
      >
        <Icon name="close" size={12} />
      </button>
    </div>
  );
});

// ─── Toggle Button ─────────────────────────────────────────

interface ToggleButtonProps {
  icon: string;
  title: string;
  active: boolean;
  onClick: () => void;
}

const ToggleButton = memo(function ToggleButton({
  icon,
  title,
  active,
  onClick,
}: ToggleButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "p-0.5 rounded transition-colors duration-fast",
        active
          ? "bg-vsc-accent/15 text-vsc-accent"
          : "text-vsc-text-ghost hover:text-vsc-text-secondary hover:bg-vsc-surface-1",
      )}
      onClick={onClick}
      title={title}
      aria-pressed={active}
    >
      <Icon name={icon} size={12} />
    </button>
  );
});
