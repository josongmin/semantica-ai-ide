import React from "react";
import { useAtomValue } from "jotai";

import { DEFAULT_TURN_PIPELINE, turnPipelineAtomFamily } from "~entities/turn-pipeline";

import { pipelineStageVisibilityAtom } from "../../features/pipeline-settings";
import type { TurnId } from "../../shared/protocol";
import { cn, Icon, Text } from "../../shared/ui";

interface PipelineBadgeProps {
  turnId: TurnId;
  /** When true, shows a chevron indicator for expand/collapse */
  expandable?: boolean;
  /** Current expanded state — controls chevron direction */
  expanded?: boolean;
  onClick?: () => void;
}

/**
 * Compact one-line pipeline summary for a turn.
 * Shows: InputGate intent/risk → Strategy type/progress → Verdict confidence
 */
export const PipelineBadge = React.memo(function PipelineBadge({
  turnId,
  expandable,
  expanded,
  onClick,
}: PipelineBadgeProps) {
  const pipeline = useAtomValue(turnPipelineAtomFamily(turnId));
  const stages = useAtomValue(pipelineStageVisibilityAtom);

  const hasData =
    pipeline.inputGate !== DEFAULT_TURN_PIPELINE.inputGate ||
    pipeline.verdict !== DEFAULT_TURN_PIPELINE.verdict ||
    pipeline.strategy.candidates_evaluated > 0;

  if (!hasData) return null;

  const segments: React.ReactNode[] = [];

  // InputGate segment
  if (stages.inputGate && pipeline.inputGate) {
    let riskColor: string;
    if (pipeline.inputGate.risk_level === "dangerous") {
      riskColor = "text-vsc-error";
    } else if (pipeline.inputGate.risk_level === "moderate") {
      riskColor = "text-vsc-warning";
    } else {
      riskColor = "text-vsc-success";
    }
    segments.push(
      <span key="gate" className="flex items-center gap-1">
        <span className="text-vsc-text-ghost">{pipeline.inputGate.intent_type}</span>
        <span className={riskColor}>{pipeline.inputGate.risk_level}</span>
      </span>,
    );
  }

  // Strategy segment
  if (stages.strategy && pipeline.strategy.candidates_evaluated > 0) {
    segments.push(
      <span key="strategy" className="text-vsc-text-ghost">
        {pipeline.strategy.strategy} {pipeline.strategy.candidates_evaluated}/
        {pipeline.strategy.budget.max_candidates}
      </span>,
    );
  }

  // Verdict segment — Icon for visual consistency
  if (stages.verdict && pipeline.verdict) {
    const passed = pipeline.verdict.confidence >= 0.7;
    segments.push(
      <span
        key="verdict"
        className={cn("flex items-center gap-1", passed ? "text-vsc-success" : "text-vsc-error")}
      >
        <Icon name={passed ? "pass-filled" : "error"} tokenSize="2xs" />
        {pipeline.verdict.confidence.toFixed(2)}
      </span>,
    );
  }

  if (segments.length === 0) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 mx-2 my-0.5 px-2 py-1 rounded",
        "bg-vsc-surface-2/50 border border-vsc-border/20",
        "hover:bg-vsc-toolbar/50 transition-colors duration-fast cursor-pointer text-2xs focus-ring",
        expanded && "bg-vsc-toolbar/30 border-vsc-border/40",
      )}
    >
      {expandable && (
        <Icon
          name={expanded ? "chevron-down" : "chevron-right"}
          tokenSize="2xs"
          className="text-vsc-text-ghost shrink-0"
        />
      )}
      <Icon name="beaker" tokenSize="2xs" className="text-vsc-info shrink-0" />
      <div className="flex items-center gap-1 overflow-hidden">
        {segments.map((seg, i) => (
          <React.Fragment key={React.isValidElement(seg) ? (seg.key ?? i) : i}>
            {i > 0 && (
              <Text size="2xs" tone="ghost">
                →
              </Text>
            )}
            {seg}
          </React.Fragment>
        ))}
      </div>
    </button>
  );
});
