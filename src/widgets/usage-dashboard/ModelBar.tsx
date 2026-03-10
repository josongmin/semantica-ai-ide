import React from "react";

import { formatCost, formatTokens } from "../../shared/lib/formatters";
import type { UsageModelBreakdown } from "../../shared/protocol";
import { cn, Text } from "../../shared/ui";

const MODEL_COLORS = [
  "bg-vsc-info",
  "bg-vsc-success",
  "bg-vsc-warning",
  "bg-vsc-error",
  "bg-vsc-info/70",
  "bg-vsc-success/70",
] as const;

interface ModelBarProps {
  readonly model: UsageModelBreakdown;
  readonly maxTokens: number;
}

export const ModelBar = React.memo(function ModelBar({ model, maxTokens }: ModelBarProps) {
  const widthPct = maxTokens > 0 ? (model.tokens / maxTokens) * 100 : 0;
  const colorIndex =
    Math.abs(model.model.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) %
    MODEL_COLORS.length;

  return (
    <div className="flex flex-col gap-1" data-testid={`model-bar-${model.model}`}>
      <div className="flex items-center justify-between text-xs">
        <Text size="xs" weight="medium" truncate className="max-w-[60%]">
          {model.model}
        </Text>
        <div className="flex items-center gap-2">
          <Text size="2xs" tone="secondary" mono>
            {formatTokens(model.tokens)} tokens
          </Text>
          <Text size="2xs" tone="secondary" mono>
            {formatCost(model.cost_usd)}
          </Text>
        </div>
      </div>
      <div className="h-2.5 w-full rounded-full bg-vsc-border/30 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-normal",
            MODEL_COLORS[colorIndex],
          )}
          style={{ width: `${Math.max(widthPct, 1)}%` }}
          role="img"
          aria-label={`${model.model}: ${formatTokens(model.tokens)} tokens, ${formatCost(model.cost_usd)}`}
        />
      </div>
    </div>
  );
});
