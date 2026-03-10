import React from "react";
import { useAtomValue } from "jotai";

import { semanticDiffByTurnFamily } from "../../entities/semantic-diff";
import type { SemanticChangeGroup, TurnId } from "../../shared/protocol";
import { Badge, cn, Icon, Text } from "../../shared/ui";

// ─── Impact Colors ───────────────────────────────────────────

const IMPACT_STYLES: Record<string, string> = {
  low: "bg-vsc-success",
  medium: "bg-vsc-warning",
  high: "bg-[var(--vscode-charts-orange,#d18616)]",
  critical: "bg-vsc-error",
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  feature: { bg: "bg-vsc-info/20", text: "text-vsc-info" },
  bugfix: { bg: "bg-vsc-error/20", text: "text-vsc-error" },
  refactor: { bg: "bg-vsc-warning/20", text: "text-vsc-warning" },
  style: { bg: "bg-[var(--vscode-charts-purple,#b267e6)]/20", text: "text-[var(--vscode-charts-purple,#b267e6)]" },
  perf: { bg: "bg-vsc-success/20", text: "text-vsc-success" },
  docs: { bg: "bg-vsc-text-ghost/20", text: "text-vsc-text-ghost" },
  test: { bg: "bg-[var(--vscode-charts-orange,#d18616)]/20", text: "text-[var(--vscode-charts-orange,#d18616)]" },
};

// ─── Risk Badge ──────────────────────────────────────────────

export const RiskBadge = React.memo(function RiskBadge({
  level,
}: {
  readonly level: "safe" | "review" | "risky";
}) {
  let variant: "success" | "warning" | "error";
  if (level === "safe") {
    variant = "success";
  } else if (level === "review") {
    variant = "warning";
  } else {
    variant = "error";
  }
  return <Badge text={level.charAt(0).toUpperCase() + level.slice(1)} variant={variant} />;
});

// ─── Semantic Group Card ─────────────────────────────────────

interface GroupCardProps {
  readonly group: SemanticChangeGroup;
}

const SemanticGroupCard = React.memo(function SemanticGroupCard({ group }: GroupCardProps) {
  const catStyle = CATEGORY_COLORS[group.category] ?? CATEGORY_COLORS.feature ?? { bg: "", text: "" };

  return (
    <div className="rounded-lg border border-vsc-border/40 p-3 space-y-2">
      {/* Impact bar + header */}
      <div className="flex items-start gap-2">
        <div
          className={cn(
            "w-1 self-stretch rounded-full shrink-0",
            IMPACT_STYLES[group.impact] ?? IMPACT_STYLES.low,
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Text size="sm" weight="medium" truncate className="min-w-0">{group.title}</Text>
            <span className={cn("px-1.5 py-0.5 rounded text-2xs shrink-0", catStyle.bg, catStyle.text)}>
              {group.category}
            </span>
          </div>
          <Text size="xs" tone="tertiary" className="mt-1">
            {group.narrative}
          </Text>
        </div>
      </div>

      {/* Files */}
      {group.files.length > 0 && (
        <div className="pl-3 space-y-0.5">
          {group.files.map((f) => (
            <div key={f.filePath} className="flex items-center gap-1.5">
              <Icon name="file" tokenSize="xs" className="text-vsc-text-ghost shrink-0" />
              <Text size="2xs" tone="secondary" truncate className="font-mono min-w-0">
                {f.filePath}
              </Text>
              <Text size="2xs" tone="ghost" className="shrink-0">
                {f.hunks.length} hunks
              </Text>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// ─── Main Panel ──────────────────────────────────────────────

interface SemanticDiffPanelProps {
  readonly turnId: TurnId;
}

export const SemanticDiffPanel = React.memo(function SemanticDiffPanel({
  turnId,
}: SemanticDiffPanelProps) {
  const result = useAtomValue(semanticDiffByTurnFamily(turnId));

  if (!result) return null;

  return (
    <div className="space-y-3" data-testid="semantic-diff-panel">
      {/* Overall narrative */}
      <div className="flex items-start gap-2">
        <Icon name="book" tokenSize="sm" className="text-vsc-text-secondary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Text size="sm" weight="medium">Change Narrative</Text>
            {result.riskAssessment && <RiskBadge level={result.riskAssessment.level} />}
          </div>
          <Text size="xs" tone="secondary" className="mt-1">
            {result.overallNarrative}
          </Text>
        </div>
      </div>

      {/* Risk reasons */}
      {result.riskAssessment && result.riskAssessment.reasons.length > 0 && (
        <div className="p-2 rounded bg-vsc-warning/5 border-l-2 border-vsc-warning">
          {result.riskAssessment.reasons.map((reason) => (
            <Text key={reason} size="2xs" tone="secondary">
              {reason}
            </Text>
          ))}
        </div>
      )}

      {/* Groups */}
      <div className="space-y-2">
        {result.groups.map((group) => (
          <SemanticGroupCard key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
});
