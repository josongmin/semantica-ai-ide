import React from "react";

import type { RiskItem } from "~features/repo-explain";
import { cn, Icon } from "~shared/ui";

// ─── Types ────────────────────────────────────────────────

interface RiskListProps {
  risks: RiskItem[];
  className?: string;
}

// ─── Severity config ──────────────────────────────────────

const SEVERITY_CONFIG: Record<
  RiskItem["severity"],
  { icon: string; iconClass: string; bgClass: string }
> = {
  warning: {
    icon: "warning",
    iconClass: "text-vsc-warning",
    bgClass: "bg-vsc-warning/8",
  },
  info: {
    icon: "info",
    iconClass: "text-vsc-info",
    bgClass: "bg-vsc-info/8",
  },
};

// ─── Component ────────────────────────────────────────────

export const RiskList = React.memo(function RiskList({
  risks,
  className,
}: RiskListProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {risks.map((risk, index) => {
        const config = SEVERITY_CONFIG[risk.severity];
        return (
          <div
            key={risk.title}
            className={cn(
              "si-stagger-item flex gap-3 p-3 rounded-md",
              config.bgClass,
            )}
            style={{ "--si-delay": `${index * 40}ms` } as React.CSSProperties}
          >
            <Icon
              name={config.icon}
              tokenSize="xs"
              className={cn("shrink-0 mt-0.5", config.iconClass)}
            />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs font-medium text-vsc-fg">
                {risk.title}
              </span>
              <span className="text-2xs text-vsc-text-secondary leading-relaxed">
                {risk.description}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
});
