import React, { useCallback, useState } from "react";
import { useAtomValue } from "jotai";

import { fileChangeSummaryByTurnAtom } from "~entities/diff";
import { toolCallGroupsByTurnAtom } from "~entities/tool-call";
import { DEFAULT_TURN_PIPELINE, turnPipelineAtomFamily } from "~entities/turn-pipeline";

import { pipelineModeAtom, pipelineStageVisibilityAtom } from "../../features/pipeline-settings";
import { pipelineGlobalVisibleAtom } from "../../shared/lib/atoms/bottomSheetAtoms";
import type { TurnId } from "../../shared/protocol";
import { ErrorBoundary, Icon, Text } from "../../shared/ui";
import { CodeEditFlowWidget } from "../code-edit-flow";
import { DriftGuardIndicator } from "../drift-guard-indicator";
import { EvidenceBundleViewer } from "../evidence-bundle-viewer";
import { ExplainableVerdictWidget } from "../explainable-verdict";
import { InputGatePanel } from "../input-gate-panel";
import { PipelineBadge } from "../pipeline-badge";
import { RiskHeatmapWidget } from "../risk-heatmap";
import { StrategyDashboard } from "../strategy-dashboard";
import { ValidationPanel } from "../validation-panel";

/** Collapsible pipeline section inside each turn. Mode-aware with stage filtering. */
export const TurnPipelineSection = React.memo(function TurnPipelineSection({ turnId }: { turnId: TurnId }) {
  const pipeline = useAtomValue(turnPipelineAtomFamily(turnId));
  const mode = useAtomValue(pipelineModeAtom);
  const globalVisible = useAtomValue(pipelineGlobalVisibleAtom);
  const stages = useAtomValue(pipelineStageVisibilityAtom);
  const toolGroups = useAtomValue(toolCallGroupsByTurnAtom(turnId));
  const fileSummary = useAtomValue(fileChangeSummaryByTurnAtom(turnId));
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  const hasFileActivity =
    toolGroups.some((g) => g.calls.length > 0) || fileSummary.files.length > 0;

  const hasData =
    pipeline.inputGate !== DEFAULT_TURN_PIPELINE.inputGate ||
    pipeline.failClosed !== DEFAULT_TURN_PIPELINE.failClosed ||
    pipeline.verdict !== DEFAULT_TURN_PIPELINE.verdict ||
    pipeline.evidenceBundle !== DEFAULT_TURN_PIPELINE.evidenceBundle ||
    pipeline.riskHeatmap.length > 0 ||
    pipeline.driftGuard.alerts.length > 0 ||
    pipeline.strategy.candidates_evaluated > 0 ||
    pipeline.validation.invariants.length > 0 ||
    pipeline.validation.risk_witnesses.length > 0 ||
    pipeline.sideEffectBudget.used_side_effects > 0 ||
    pipeline.decisionTrace.length > 0 ||
    hasFileActivity;

  // Visibility rules based on mode
  if (mode === "off" || !globalVisible) return null;
  if (mode === "auto" && !hasData) return null;

  // Compact mode: badge only, no expand
  if (mode === "compact") {
    return <PipelineBadge turnId={turnId} />;
  }

  // always / auto with data: badge as clickable header -> expand detail panels
  return (
    <div className="mx-4 my-2 overflow-hidden">
      <PipelineBadge turnId={turnId} expandable expanded={open} onClick={toggle} />
      {/* Fallback header when badge has no data but mode=always */}
      {!hasData && mode === "always" && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Toggle pipeline details"
          aria-expanded={open}
          className="flex items-center gap-1.5 w-full px-2 py-1
                     text-vsc-text-ghost hover:text-vsc-text-secondary
                     hover:bg-vsc-toolbar/30 transition-colors duration-fast cursor-pointer rounded focus-ring"
        >
          <Icon name={open ? "chevron-down" : "chevron-right"} tokenSize="2xs" />
          <Icon name="beaker" tokenSize="2xs" className="text-vsc-text-ghost" />
          <Text size="2xs" tone="ghost">Pipeline — no data yet</Text>
        </button>
      )}
      {open && (
        <div className="ml-2 mt-0.5 border-l border-vsc-border/20 pl-1 space-y-0.5 animate-[fade-in_var(--duration-normal)_var(--ease-default)]">
          {stages.inputGate && <ErrorBoundary fallback={null}><InputGatePanel turnId={turnId} /></ErrorBoundary>}
          {stages.strategy && <ErrorBoundary fallback={null}><StrategyDashboard turnId={turnId} /></ErrorBoundary>}
          {stages.validation && <ErrorBoundary fallback={null}><ValidationPanel turnId={turnId} /></ErrorBoundary>}
          {stages.evidenceBundle && <ErrorBoundary fallback={null}><EvidenceBundleViewer turnId={turnId} /></ErrorBoundary>}
          {stages.fileActivity && <ErrorBoundary fallback={null}><CodeEditFlowWidget turnId={turnId} /></ErrorBoundary>}
          {stages.verdict && <ErrorBoundary fallback={null}><ExplainableVerdictWidget turnId={turnId} /></ErrorBoundary>}
          {stages.riskHeatmap && <ErrorBoundary fallback={null}><RiskHeatmapWidget turnId={turnId} /></ErrorBoundary>}
          {stages.driftGuard && <ErrorBoundary fallback={null}><DriftGuardIndicator turnId={turnId} /></ErrorBoundary>}
        </div>
      )}
    </div>
  );
});
