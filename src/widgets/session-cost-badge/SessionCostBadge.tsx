import React from "react";

import { formatCost } from "../../shared/lib/formatters";
import { cn, Icon, Text } from "../../shared/ui";

export interface SessionCostBadgeProps {
  /** Cost in USD */
  readonly costUsd: number | undefined | null;
  /** Additional CSS classes */
  readonly className?: string;
}

/**
 * SessionCostBadge — a small pill badge displaying session cost
 * with a dollar icon. Designed for use on session cards in the session list.
 *
 * Shows nothing when cost is undefined/null/zero.
 */
export const SessionCostBadge = React.memo(function SessionCostBadge({
  costUsd,
  className,
}: SessionCostBadgeProps) {
  if (costUsd == null || costUsd <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full",
        "bg-vsc-badge text-vsc-badge-fg",
        "text-2xs leading-none whitespace-nowrap",
        className,
      )}
      data-testid="session-cost-badge"
      aria-label={`Session cost: ${formatCost(costUsd)}`}
    >
      <Icon name="credit-card" tokenSize="2xs" />
      <Text size="2xs" mono className="text-inherit">
        {formatCost(costUsd)}
      </Text>
    </span>
  );
});
