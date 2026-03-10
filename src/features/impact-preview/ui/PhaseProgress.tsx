import React from "react";

import { cn, Icon, ProgressBar, Spinner, Text } from "~shared/ui";

import { IMPACT_PHASES, type ImpactPhase, type ImpactPhaseStatus, PHASE_LABELS } from "../model/impactPreviewAtoms";

// ─── Types ──────────────────────────────────────────────

export interface PhaseProgressProps {
  phases: Record<ImpactPhase, ImpactPhaseStatus>;
  progress: number;
  phasesDone: number;
}

function phaseIndicatorTone(status: ImpactPhaseStatus): "secondary" | "primary" | "ghost" {
  if (status === "done") return "secondary";
  if (status === "running") return "primary";
  return "ghost";
}

// ─── Phase Indicator ────────────────────────────────────

const PhaseIndicator = React.memo(function PhaseIndicator({
  phase,
  status,
}: {
  phase: ImpactPhase;
  status: ImpactPhaseStatus;
}) {
  return (
    <div className="flex items-center gap-1">
      {status === "done" && (
        <Icon
          name="check"
          tokenSize="2xs"
          className="text-vsc-success animate-in zoom-in-50 duration-200"
        />
      )}
      {status === "running" && <Spinner size="sm" className="text-vsc-accent" />}
      {status === "pending" && (
        <span className="text-2xs text-vsc-text-ghost">&#9676;</span>
      )}
      <Text
        size="2xs"
        tone={phaseIndicatorTone(status)}
        className={cn(status === "running" && "font-medium")}
      >
        {PHASE_LABELS[phase]}
      </Text>
    </div>
  );
});

// ─── Phase Progress ─────────────────────────────────────

export const PhaseProgress = React.memo(function PhaseProgress({
  phases,
  progress,
  phasesDone,
}: PhaseProgressProps) {
  // progress is available for external consumers; phasesDone drives the bar
  return (
    <div className="flex flex-col gap-2 px-3 py-3">
      <Text size="xs" tone="secondary" className="font-medium">
        Analyzing changes...
      </Text>

      <ProgressBar
        value={phasesDone}
        max={IMPACT_PHASES.length}
        label={`${phasesDone}/${IMPACT_PHASES.length} phases (${progress}%)`}
        barClassName="bg-vsc-accent"
      />

      <div className="flex items-center gap-3 flex-wrap">
        {IMPACT_PHASES.map((phase) => (
          <PhaseIndicator key={phase} phase={phase} status={phases[phase]} />
        ))}
      </div>
    </div>
  );
});
