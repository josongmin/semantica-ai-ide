import React, { useMemo } from "react";
import { useAtomValue } from "jotai";
import { selectAtom } from "jotai/utils";

import { turnPipelineAtomFamily } from "~entities/turn-pipeline";

import type { TurnId } from "../../shared/protocol";
import { cn, Icon, RISK_BG_COLOR, RISK_ICON_COLOR, Text } from "../../shared/ui";

export const RiskHeatmapWidget = React.memo(function RiskHeatmapWidget({ turnId }: { turnId: TurnId }) {
  const heatmapAtom = useMemo(() => selectAtom(turnPipelineAtomFamily(turnId), (p) => p.riskHeatmap), [turnId]);
  const entries = useAtomValue(heatmapAtom);

  const byFile = useMemo(() => {
    const map = new Map<string, typeof entries[number][]>();
    for (const e of entries) {
      const list = map.get(e.file_path) ?? [];
      list.push(e);
      map.set(e.file_path, list);
    }
    return map;
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <div className="px-3 py-2 border-b border-vsc-border/40" data-testid="risk-heatmap">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon name="flame" tokenSize="sm" className="text-vsc-warning" />
        <Text size="sm" weight="medium" tone="secondary">Risk Heatmap</Text>
        <Text size="2xs" mono tone="ghost" className="ml-auto">{entries.length} regions</Text>
      </div>
      <div className="pl-5 space-y-1">
        {Array.from(byFile.entries()).map(([filePath, regions]) => (
          <div key={filePath}>
            <Text size="2xs" mono tone="secondary">{filePath.split("/").pop()}</Text>
            <div className="space-y-0.5 mt-0.5">
              {regions.map((r) => (
                <div key={`${r.line_start}-${r.line_end}`} className={cn("flex items-center gap-1.5 px-1.5 py-0.5 rounded", RISK_BG_COLOR[r.risk_level])}>
                  <Icon name="warning" tokenSize="2xs" className={RISK_ICON_COLOR[r.risk_level]} />
                  <Text size="2xs" mono tone="ghost">L{r.line_start}-{r.line_end}</Text>
                  <Text size="2xs" tone="secondary" truncate className="flex-1 min-w-0">{r.description}</Text>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
