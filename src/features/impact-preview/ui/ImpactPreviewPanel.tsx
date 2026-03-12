import React, { useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";

import { useNavigateToFile } from "~shared/lib";
import { Badge, cn, Collapsible, Icon, Text } from "~shared/ui";

import {
  type AffectedPath,
  impactErrorAtom,
  impactLoadingAtom,
  impactPhasesAtom,
  impactPhasesDoneAtom,
  impactProgressAtom,
  type ImpactResult,
  impactResultAtom,
  type ImpactSeverity,
} from "../model/impactPreviewAtoms";
import { AffectedPathRow } from "./AffectedPathRow";
import { ImpactScoreCard } from "./ImpactScoreCard";
import { PhaseProgress } from "./PhaseProgress";

function coverageBarColor(percentage: number): string {
  if (percentage >= 80) return "bg-vsc-success";
  if (percentage >= 60) return "bg-vsc-warning";
  return "bg-vsc-error";
}

// ─── Severity Colors ────────────────────────────────────

const RISK_TEXT_COLOR: Record<ImpactSeverity, string> = {
  safe: "text-vsc-success",
  low: "text-vsc-info",
  moderate: "text-vsc-warning",
  high: "text-vsc-error",
};

// ─── Risk Meter ─────────────────────────────────────────

const RISK_LEVELS: ImpactSeverity[] = ["safe", "low", "moderate", "high"];

const RiskMeter = React.memo(function RiskMeter({
  risk,
  confidence,
}: {
  risk: ImpactSeverity;
  confidence: number;
}) {
  const riskIndex = RISK_LEVELS.indexOf(risk);
  const positionPct = (riskIndex / (RISK_LEVELS.length - 1)) * 100;

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2">
      <div className="flex items-center gap-2">
        <Text size="2xs" tone="ghost" className="font-medium">
          Risk meter
        </Text>
        <Badge
          text={`${Math.round(confidence * 100)}% confidence`}
          variant="info"
          className="text-2xs"
        />
      </div>

      {/* Gradient bar */}
      <div className="relative h-1.5 rounded-full overflow-hidden bg-vsc-surface-3">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "linear-gradient(to right, var(--vsc-success), var(--vsc-info), var(--vsc-warning), var(--vsc-error))",
          }}
        />
        {/* Position indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-vsc-fg bg-vsc-surface-0 transition-[left] duration-slow ease-out"
          style={{ left: `${positionPct}%` }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between">
        {RISK_LEVELS.map((level) => (
          <Text
            key={level}
            size="2xs"
            className={cn(
              level === risk ? `${RISK_TEXT_COLOR[level]} font-medium` : "text-vsc-text-ghost",
            )}
          >
            {level}
          </Text>
        ))}
      </div>
    </div>
  );
});

// ─── Results View ───────────────────────────────────────

const ResultsView = React.memo(function ResultsView({
  result,
  onPathClick,
}: {
  result: ImpactResult;
  onPathClick: (filePath: string, line: number) => void;
}) {
  const directPaths = useMemo(
    () => result.affectedPaths.filter((p) => p.relationship === "direct"),
    [result.affectedPaths],
  );
  const transitivePaths = useMemo(
    () => result.affectedPaths.filter((p) => p.relationship === "transitive"),
    [result.affectedPaths],
  );

  const handlePathClick = useCallback(
    (path: AffectedPath) => {
      onPathClick(path.filePath, path.line);
    },
    [onPathClick],
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3">
        <Icon name="symbol-method" tokenSize="sm" className="text-vsc-accent shrink-0" />
        <Text size="xs" className="font-medium text-vsc-fg">
          {result.targetSymbol}
        </Text>
        <Text size="2xs" tone="ghost">
          &mdash;{" "}
          {result.scoreCards.reduce(
            (sum, c) => sum + (typeof c.value === "number" ? c.value : 0),
            0,
          )}{" "}
          changes detected
        </Text>
      </div>

      {/* Score Cards */}
      <div className="flex gap-2 px-3 overflow-x-auto">
        {result.scoreCards.map((card) => (
          <ImpactScoreCard
            key={card.label}
            label={card.label}
            value={
              card.label === "Latency Risk" || card.label === "Security Risk"
                ? card.severity
                : card.value
            }
            severity={card.severity}
            detail={card.detail}
          />
        ))}
      </div>

      {/* Affected Paths */}
      <div className="border-t border-vsc-border/15">
        <Collapsible
          title="Direct callers"
          badge={`${directPaths.length} files`}
          defaultCollapsed={false}
          contentClassName="pb-1"
        >
          {directPaths.map((path) => (
            <AffectedPathRow
              key={`${path.filePath}:${path.line}`}
              path={path}
              onClick={() => handlePathClick(path)}
            />
          ))}
        </Collapsible>

        <Collapsible
          title="Transitive impact"
          badge={`${transitivePaths.length} files`}
          defaultCollapsed
          contentClassName="pb-1"
        >
          {transitivePaths.map((path) => (
            <AffectedPathRow
              key={`${path.filePath}:${path.line}`}
              path={path}
              onClick={() => handlePathClick(path)}
            />
          ))}
        </Collapsible>

        <Collapsible
          title="Test coverage"
          summary={`${result.testCoverage.percentage}% (${result.testCoverage.covered}/${result.testCoverage.total})`}
          badge={`${result.testCoverage.percentage}%`}
          defaultCollapsed
          contentClassName="px-3 pb-2"
        >
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-vsc-surface-3 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-slow ease-out",
                  coverageBarColor(result.testCoverage.percentage),
                )}
                style={{ width: `${result.testCoverage.percentage}%` }}
              />
            </div>
            <Text size="2xs" tone="ghost" className="tabular-nums shrink-0">
              {result.testCoverage.covered}/{result.testCoverage.total} tests passing
            </Text>
          </div>
        </Collapsible>
      </div>

      {/* Risk Meter */}
      <div className="border-t border-vsc-border/15">
        <RiskMeter risk={result.overallRisk} confidence={result.confidence} />
      </div>
    </div>
  );
});

// ─── Main Panel ─────────────────────────────────────────

export const ImpactPreviewPanel = React.memo(function ImpactPreviewPanel() {
  const phases = useAtomValue(impactPhasesAtom);
  const result = useAtomValue(impactResultAtom);
  const loading = useAtomValue(impactLoadingAtom);
  const progress = useAtomValue(impactProgressAtom);
  const phasesDone = useAtomValue(impactPhasesDoneAtom);
  const error = useAtomValue(impactErrorAtom);
  const navigateToFile = useNavigateToFile();

  const handlePathClick = useCallback(
    (filePath: string, line: number) => {
      navigateToFile(filePath, line);
    },
    [navigateToFile],
  );

  const isScanning = loading || (!result && !error && phasesDone > 0);

  return (
    <div className="flex flex-col h-full bg-vsc-surface-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isScanning && !result && (
          <PhaseProgress phases={phases} progress={progress} phasesDone={phasesDone} />
        )}
        {result && (
          <div className="animate-in fade-in duration-slow">
            <ResultsView result={result} onPathClick={handlePathClick} />
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-vsc-error px-4">
            <Icon name="error" tokenSize="lg" className="opacity-60" />
            <Text size="xs" className="font-medium">
              Analysis failed
            </Text>
            <Text size="2xs" tone="ghost" className="text-center max-w-[280px]">
              {error}
            </Text>
          </div>
        )}
        {!isScanning && !result && !error && (
          <div className="flex flex-col items-center justify-center h-full gap-1 text-vsc-text-ghost">
            <Icon name="graph" tokenSize="lg" className="opacity-30" />
            <Text size="xs" tone="ghost">
              Run impact analysis to preview change effects
            </Text>
          </div>
        )}
      </div>
    </div>
  );
});
