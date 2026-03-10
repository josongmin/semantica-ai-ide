import React, { useMemo } from "react";
import { useAtomValue } from "jotai";
import { selectAtom } from "jotai/utils";

import { turnPipelineAtomFamily } from "~entities/turn-pipeline";

import type { TurnId } from "../../shared/protocol";
import { Icon, Text } from "../../shared/ui";

export const ExplainableVerdictWidget = React.memo(function ExplainableVerdictWidget({ turnId }: { turnId: TurnId }) {
  const verdictAtom = useMemo(() => selectAtom(turnPipelineAtomFamily(turnId), (p) => p.verdict), [turnId]);
  const verdict = useAtomValue(verdictAtom);
  if (!verdict?.chosen_action) return null;

  return (
    <div className="px-3 py-2 border-b border-vsc-border/40" data-testid="explainable-verdict">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon name="lightbulb" tokenSize="sm" className="text-vsc-text-secondary" />
        <Text size="sm" weight="medium" tone="secondary">Verdict</Text>
        <Text size="2xs" mono tone="ghost" className="ml-auto">{(verdict.confidence * 100).toFixed(0)}% confidence</Text>
      </div>

      <div className="pl-5 space-y-1.5">
        <Text size="sm" weight="medium" tone="primary">{verdict.chosen_action}</Text>

        {/* Reasons for */}
        {verdict.reasons_for.length > 0 && (
          <div className="space-y-0.5">
            {verdict.reasons_for.map((r) => (
              <div key={r.factor} className="flex items-center gap-1.5">
                <Icon name="add" tokenSize="2xs" className="text-vsc-success" />
                <Text size="2xs" tone="secondary" className="flex-1">{r.factor}</Text>
                <Text size="2xs" mono tone="ghost">{(r.weight * 100).toFixed(0)}%</Text>
              </div>
            ))}
          </div>
        )}

        {/* Reasons against */}
        {verdict.reasons_against.length > 0 && (
          <div className="space-y-0.5">
            {verdict.reasons_against.map((r) => (
              <div key={r.factor} className="flex items-center gap-1.5">
                <Icon name="remove" tokenSize="2xs" className="text-vsc-error" />
                <Text size="2xs" tone="secondary" className="flex-1">{r.factor}</Text>
                <Text size="2xs" mono tone="ghost">{(r.weight * 100).toFixed(0)}%</Text>
              </div>
            ))}
          </div>
        )}

        {/* Rejected alternatives */}
        {verdict.alternatives_rejected.length > 0 && (
          <div className="mt-1">
            <Text size="2xs" tone="ghost" className="mb-0.5">Rejected</Text>
            {verdict.alternatives_rejected.map((alt) => (
              <div key={alt.action} className="flex items-center gap-1.5">
                <Icon name="close" tokenSize="2xs" className="text-vsc-text-ghost" />
                <Text size="2xs" mono tone="ghost">{alt.action}</Text>
                <Text size="2xs" tone="tertiary">— {alt.rejection_reason}</Text>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
