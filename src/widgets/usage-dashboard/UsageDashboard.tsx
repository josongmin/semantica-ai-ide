import React, { useMemo } from "react";
import { useAtomValue } from "jotai";

import {
  avgCostPerSessionAtom,
  maxModelTokensAtom,
  usageStatsAtom,
} from "../../features/usage-dashboard";
import { usageDashboardPanelVisibleAtom } from "../../shared/lib/atoms/bottomSheetAtoms";
import { formatCost, formatTokens } from "../../shared/lib/formatters";
import { cn, Icon, Text } from "../../shared/ui";
import { BudgetAlerts } from "./BudgetAlerts";
import { CostPieChart } from "./CostPieChart";
import { ModelBar } from "./ModelBar";
import { SessionCostSparkline } from "./SessionCostSparkline";
import { SummaryCard } from "./SummaryCard";

// ─── Main Widget ────────────────────────────────────────────

export interface UsageDashboardProps {
  readonly className?: string;
}

/**
 * UsageDashboard -- session-level and model-level usage summary.
 *
 * Shows summary cards (total sessions, cost, tokens, avg cost) and
 * a per-model breakdown with proportional bar chart visualization.
 */
export const UsageDashboard = React.memo(function UsageDashboard({
  className,
}: UsageDashboardProps) {
  const visible = useAtomValue(usageDashboardPanelVisibleAtom);
  const stats = useAtomValue(usageStatsAtom);
  const avgCost = useAtomValue(avgCostPerSessionAtom);
  const maxTokens = useAtomValue(maxModelTokensAtom);

  const sortedModels = useMemo(() => {
    if (!stats) return [];
    return [...stats.per_model].sort((a, b) => b.tokens - a.tokens);
  }, [stats]);

  if (!visible || !stats) return null;

  return (
    <div className={cn("flex flex-col gap-4 p-4", className)} data-testid="usage-dashboard">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Icon name="graph" tokenSize="sm" className="text-vsc-text-secondary" />
        <Text size="sm" weight="bold">
          Usage Dashboard
        </Text>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 gap-2" data-testid="summary-cards">
        <SummaryCard label="Total Sessions" value={String(stats.total_sessions)} icon="layers" />
        <SummaryCard
          label="Total Cost"
          value={formatCost(stats.total_cost_usd)}
          icon="credit-card"
        />
        <SummaryCard
          label="Total Tokens"
          value={formatTokens(stats.total_tokens)}
          icon="symbol-number"
        />
        <SummaryCard label="Avg Cost/Session" value={formatCost(avgCost)} icon="dashboard" />
      </div>

      {/* Per-Model Breakdown */}
      {sortedModels.length > 0 && (
        <div className="flex flex-col gap-3" data-testid="model-breakdown">
          <Text size="xs" weight="medium" tone="secondary">
            Per-Model Breakdown
          </Text>
          <div className="flex flex-col gap-2.5">
            {sortedModels.map((model) => (
              <ModelBar key={model.model} model={model} maxTokens={maxTokens} />
            ))}
          </div>
        </div>
      )}

      {/* Cost Pie Chart */}
      <CostPieChart />

      {/* Session Cost Sparkline */}
      <SessionCostSparkline />

      {/* Budget Alerts */}
      <BudgetAlerts />
    </div>
  );
});
