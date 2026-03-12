import React from "react";

import { Icon } from "../primitives/Icon";
import { Text } from "../primitives/Text";
import { cn } from "../variants";

export interface ViewEmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  className?: string;
}

/**
 * Lightweight empty-state placeholder used inside tray/sidebar views.
 * For full-page empty states with a boxed icon, use `EmptyState` instead.
 */
export const ViewEmptyState = React.memo(function ViewEmptyState({
  icon,
  title,
  subtitle,
  className,
}: ViewEmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center h-full gap-2 px-4", className)}>
      <Icon name={icon} tokenSize="lg" className="text-vsc-text-ghost/20" />
      <Text size="2xs" tone="ghost" className="opacity-40 text-center">
        {title}
      </Text>
      {subtitle && (
        <Text size="3xs" tone="ghost" className="opacity-30 text-center">
          {subtitle}
        </Text>
      )}
    </div>
  );
});
