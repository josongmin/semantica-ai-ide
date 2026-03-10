// ─── Model ──────────────────────────────────────────────────
export type { DriftFixIntent, DriftFixPayload } from "./model/agentBridgeAtoms";
export {
  buildDriftFixMessage,
  dismissDriftAgentPayloadAtom,
  driftAgentPayloadAtom,
} from "./model/agentBridgeAtoms";
export type {
  DocDriftSummary,
  DocStatus,
  DriftItem,
  DriftSeverity,
  DriftStatus,
} from "./model/docDriftAtoms";
export {
  dismissDriftAtom,
  docDriftItemsAtom,
  docDriftPanelVisibleAtom,
  docDriftScanningAtom,
  docDriftSummaryAtom,
  docStatusMapAtom,
  getDocStatusAtom,
  scanDocDriftAtom,
} from "./model/docDriftAtoms";

// ─── UI ─────────────────────────────────────────────────────
export { DocDriftPanel } from "./ui/DocDriftPanel";
export { DocStatusBadge } from "./ui/DocStatusBadge";
export { DriftItemCard } from "./ui/DriftItemCard";
export { DriftSummaryBar } from "./ui/DriftSummaryBar";
