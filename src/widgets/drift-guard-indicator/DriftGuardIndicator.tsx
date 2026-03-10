import React, { useMemo } from "react";
import { useAtomValue } from "jotai";
import { selectAtom } from "jotai/utils";

import { turnPipelineAtomFamily } from "~entities/turn-pipeline";

import type { TurnId } from "../../shared/protocol";
import { cn, Icon, RISK_BG_COLOR, RISK_TEXT_COLOR, Text } from "../../shared/ui";

export const DriftGuardIndicator = React.memo(function DriftGuardIndicator({ turnId }: { turnId: TurnId }) {
  const driftGuardAtom = useMemo(() => selectAtom(turnPipelineAtomFamily(turnId), (p) => p.driftGuard), [turnId]);
  const state = useAtomValue(driftGuardAtom);

  const { criticalCount, warningCount } = useMemo(() => {
    let critical = 0, warning = 0;
    for (const a of state.alerts) {
      if (a.severity === "critical") critical++;
      else if (a.severity === "warning") warning++;
    }
    return { criticalCount: critical, warningCount: warning };
  }, [state.alerts]);

  if (state.alerts.length === 0 && state.gate_pass_rate >= 1.0) return null;

  return (
    <div className="px-3 py-2 border-b border-vsc-border/40" data-testid="drift-guard-indicator">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon name="shield" tokenSize="sm" className={cn(
          criticalCount > 0 && "text-vsc-error",
          criticalCount === 0 && warningCount > 0 && "text-vsc-warning",
          criticalCount === 0 && warningCount === 0 && "text-vsc-text-secondary",
        )} />
        <Text size="sm" weight="medium" tone="secondary">Drift Guard</Text>
        <Text size="2xs" mono tone="ghost" className="ml-auto">Gate pass: {(state.gate_pass_rate * 100).toFixed(0)}%</Text>
      </div>

      {state.alerts.length > 0 && (
        <div className="pl-5 space-y-0.5">
          {state.alerts.map((alert) => (
            <div key={alert.id} className={cn(
              "flex items-center gap-1.5 px-1.5 py-0.5 rounded",
              alert.severity === "critical" && RISK_BG_COLOR.dangerous,
              alert.severity === "warning" && RISK_BG_COLOR.moderate,
            )}>
              <Icon name={(() => { if (alert.severity === "critical") return "error"; if (alert.severity === "warning") return "warning"; return "info"; })()} tokenSize="2xs"
                className={cn(
                  alert.severity === "critical" && RISK_TEXT_COLOR.dangerous,
                  alert.severity === "warning" && RISK_TEXT_COLOR.moderate,
                  alert.severity === "info" && "text-vsc-text-tertiary",
                )} />
              <Text size="2xs" mono tone="ghost">{alert.type}</Text>
              <Text size="2xs" tone="secondary" truncate className="flex-1 min-w-0">{alert.description}</Text>
              {alert.requires_evidence && <Icon name="lock" tokenSize="2xs" className="text-vsc-text-ghost" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
