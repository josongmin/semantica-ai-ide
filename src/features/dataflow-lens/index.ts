/**
 * Dataflow Lens — Value journey visualization
 *
 * Shows the path of data from source (user input, DB query, config)
 * through transformations (validate, sanitize, encode) to sink
 * (API response, DB write, log). Includes taint tracking and
 * security risk assessment.
 */

// ─── Model ──────────────────────────────────────────────
export {
  clearHighlightAtom,
  closeDataflowAtom,
  dataflowAnalysisAtom,
  dataflowLoadingAtom,
  dataflowVisibleAtom,
  highlightedPathIdAtom,
  highlightPathAtom,
  openDataflowAtom,
} from "./model/atoms";
export { generateMockDataflow } from "./model/mockData";
export type {
  DataflowAnalysis,
  DataflowNode,
  DataflowPath,
} from "./model/types";

// ─── UI ─────────────────────────────────────────────────
export { DataflowOverlay } from "./ui/DataflowOverlay";
export { DataflowPanel } from "./ui/DataflowPanel";
export { DataflowPathView } from "./ui/DataflowPathView";
