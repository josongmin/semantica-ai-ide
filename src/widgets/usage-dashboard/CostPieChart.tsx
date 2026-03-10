import React, { useMemo } from "react";
import { useAtomValue } from "jotai";

import { modelCostsAtom } from "../../features/cost-dashboard";
import { formatCost } from "../../shared/lib/formatters";
import { Text } from "../../shared/ui";

const COST_PIE_SIZE = 80;

export const CostPieChart = React.memo(function CostPieChart() {
  const modelCosts = useAtomValue(modelCostsAtom);

  const gradient = useMemo(() => {
    if (modelCosts.length === 0) return "conic-gradient(var(--vscode-editorWidget-border) 0% 100%)";
    const total = modelCosts.reduce((sum, m) => sum + m.cost, 0);
    if (total === 0) return "conic-gradient(var(--vscode-editorWidget-border) 0% 100%)";

    const segments: string[] = [];
    let cumPct = 0;
    for (const mc of modelCosts) {
      const pct = (mc.cost / total) * 100;
      segments.push(`${mc.color} ${cumPct}% ${cumPct + pct}%`);
      cumPct += pct;
    }
    return `conic-gradient(${segments.join(", ")})`;
  }, [modelCosts]);

  if (modelCosts.length === 0) return null;

  const total = modelCosts.reduce((sum, m) => sum + m.cost, 0);

  return (
    <div className="flex flex-col gap-2" data-testid="cost-pie-chart">
      <Text size="xs" weight="medium" tone="secondary">
        Cost Breakdown
      </Text>
      <div className="flex items-center gap-3">
        <div
          className="rounded-full shrink-0"
          style={{
            width: COST_PIE_SIZE,
            height: COST_PIE_SIZE,
            background: gradient,
          }}
          role="img"
          aria-label="Model cost distribution pie chart"
        />
        <div className="flex flex-col gap-1 min-w-0">
          {modelCosts.map((mc) => (
            <div key={mc.model} className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: mc.color }}
              />
              <Text size="2xs" truncate className="max-w-[100px]">
                {mc.model}
              </Text>
              <Text size="2xs" tone="secondary" mono className="ml-auto">
                {formatCost(mc.cost)} ({total > 0 ? Math.round((mc.cost / total) * 100) : 0}%)
              </Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
