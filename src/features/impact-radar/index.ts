/**
 * Impact Radar — Real-time change impact prediction
 */

// ─── Model ───────────────────────────────────────────────
export {
  analyzeImpactAtom,
  clearImpactResultAtom,
  closeImpactRadarAtom,
  impactAnalysisResultAtom,
  impactBreakingNodesAtom,
  impactRadarEnabledAtom,
  impactRadarLoadingAtom,
  impactRadarVisibleAtom,
  impactSummaryAtom,
  pendingChangeAtom,
} from "./model/atoms";
export { generateMockImpact } from "./model/mockData";
export type {
  ChangeEvent,
  ImpactAnalysisResult,
  ImpactNode,
  ImpactSummary,
} from "./model/types";

// ─── UI ──────────────────────────────────────────────────
export { ImpactNodeList } from "./ui/ImpactNodeList";
export { ImpactRadarPanel } from "./ui/ImpactRadarPanel";
export { ImpactSeverityBadge } from "./ui/ImpactSeverityBadge";
