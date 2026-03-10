import React from "react";

import { Icon, Text } from "../../shared/ui";

interface SummaryBarProps {
  readonly totalCost: number;
  readonly totalTurns: number;
  readonly sessionCount: number;
}

export const SummaryBar = React.memo(function SummaryBar({
  totalCost,
  totalTurns,
  sessionCount,
}: SummaryBarProps) {
  return (
    <div
      className="flex items-center gap-1 border-t border-vsc-border px-3 py-2"
      data-testid="session-sidebar-summary"
    >
      <Icon name="bar-chart" tokenSize="2xs" className="text-vsc-text-ghost" />
      <Text size="2xs" className="text-vsc-text-ghost">
        ${totalCost.toFixed(2)} total
      </Text>
      <Text size="2xs" className="text-vsc-text-ghost">
        &middot;
      </Text>
      <Text size="2xs" className="text-vsc-text-ghost">
        {totalTurns} turns
      </Text>
      <Text size="2xs" className="text-vsc-text-ghost">
        &middot;
      </Text>
      <Text size="2xs" className="text-vsc-text-ghost">
        {sessionCount} sessions
      </Text>
    </div>
  );
});
