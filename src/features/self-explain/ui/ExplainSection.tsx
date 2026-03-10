/**
 * ExplainSection — Reusable section wrapper for the self-explain panel.
 */

import React, { type ReactNode } from "react";

import { cn, Icon, Text } from "~shared/ui";

interface ExplainSectionProps {
  icon: string;
  title: string;
  children: ReactNode;
  className?: string;
  /** Stagger index for entry animation (0-based) */
  index?: number;
}

export const ExplainSection = React.memo(function ExplainSection({
  icon,
  title,
  children,
  className,
  index,
}: ExplainSectionProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 px-3 py-2.5 border-t border-vsc-border/15",
        index !== undefined && "si-stagger-item",
        className,
      )}
      style={index !== undefined ? { "--si-delay": `${index * 50}ms` } as React.CSSProperties : undefined}
    >
      <div className="flex items-center gap-1.5">
        <Icon name={icon} tokenSize="xs" className="text-vsc-accent shrink-0" />
        <Text size="xs" className="font-medium text-vsc-fg">
          {title}
        </Text>
      </div>
      <div className="pl-5">{children}</div>
    </div>
  );
});
