import React, { useCallback, useState } from "react";
import { useAtomValue } from "jotai";

import { patchSimulationListFamily, worstConflictRiskFamily } from "../../features/patch-simulation";
import type { ConflictRisk, TurnId } from "../../shared/protocol";
import { Button, cn, Icon, Text } from "../../shared/ui";
import { ConflictBadge } from "./ConflictBadge";

const bannerStyles: Record<ConflictRisk, string> = {
  none: "border-vsc-success/30 bg-vsc-success/5",
  low: "border-vsc-success/30 bg-vsc-success/5",
  medium: "border-vsc-warning/30 bg-vsc-warning/5",
  high: "border-vsc-error/30 bg-vsc-error/5",
};

const iconColors: Record<ConflictRisk, string> = {
  none: "text-vsc-success",
  low: "text-vsc-success",
  medium: "text-vsc-warning",
  high: "text-vsc-error",
};

interface PatchSimulationBannerProps {
  turnId: TurnId;
}

export const PatchSimulationBanner = React.memo(function PatchSimulationBanner({
  turnId,
}: PatchSimulationBannerProps) {
  const results = useAtomValue(patchSimulationListFamily(turnId));
  const worstRisk = useAtomValue(worstConflictRiskFamily(turnId));
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  if (results.length === 0) return null;

  const riskCounts = results.reduce<Record<ConflictRisk, number>>(
    (acc, r) => {
      acc[r.conflict_risk]++;
      return acc;
    },
    { none: 0, low: 0, medium: 0, high: 0 },
  );

  return (
    <div
      className={cn("mx-4 my-2 border rounded-lg overflow-hidden", bannerStyles[worstRisk])}
      data-testid="patch-simulation-banner"
      role="region"
      aria-label="Patch simulation results"
    >
      {/* Summary header */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleExpanded}
        className="w-full px-3 py-1.5 text-left gap-2 bg-transparent text-vsc-fg hover:bg-vsc-list-hover/50 transition-colors duration-fast"
        aria-expanded={expanded}
      >
        <Icon name="beaker" tokenSize="sm" className={cn("shrink-0", iconColors[worstRisk])} />
        <Text size="xs" weight="medium" className="shrink-0">
          Patch Simulation
        </Text>
        <Text size="xs" tone="tertiary" className="flex-1">
          {results.length} file{results.length !== 1 ? "s" : ""}
          {riskCounts.high > 0 && ` \u2022 ${riskCounts.high} high risk`}
          {riskCounts.medium > 0 && ` \u2022 ${riskCounts.medium} medium risk`}
        </Text>
        <Icon
          name={expanded ? "chevron-up" : "chevron-down"}
          tokenSize="xs"
          className="text-vsc-text-tertiary"
        />
      </Button>

      {/* Expanded file list */}
      {expanded && (
        <div className="border-t border-vsc-border/30 px-3 py-1.5 space-y-1
                        animate-[slide-down-in_150ms_ease-out] origin-top">
          {results.map((r, i) => (
            <div
              key={r.file_path}
              className="flex items-center gap-2 text-xs py-0.5
                         animate-[fade-in_150ms_ease-out]"
              style={{ animationDelay: `${i * 30}ms`, animationFillMode: "both" }}
              data-testid={`patch-sim-file-${r.file_path}`}
            >
              <ConflictBadge risk={r.conflict_risk} />
              <Text size="xs" truncate className="flex-1 min-w-0" title={r.file_path}>
                {r.file_path}
              </Text>
              {r.conflict_details && (
                <Text size="2xs" tone="tertiary" truncate title={r.conflict_details}>
                  {r.conflict_details}
                </Text>
              )}
              {r.affected_files.length > 0 && (
                <Text size="2xs" tone="ghost">
                  +{r.affected_files.length} affected
                </Text>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
