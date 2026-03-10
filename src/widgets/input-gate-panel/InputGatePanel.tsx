import React, { useMemo } from "react";
import { useAtomValue } from "jotai";
import { selectAtom } from "jotai/utils";

import { turnPipelineAtomFamily } from "~entities/turn-pipeline";

import type { TurnId } from "../../shared/protocol";
import { Icon, RISK_TEXT_COLOR, Text } from "../../shared/ui";

export const InputGatePanel = React.memo(function InputGatePanel({ turnId }: { turnId: TurnId }) {
  const resultAtom = useMemo(() => selectAtom(turnPipelineAtomFamily(turnId), (p) => p.inputGate), [turnId]);
  const result = useAtomValue(resultAtom);
  if (!result || result.intent_type === "unknown") return null;

  return (
    <div className="px-3 py-2 border-b border-vsc-border/40" data-testid="input-gate-panel">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon name="shield" tokenSize="sm" className="text-vsc-text-secondary" />
        <Text size="sm" weight="medium" tone="secondary">Input Gate</Text>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-5">
        <div className="flex items-center gap-1.5">
          <Text size="2xs" tone="ghost">Intent</Text>
          <Text size="2xs" weight="medium" tone="primary" mono>{result.intent_type}</Text>
        </div>
        <div className="flex items-center gap-1.5">
          <Text size="2xs" tone="ghost">Risk</Text>
          <Text size="2xs" weight="medium" className={RISK_TEXT_COLOR[result.risk_level]}>{result.risk_level}</Text>
        </div>
        <div className="flex items-center gap-1.5">
          <Text size="2xs" tone="ghost">Change Size</Text>
          <Text size="2xs" weight="medium" tone="primary" mono>{result.change_size}</Text>
        </div>
        <div className="flex items-center gap-1.5">
          <Text size="2xs" tone="ghost">Uncertainty</Text>
          <Text size="2xs" weight="medium" tone="primary" mono>{result.uncertainty}</Text>
        </div>
      </div>
      {(result.context_signals.pii_detected || result.context_signals.security_sensitive) && (
        <div className="flex items-center gap-1 pl-5 mt-1">
          <Icon name="warning" tokenSize="2xs" className="text-vsc-warning" />
          <Text size="2xs" tone="ghost">
            {result.context_signals.pii_detected && "PII detected"}
            {result.context_signals.pii_detected && result.context_signals.security_sensitive && " · "}
            {result.context_signals.security_sensitive && "Security sensitive"}
          </Text>
        </div>
      )}
    </div>
  );
});
