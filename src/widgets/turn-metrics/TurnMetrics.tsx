import React from "react";
import { useAtomValue } from "jotai";

import { turnAtomFamily } from "~entities/message/turns";

import { formatCost, formatTokens } from "../../shared/lib/formatters";
import type { TurnId } from "../../shared/protocol";
import { Icon } from "../../shared/ui";

interface TurnMetricsProps {
  readonly turnId: TurnId;
}

export const TurnMetrics = React.memo(function TurnMetrics({ turnId }: TurnMetricsProps) {
  const turn = useAtomValue(turnAtomFamily(turnId));
  if (!turn) return null;

  const { ttft_ms: ttftMs, latency_ms: latencyMs, token_usage: tokenUsage, estimated_cost_usd: estimatedCostUsd } = turn;
  const hasMetrics = ttftMs != null || tokenUsage != null;
  if (!hasMetrics) return null;

  return (
    <div
      className="flex items-center gap-2 text-xs text-vsc-text-tertiary pl-4 pr-3 py-1"
      data-testid="turn-metrics"
    >
      {ttftMs != null && (
        <span className="flex items-center gap-1" title="Time to First Token">
          <Icon name="dashboard" tokenSize="2xs" />
          <span className={ttftMs > 2000 ? "text-vsc-warning" : ""} data-testid="ttft-value">
            {ttftMs >= 1000 ? `${(ttftMs / 1000).toFixed(1)}s` : `${ttftMs}ms`}
          </span>
        </span>
      )}
      {latencyMs != null && (
        <span className="flex items-center gap-1" title="Total latency">
          <Icon name="clock" tokenSize="2xs" />
          <span data-testid="latency-value">
            {latencyMs >= 1000 ? `${(latencyMs / 1000).toFixed(1)}s` : `${latencyMs}ms`}
          </span>
        </span>
      )}
      {tokenUsage != null && (
        <span
          className="flex items-center gap-1"
          title={`Input: ${tokenUsage.input_tokens} / Output: ${tokenUsage.output_tokens}`}
        >
          <Icon name="sparkle" tokenSize="2xs" />
          <span data-testid="token-value">
            {formatTokens(tokenUsage.input_tokens + tokenUsage.output_tokens)}
          </span>
        </span>
      )}
      {estimatedCostUsd != null && (
        <span className="flex items-center gap-1" title="Estimated cost">
          <Icon name="credit-card" tokenSize="2xs" />
          <span data-testid="cost-value">{formatCost(estimatedCostUsd)}</span>
        </span>
      )}
    </div>
  );
});
