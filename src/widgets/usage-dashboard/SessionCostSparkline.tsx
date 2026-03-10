import React from "react";
import { useAtomValue } from "jotai";

import { sessionCostHistoryAtom } from "../../features/cost-dashboard";
import { formatCost } from "../../shared/lib/formatters";
import { Text } from "../../shared/ui";

const SPARKLINE_HEIGHT = 32;
const SPARKLINE_BAR_GAP = 1;

export const SessionCostSparkline = React.memo(function SessionCostSparkline() {
  const history = useAtomValue(sessionCostHistoryAtom);

  if (history.length === 0) return null;

  const maxVal = Math.max(...history, 0.01);

  return (
    <div className="flex flex-col gap-2" data-testid="session-cost-sparkline">
      <Text size="xs" weight="medium" tone="secondary">
        Session Cost History
      </Text>
      <div
        className="flex items-end gap-px"
        style={{ height: SPARKLINE_HEIGHT }}
        role="img"
        aria-label="Session cost history bar chart"
      >
        {/* Static list — index key safe (positional bar chart, append-only) */}
        {history.map((cost, i) => {
          const heightPct = Math.max((cost / maxVal) * 100, 2);
          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm bg-vsc-info/70 hover:bg-vsc-info transition-colors duration-fast"
              style={{
                height: `${heightPct}%`,
                minWidth: 3,
                marginRight: SPARKLINE_BAR_GAP,
              }}
              title={formatCost(cost)}
            />
          );
        })}
      </div>
    </div>
  );
});
