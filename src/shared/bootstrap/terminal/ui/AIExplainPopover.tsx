/**
 * AIExplainPopover — RFC-TERMINAL-016 §2.3
 *
 * Inline popover that explains a command's output/error.
 * Triggered from BlockActions "Explain" button.
 *
 * Shows: explanation text, suggested fix, and navigation links.
 * Positioned at z-[23] above overlay and search.
 */

import { memo, useCallback, useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import { dismissExplainAtom, terminalExplainAtom } from "../model/aiAtoms";

// ─── Component ───────────────────────────────────────────

export interface AIExplainPopoverProps {
  /** Execute a suggested fix command */
  onExecuteFix?: (command: string) => void;
  /** Ask agent for deeper analysis */
  onAskAgent?: () => void;
  className?: string;
}

export const AIExplainPopover = memo(function AIExplainPopover({
  onExecuteFix,
  onAskAgent,
  className,
}: AIExplainPopoverProps) {
  const state = useAtomValue(terminalExplainAtom);
  const dismiss = useSetAtom(dismissExplainAtom);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleFixClick = useCallback(() => {
    if (state?.result?.suggestedFix) {
      onExecuteFix?.(state.result.suggestedFix);
      dismiss();
    }
  }, [state, onExecuteFix, dismiss]);

  // Escape key to dismiss
  useEffect(() => {
    if (!state) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        dismiss();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [state, dismiss]);

  if (!state) return null;

  return (
    <>
      {/* Backdrop for click-outside dismiss */}
      <div className="fixed inset-0 z-[--z-overlay]" onClick={dismiss} aria-hidden="true" />
      <div
        ref={popoverRef}
        className={cn(
          "absolute top-2 right-2 z-[--z-overlay]",
          "pointer-events-auto",
          "w-80 max-h-64 overflow-y-auto",
          "rounded-lg border border-vsc-border/40",
          "bg-vsc-surface-1/95 backdrop-blur-md",
          "shadow-lg shadow-black/20",
          "animate-in slide-in-from-right-2 fade-in duration-slow",
          className,
        )}
        data-testid="ai-explain-popover"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-vsc-border/20">
          <div className="flex items-center gap-1.5">
            <Icon name="lightbulb" size={14} className="text-vsc-accent" />
            <span className="text-xs font-medium text-vsc-text-primary">Explain</span>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="p-0.5 rounded hover:bg-vsc-surface-2 transition-colors text-vsc-text-ghost hover:text-vsc-fg"
            aria-label="Close explanation"
          >
            <Icon name="close" size={12} />
          </button>
        </div>

        {/* Body */}
        {state.loading && (
          <div className="flex items-center gap-2 px-3 py-4">
            <Icon name="loading~spin" size={14} className="text-vsc-accent" />
            <span className="text-xs text-vsc-text-ghost">Analyzing...</span>
          </div>
        )}
        {!state.loading && state.result && (
          <div className="flex flex-col gap-2 px-3 py-2">
            {/* Explanation */}
            <p className="text-2xs text-vsc-text-secondary leading-relaxed whitespace-pre-wrap">
              {state.result.explanation}
            </p>

            {/* Suggested fix */}
            {state.result.suggestedFix && (
              <div className="flex flex-col gap-1 p-2 rounded bg-vsc-surface-2/50 border border-vsc-border/15">
                <span className="text-3xs text-vsc-text-ghost font-medium">Suggested fix</span>
                <code className="text-2xs font-mono text-vsc-accent">
                  {state.result.suggestedFix}
                </code>
                <div className="flex items-center gap-1.5 mt-1">
                  {state.result.canAutoFix && (
                    <button
                      type="button"
                      onClick={handleFixClick}
                      className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded",
                        "bg-vsc-accent/15 text-vsc-accent text-3xs",
                        "hover:bg-vsc-accent/25 transition-colors duration-fast",
                      )}
                    >
                      <Icon name="play" size={10} />
                      Run fix
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (state.result?.suggestedFix)
                        void navigator.clipboard.writeText(state.result.suggestedFix);
                    }}
                    className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded",
                      "bg-vsc-surface-2 text-vsc-text-secondary text-3xs",
                      "hover:bg-vsc-surface-3 transition-colors duration-fast",
                    )}
                  >
                    <Icon name="copy" size={10} />
                    Copy
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            {onAskAgent && (
              <button
                type="button"
                onClick={() => {
                  onAskAgent();
                  dismiss();
                }}
                className={cn(
                  "flex items-center gap-1 self-start px-2 py-1 rounded",
                  "text-3xs text-vsc-text-secondary",
                  "hover:bg-vsc-accent/10 hover:text-vsc-accent transition-colors duration-fast",
                )}
              >
                <Icon name="comment-discussion" size={10} />
                Ask agent for deeper analysis
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
});
