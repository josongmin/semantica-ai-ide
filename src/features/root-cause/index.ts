/**
 * Root Cause — Causal chain analysis and visualization
 */

// ─── Model ───────────────────────────────────────────────
export {
  causalChainAtom,
  clearRootCauseAtom,
  closeRootCauseAtom,
  rootCauseAnalysisAtom,
  rootCauseLoadingAtom,
  rootCauseVisibleAtom,
  startRootCauseAtom,
  topCauseAtom,
} from "./model/atoms";
export { generateMockRootCause } from "./model/mockData";
export type { CauseCandidate, RootCauseAnalysis } from "./model/types";

// ─── UI ──────────────────────────────────────────────────
export { CausalChainGraph } from "./ui/CausalChainGraph";
export { CauseCandidateCard } from "./ui/CauseCandidate";
export { EvidenceBundle } from "./ui/EvidenceBundle";
export { RootCausePanel } from "./ui/RootCausePanel";
