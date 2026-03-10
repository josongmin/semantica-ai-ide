import React from "react";

import { Icon } from "../primitives/Icon";
import { Text } from "../primitives/Text";
import { cn } from "../variants";

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  className?: string;
}

export const EmptyState = React.memo(function EmptyState({
  icon,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 p-8 animate-[fade-in_300ms_ease]", className)}>
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-vsc-surface-2/40 border border-vsc-border/15 shadow-sm">
        <Icon name={icon} tokenSize="lg" className="text-vsc-text-ghost opacity-60" />
      </div>
      <Text size="sm" tone="secondary" weight="medium">
        {title}
      </Text>
      {description && (
        <Text size="xs" tone="tertiary" className="text-center max-w-[240px]">
          {description}
        </Text>
      )}
    </div>
  );
});
