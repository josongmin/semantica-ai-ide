import React from "react";

import { cn, Icon, Text } from "../../shared/ui";

export interface SummaryCardProps {
  readonly label: string;
  readonly value: string;
  readonly icon: string;
  readonly className?: string;
}

export const SummaryCard = React.memo(function SummaryCard({
  label,
  value,
  icon,
  className,
}: SummaryCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 p-3 rounded-md border border-vsc-border bg-vsc-surface-1",
        className,
      )}
      data-testid={`summary-card-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-center gap-1.5">
        <Icon name={icon} tokenSize="sm" className="text-vsc-text-secondary" />
        <Text size="xs" tone="secondary">
          {label}
        </Text>
      </div>
      <Text size="lg" weight="bold" mono>
        {value}
      </Text>
    </div>
  );
});
