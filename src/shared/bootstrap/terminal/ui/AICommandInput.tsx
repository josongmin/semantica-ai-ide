/**
 * AICommandInput — RFC-TERMINAL-016 §2.1
 *
 * Floating overlay (Cmd+I) for natural-language → shell command generation.
 * Positioned at the bottom of the terminal viewport, z-[22].
 *
 * Flow: user types natural language → AI generates command → user accepts/edits → executes.
 */

import { memo, useCallback, useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import { useAICommandSuggest } from "../lib/useAICommandSuggest";
import { hideAICommandInputAtom, terminalAICommandInputAtom } from "../model/aiAtoms";

// ─── Component ───────────────────────────────────────────

export interface AICommandInputProps {
  onExecute?: (command: string) => void;
  className?: string;
}

export const AICommandInput = memo(function AICommandInput({
  onExecute,
  className,
}: AICommandInputProps) {
  const state = useAtomValue(terminalAICommandInputAtom);
  const hide = useSetAtom(hideAICommandInputAtom);
  const inputRef = useRef<HTMLInputElement>(null);
  const { submitQuery } = useAICommandSuggest();

  // On input change, debounce-submit query to AI backend
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      submitQuery(e.target.value);
    },
    [submitQuery],
  );

  // Auto-focus when opened
  useEffect(() => {
    if (state.visible) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [state.visible]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        hide();
        return;
      }
      if (e.key === "Enter" && !e.shiftKey && state.result) {
        e.preventDefault();
        onExecute?.(state.result.command);
        hide();
      }
    },
    [hide, onExecute, state.result],
  );

  if (!state.visible) return null;

  return (
    <div
      className={cn(
        "absolute bottom-2 left-4 right-4 z-[--z-overlay]",
        "pointer-events-auto",
        "rounded-lg overflow-hidden",
        "border border-vsc-accent/30",
        "bg-vsc-surface-1/95 backdrop-blur-md",
        "shadow-lg shadow-black/20",
        "animate-in slide-in-from-bottom-2 fade-in duration-slow",
        className,
      )}
      data-testid="ai-command-input"
    >
      {/* Input row */}
      <div className="flex items-center gap-2 px-3 py-2">
        <Icon name="sparkle" size={14} className="text-vsc-accent shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Describe what you want to do..."
          className={cn(
            "flex-1 bg-transparent border-none outline-none rounded-sm",
            "text-sm text-vsc-input-fg placeholder:text-vsc-text-ghost",
            "focus-visible:ring-1 focus-visible:ring-vsc-accent/30",
            state.loading && "opacity-60",
          )}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          readOnly={state.loading}
        />
        {state.loading && (
          <Icon name="loading~spin" size={14} className="text-vsc-accent shrink-0" />
        )}
        <button
          type="button"
          onClick={hide}
          className="p-0.5 rounded hover:bg-vsc-surface-2 transition-colors text-vsc-text-ghost hover:text-vsc-fg focus-visible:ring-1 focus-visible:ring-vsc-accent/40"
          aria-label="Close AI command input"
        >
          <Icon name="close" size={12} />
        </button>
      </div>

      {/* Result */}
      {state.result && (
        <div className="border-t border-vsc-border/20">
          <div className="flex items-center gap-2 px-3 py-2">
            <Icon name="terminal" size={12} className="text-vsc-text-ghost shrink-0" />
            <code className="flex-1 text-xs font-mono text-vsc-accent">{state.result.command}</code>
            <div className="flex items-center gap-1 shrink-0">
              <ConfidenceBadge confidence={state.result.confidence} />
              <button
                type="button"
                onClick={() => {
                  if (state.result) onExecute?.(state.result.command);
                  hide();
                }}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded",
                  "bg-vsc-accent/15 text-vsc-accent text-2xs",
                  "hover:bg-vsc-accent/25 transition-colors duration-fast",
                )}
              >
                <Icon name="play" size={10} />
                Run
              </button>
            </div>
          </div>
          {state.result.explanation && (
            <div className="px-3 pb-2 text-3xs text-vsc-text-ghost">{state.result.explanation}</div>
          )}
          {state.result.alternatives && state.result.alternatives.length > 0 && (
            <div className="flex items-center gap-1 px-3 pb-2 flex-wrap">
              {state.result.alternatives.map((alt) => (
                <button
                  key={alt}
                  type="button"
                  onClick={() => {
                    onExecute?.(alt);
                    hide();
                  }}
                  className={cn(
                    "px-1.5 py-0.5 rounded-sm text-3xs font-mono",
                    "bg-vsc-surface-2/50 text-vsc-text-secondary",
                    "hover:bg-vsc-surface-2 transition-colors duration-fast",
                  )}
                >
                  {alt}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer hint */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-vsc-border/10 text-2xs text-vsc-text-ghost">
        <span>Enter to run · Esc to close</span>
        <span className="font-mono opacity-50">⌘I</span>
      </div>
    </div>
  );
});

// ─── Confidence Badge ──────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  let color: string;
  if (confidence >= 0.8) color = "text-vsc-success";
  else if (confidence >= 0.5) color = "text-vsc-warning";
  else color = "text-vsc-error";

  return <span className={cn("text-3xs tabular-nums", color)}>{pct}%</span>;
}
