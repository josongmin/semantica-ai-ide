/**
 * IntentBar — Full-width overlay for natural language intent input.
 *
 * Appears at the top of the IDE with a glass panel. Users type what they
 * want to accomplish, and the system analyzes the intent, shows targets,
 * risks, and generates an execution plan inline.
 */

import React, { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import {
  activeIntentSessionAtom,
  cancelIntentAtom,
  closeIntentBarAtom,
  executePlanAtom,
  intentBarVisibleAtom,
  intentInputAtom,
  intentLoadingAtom,
  submitIntentAtom,
} from "../model/atoms";
import { IntentPlanPreview } from "./IntentPlanPreview";

// ─── Risk Severity Colors ───────────────────────────────

const riskColors: Record<string, string> = {
  none: "text-(--color-risk-none)",
  low: "text-(--color-risk-low)",
  medium: "text-(--color-risk-medium)",
  high: "text-(--color-risk-high)",
  critical: "text-(--color-risk-critical)",
};

// ─── Category Badge ─────────────────────────────────────

const categoryLabels: Record<string, { label: string; icon: string; color: string }> = {
  feature: { label: "Feature", icon: "add", color: "text-(--color-intent-feature) bg-(--color-intent-feature)/10" },
  bugfix: { label: "Bug Fix", icon: "bug", color: "text-(--color-intent-bugfix) bg-(--color-intent-bugfix)/10" },
  refactor: { label: "Refactor", icon: "references", color: "text-(--color-intent-refactor) bg-(--color-intent-refactor)/10" },
  investigate: { label: "Investigate", icon: "search", color: "text-(--color-intent-investigate) bg-(--color-intent-investigate)/10" },
  security: { label: "Security", icon: "shield", color: "text-(--color-intent-security) bg-(--color-intent-security)/10" },
  performance: { label: "Performance", icon: "dashboard", color: "text-(--color-intent-performance) bg-(--color-intent-performance)/10" },
  test: { label: "Test", icon: "beaker", color: "text-(--color-intent-test) bg-(--color-intent-test)/10" },
  explore: { label: "Explore", icon: "compass", color: "text-(--color-intent-explore) bg-(--color-intent-explore)/10" },
};

const CategoryBadge = React.memo(function CategoryBadge({ category }: { category: string }) {
  const info = categoryLabels[category] ?? { label: category, icon: "question", color: "text-vsc-text-ghost bg-vsc-surface-2" };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium", info.color)}>
      <Icon name={info.icon} tokenSize="2xs" />
      {info.label}
    </span>
  );
});

// ─── Main Component ─────────────────────────────────────

export const IntentBar = React.memo(function IntentBar() {
  const visible = useAtomValue(intentBarVisibleAtom);
  const [input, setInput] = useAtom(intentInputAtom);
  const loading = useAtomValue(intentLoadingAtom);
  const session = useAtomValue(activeIntentSessionAtom);
  const submitIntent = useSetAtom(submitIntentAtom);
  const executePlan = useSetAtom(executePlanAtom);
  const cancelIntent = useSetAtom(cancelIntentAtom);
  const closeBar = useSetAtom(closeIntentBarAtom);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when bar opens
  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [visible]);

  // Keyboard handling
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (session) {
          cancelIntent();
        }
        closeBar();
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const trimmed = input.trim();
        if (trimmed) {
          submitIntent(trimmed);
        }
      }
    },
    [input, session, submitIntent, cancelIntent, closeBar],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInput(e.target.value);
    },
    [setInput],
  );

  const handleExecute = useCallback(() => {
    executePlan();
  }, [executePlan]);

  const handleCancel = useCallback(() => {
    cancelIntent();
    closeBar();
  }, [cancelIntent, closeBar]);

  if (!visible) return null;

  const analysis = session?.analysis ?? null;
  const plan = session?.plan ?? null;
  const status = session?.status ?? "input";
  const isExecuting = status === "executing";
  const isCompleted = status === "completed";

  return createPortal(
    <div className="fixed inset-x-0 top-0 z-(--z-modal) flex justify-center px-4 pt-3">
      <div
        className={cn(
          "w-full max-w-3xl flex flex-col max-h-[70vh]",
          "backdrop-blur-md bg-vsc-surface-0/80 border border-vsc-border/30",
          "rounded-xl shadow-2xl shadow-black/20",
          "will-change-transform animate-[intent-bar-enter_200ms_ease-out]",
        )}
        onKeyDown={handleKeyDown}
      >
        {/* Input Row */}
        <div className="flex items-center gap-2 px-4 py-3 shrink-0">
          <Icon name="lightbulb" className="text-vsc-accent shrink-0" tokenSize="sm" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="What are you trying to do?"
            aria-label="Intent input"
            autoComplete="off"
            spellCheck={false}
            disabled={isExecuting}
            className={cn(
              "flex-1 bg-transparent text-sm text-vsc-fg",
              "placeholder:text-vsc-text-ghost/50",
              "outline-none border-none",
              isExecuting && "opacity-50",
            )}
          />
          {loading && (
            <Icon name="loading" className="animate-spin text-vsc-text-ghost" tokenSize="xs" />
          )}
          {session?.intent && (
            <CategoryBadge category={session.intent.category} />
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-vsc-surface-2/60 text-2xs text-vsc-text-ghost font-mono">
            {"\u2318"}I
          </kbd>
        </div>

        {/* Expandable Content — scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Analysis Results */}
        {analysis && (
          <div className="border-t border-vsc-border/20 px-4 py-3 space-y-3">
            {/* Scope Summary */}
            <div className="flex items-center gap-3 text-2xs text-vsc-text-secondary">
              <span className="font-medium text-vsc-text-ghost uppercase tracking-wider">Scope</span>
              <span>Files: {analysis.affectedScope.files}</span>
              <span className="text-vsc-border/40">&middot;</span>
              <span>Modules: {analysis.affectedScope.modules}</span>
              <span className="text-vsc-border/40">&middot;</span>
              <span>Tests: {analysis.affectedScope.tests}</span>
              {analysis.affectedScope.apis > 0 && (
                <>
                  <span className="text-vsc-border/40">&middot;</span>
                  <span>APIs: {analysis.affectedScope.apis}</span>
                </>
              )}
            </div>

            {/* Targets */}
            {analysis.targets.length > 0 && (
              <div className="space-y-1">
                <p className="text-2xs font-medium text-vsc-text-ghost uppercase tracking-wider">Targets</p>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.targets.map((target) => (
                    <span
                      key={`${target.filePath}:${target.line}`}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-vsc-surface-2/40 text-2xs text-vsc-text-secondary"
                      title={`${target.filePath}:${target.line} (${Math.round(target.relevance * 100)}% relevance)`}
                    >
                      <Icon name="symbol-method" tokenSize="2xs" className="text-vsc-text-ghost" />
                      {target.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Risks */}
            {analysis.risks.length > 0 && (
              <div className="space-y-1">
                <p className="text-2xs font-medium text-vsc-text-ghost uppercase tracking-wider">Risks</p>
                <ul className="space-y-0.5">
                  {analysis.risks.map((risk, i) => (
                    <li key={`risk-${i}-${risk.description.slice(0, 20)}`} className="flex items-start gap-1.5 text-2xs">
                      <span className={cn("mt-0.5 shrink-0", riskColors[risk.severity] ?? "text-vsc-text-ghost")}>
                        &bull;
                      </span>
                      <span className="text-vsc-text-secondary">
                        <span className="font-medium">{risk.description}</span>
                        <span className="text-vsc-text-ghost/50"> — {risk.mitigation}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Runtime Context */}
            {analysis.runtimeContext.length > 0 && (
              <div className="space-y-1">
                <p className="text-2xs font-medium text-vsc-text-ghost uppercase tracking-wider">Runtime Context</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  {analysis.runtimeContext.map((ctx, i) => (
                    <div key={i} className="flex items-baseline gap-1.5 text-2xs">
                      <span className="text-vsc-text-ghost/60">{ctx.metric}:</span>
                      <span className="font-mono text-vsc-text-secondary">{ctx.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Plan Preview */}
        {plan && (
          <div className="border-t border-vsc-border/20">
            <IntentPlanPreview
              plan={plan}
              onExecute={!isExecuting && !isCompleted ? handleExecute : undefined}
              onCancel={!isCompleted ? handleCancel : undefined}
              className="px-4 py-3"
            />
          </div>
        )}

        {/* Loading State */}
        {loading && !analysis && (
          <div className="border-t border-vsc-border/20 px-4 py-4">
            <div className="flex items-center gap-2 text-xs text-vsc-text-ghost">
              <Icon name="loading" className="animate-spin" tokenSize="xs" />
              <span>Analyzing intent...</span>
            </div>
          </div>
        )}

        {loading && analysis && !plan && (
          <div className="border-t border-vsc-border/20 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-vsc-text-ghost">
              <Icon name="loading" className="animate-spin" tokenSize="xs" />
              <span>Generating execution plan...</span>
            </div>
          </div>
        )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-vsc-border/10 text-2xs text-vsc-text-ghost/50 select-none shrink-0">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-vsc-surface-2/60 text-vsc-text-ghost font-mono text-2xs">
              Enter
            </kbd>
            submit
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-vsc-surface-2/60 text-vsc-text-ghost font-mono text-2xs">
              Esc
            </kbd>
            close
          </span>
          {isCompleted && (
            <span className="ml-auto text-(--color-status-completed) flex items-center gap-1">
              <Icon name="check" tokenSize="2xs" />
              Completed
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
});
