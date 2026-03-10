import React, { useMemo } from "react";
import { useAtomValue } from "jotai";
import { selectAtom } from "jotai/utils";

import { turnPipelineAtomFamily } from "~entities/turn-pipeline";

import type { TurnId } from "../../shared/protocol";
import { cn, Icon, ProgressBar, Text } from "../../shared/ui";

export const StrategyDashboard = React.memo(function StrategyDashboard({ turnId }: { turnId: TurnId }) {
  const strategyAtom = useMemo(() => selectAtom(turnPipelineAtomFamily(turnId), (p) => p.strategy), [turnId]);
  const state = useAtomValue(strategyAtom);

  // Hide when no meaningful data (default/empty state)
  if (state.candidates_evaluated === 0 && state.hypothesis_graph.length === 0 && state.current_best_score === 0) {
    return null;
  }

  return (
    <div className="px-3 py-2 border-b border-vsc-border/40" data-testid="strategy-dashboard">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon name="compass" tokenSize="sm" className="text-vsc-text-secondary" />
        <Text size="sm" weight="medium" tone="secondary">Strategy</Text>
        <Text size="2xs" mono tone="ghost" className="ml-auto">{state.mode} · {state.strategy}</Text>
      </div>

      <div className="pl-5 space-y-1">
        {/* Budget */}
        <div className="flex items-center gap-2">
          <Text size="2xs" tone="ghost" className="w-16 shrink-0">Budget</Text>
          <Text size="2xs" mono tone="primary">
            {(state.budget.time_budget_ms / 1000).toFixed(0)}s / {state.budget.max_candidates} candidates / depth {state.budget.max_depth}
          </Text>
        </div>

        {/* Search progress */}
        <div className="flex items-center gap-2">
          <Text size="2xs" tone="ghost" className="w-16 shrink-0">Search</Text>
          <ProgressBar
            value={state.candidates_evaluated}
            max={state.budget.max_candidates}
            label={`${state.candidates_evaluated} eval / ${state.candidates_pruned} pruned`}
            className="flex-1 max-w-[160px]"
          />
        </div>

        {/* Best score */}
        {state.current_best_score > 0 && (
          <div className="flex items-center gap-2">
            <Text size="2xs" tone="ghost" className="w-16 shrink-0">Best</Text>
            <Text size="2xs" mono tone="primary">{(state.current_best_score * 100).toFixed(1)}%</Text>
          </div>
        )}

        {/* Hypothesis graph */}
        {state.hypothesis_graph.length > 0 && (
          <div className="mt-1">
            <Text size="2xs" tone="ghost" className="mb-0.5">Hypotheses</Text>
            <div className="space-y-0.5">
              {state.hypothesis_graph.map((node) => (
                <div key={node.id} className="flex items-center gap-1.5">
                  <Icon
                    name={(() => { if (node.status === "confirmed") return "check"; if (node.status === "refuted") return "close"; return "circle-outline"; })()}
                    tokenSize="2xs"
                    className={cn(
                      node.status === "confirmed" && "text-vsc-success",
                      node.status === "refuted" && "text-vsc-error",
                      node.status === "open" && "text-vsc-text-tertiary",
                    )}
                  />
                  <Text size="2xs" tone="secondary" truncate className="flex-1 min-w-0">{node.hypothesis}</Text>
                  <Text size="2xs" mono tone="ghost">{(node.confidence * 100).toFixed(0)}%</Text>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
