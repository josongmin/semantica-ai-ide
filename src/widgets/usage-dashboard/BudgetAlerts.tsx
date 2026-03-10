import React from "react";
import { useAtomValue } from "jotai";

import { costAlertsAtom } from "../../features/cost-dashboard";
import { Badge, cn, Text } from "../../shared/ui";

export const BudgetAlerts = React.memo(function BudgetAlerts() {
  const alerts = useAtomValue(costAlertsAtom);

  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2" data-testid="budget-alerts">
      <Text size="xs" weight="medium" tone="secondary">
        Budget Alerts
      </Text>
      <div className="flex flex-col gap-1.5">
        {alerts.map((alert) => {
          const pct = alert.threshold > 0 ? Math.round((alert.current / alert.threshold) * 100) : 0;
          const isOver = alert.current >= alert.threshold;
          return (
            <div
              key={alert.id}
              className={cn(
                "p-2 rounded-md border text-2xs",
                isOver
                  ? "bg-vsc-error/10 border-vsc-error/30"
                  : "bg-vsc-warning/10 border-vsc-warning/30",
              )}
            >
              <div className="flex items-center justify-between">
                <Text size="2xs">{alert.message}</Text>
                <Badge
                  text={`${pct}%`}
                  variant={isOver ? "error" : "warning"}
                  className="ml-2 shrink-0"
                />
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-vsc-border/30 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-normal",
                    isOver ? "bg-vsc-error" : "bg-vsc-warning",
                  )}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
