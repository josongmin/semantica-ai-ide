import { createStateAtomSet } from "../../../shared/lib";

// ─── Pipeline Mode ──────────────────────────────────────

export type PipelineVisibility = "auto" | "always" | "compact" | "off";

export const [pipelineModeAtom, setPipelineModeAtom, resetPipelineModeAtom] =
  createStateAtomSet<PipelineVisibility>("auto");

// ─── Stage Visibility ───────────────────────────────────

export type PipelineStageId =
  | "inputGate"
  | "failClosed"
  | "strategy"
  | "validation"
  | "evidenceBundle"
  | "decisionTrace"
  | "fileActivity"
  | "verdict"
  | "riskHeatmap"
  | "sideEffectBudget"
  | "driftGuard";

export type PipelineStageVisibility = Readonly<Record<PipelineStageId, boolean>>;

export interface PipelineStageInfo {
  id: PipelineStageId;
  label: string;
  /** Whether a dedicated widget exists for this stage */
  hasWidget: boolean;
}

export const ALL_STAGES: readonly PipelineStageInfo[] = [
  { id: "inputGate", label: "Input Gate", hasWidget: true },
  { id: "failClosed", label: "Fail Closed", hasWidget: false },
  { id: "strategy", label: "Strategy", hasWidget: true },
  { id: "validation", label: "Validation", hasWidget: true },
  { id: "evidenceBundle", label: "Evidence Bundle", hasWidget: true },
  { id: "decisionTrace", label: "Decision Trace", hasWidget: false },
  { id: "fileActivity", label: "파일 읽기/수정 흐름", hasWidget: true },
  { id: "verdict", label: "Verdict", hasWidget: true },
  { id: "riskHeatmap", label: "Risk Heatmap", hasWidget: true },
  { id: "sideEffectBudget", label: "Side Effect Budget", hasWidget: false },
  { id: "driftGuard", label: "Drift Guard", hasWidget: true },
];

const ALL_STAGES_ON: PipelineStageVisibility = {
  inputGate: true,
  failClosed: true,
  strategy: true,
  validation: true,
  evidenceBundle: true,
  decisionTrace: true,
  fileActivity: true,
  verdict: true,
  riskHeatmap: true,
  sideEffectBudget: true,
  driftGuard: true,
};

export const [pipelineStageVisibilityAtom, setPipelineStageVisibilityAtom, resetPipelineStageVisibilityAtom] =
  createStateAtomSet<PipelineStageVisibility>(ALL_STAGES_ON);
