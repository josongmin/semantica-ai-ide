// ─── Impact Preview Feature ─────────────────────────────
// Barrel export

// Model
export type {
  AffectedPath,
  ImpactPhase,
  ImpactPhaseStatus,
  ImpactResult,
  ImpactScoreCard as ImpactScoreCardData,
  ImpactSeverity,
} from "./model/impactPreviewAtoms";
export {
  clearImpactAtom,
  IMPACT_PHASES,
  impactLoadingAtom,
  impactPhasesAtom,
  impactPhasesDoneAtom,
  impactPreviewVisibleAtom,
  impactProgressAtom,
  impactResultAtom,
  PHASE_LABELS,
  runImpactAnalysisAtom,
} from "./model/impactPreviewAtoms";

// UI
export { AffectedPathRow } from "./ui/AffectedPathRow";
export { ImpactPreviewPanel } from "./ui/ImpactPreviewPanel";
export { ImpactScoreCard } from "./ui/ImpactScoreCard";
export { PhaseProgress } from "./ui/PhaseProgress";
