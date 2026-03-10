import React, { useCallback } from "react";
import { useAtomValue } from "jotai";

import { autoContextFamily } from "../../features/auto-context";
import { getVscodeApi } from "../../shared/lib";
import type { ContextSuggestion, TurnId } from "../../shared/protocol";
import { Icon, ProgressBar, Spinner, Text } from "../../shared/ui";

function SuggestionRow({ s }: { s: ContextSuggestion }) {
  const handleAccept = useCallback(() => {
    getVscodeApi().postMessage({ type: "ACCEPT_CONTEXT_SUGGESTION", suggestion_id: s.id });
  }, [s.id]);

  const handleReject = useCallback(() => {
    getVscodeApi().postMessage({ type: "REJECT_CONTEXT_SUGGESTION", suggestion_id: s.id });
  }, [s.id]);

  return (
    <div className="flex items-center gap-1.5 group">
      <Icon
        name={s.accepted ? "check" : "file"}
        tokenSize="2xs"
        className={s.accepted ? "text-vsc-success" : "text-vsc-text-tertiary"}
      />
      <Text size="2xs" tone="secondary" truncate className="flex-1 min-w-0">
        {s.file_path}
      </Text>
      <div
        className="w-12 h-1 rounded-full bg-vsc-bg-tertiary overflow-hidden"
        title={`Relevance: ${Math.round(s.relevance_score * 100)}%`}
      >
        <div
          className="h-full bg-vsc-accent rounded-full"
          style={{ width: `${s.relevance_score * 100}%` }}
        />
      </div>
      <Text size="2xs" tone="ghost" mono className="w-10 text-right">
        {s.token_cost > 1000 ? `${(s.token_cost / 1000).toFixed(1)}k` : s.token_cost}
      </Text>
      {!s.accepted && (
        <button
          onClick={handleAccept}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-fast focus-ring"
          title="Accept"
          aria-label="Accept suggestion"
        >
          <Icon name="check" tokenSize="2xs" className="text-vsc-success" />
        </button>
      )}
      <button
        onClick={handleReject}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-fast focus-ring"
        title="Reject"
        aria-label="Reject suggestion"
      >
        <Icon
          name="close"
          tokenSize="2xs"
          className="text-vsc-text-tertiary hover:text-vsc-error transition-colors duration-fast"
        />
      </button>
    </div>
  );
}

interface AutoContextPreviewProps {
  turnId: TurnId;
}

export const AutoContextPreview = React.memo(function AutoContextPreview({
  turnId,
}: AutoContextPreviewProps) {
  const state = useAtomValue(autoContextFamily(turnId));

  if (state.status === "idle" && state.suggestions.length === 0) return null;

  const budgetUsed = state.budget_tokens > 0 ? state.total_token_cost / state.budget_tokens : 0;

  return (
    <div
      className="mx-4 my-2 px-3 py-2.5 rounded-lg border border-vsc-border/40 bg-vsc-surface-1/50"
      data-testid="auto-context-preview"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Icon name="search-fuzzy" tokenSize="sm" className="text-vsc-text-secondary" />
        <Text size="xs" weight="medium" tone="secondary">
          Smart Context
        </Text>
        {state.status === "analyzing" && <Spinner size="sm" className="ml-auto" />}
        {state.status === "ready" && (
          <Text size="2xs" tone="ghost" className="ml-auto">
            {state.suggestions.filter((s) => s.accepted).length}/{state.suggestions.length} files
          </Text>
        )}
      </div>

      {state.budget_tokens > 0 && (
        <div className="pl-5 mb-1.5">
          <div className="flex items-center justify-between mb-0.5">
            <Text size="2xs" tone="ghost">
              Token Budget
            </Text>
            <Text size="2xs" tone="ghost" mono>
              {state.total_token_cost.toLocaleString()} / {state.budget_tokens.toLocaleString()}
            </Text>
          </div>
          <ProgressBar value={budgetUsed * 100} max={100} />
        </div>
      )}

      <div className="pl-5 space-y-0.5">
        {state.suggestions.map((s) => (
          <SuggestionRow key={s.id} s={s} />
        ))}
      </div>
    </div>
  );
});
