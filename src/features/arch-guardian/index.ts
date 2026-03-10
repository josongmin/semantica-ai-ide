/**
 * Architecture Guardian — Detect and visualize layer violations,
 * dependency cycles, and coupling anti-patterns in real-time.
 *
 * RFC-SYSTEM-LENS-001 §5
 */

// ─── Model ───────────────────────────────────────────────
export {
  archAnalysisAtom,
  archGuardianEnabledAtom,
  archGuardianLoadingAtom,
  archRulesAtom,
  archViolationCountAtom,
  archViolationsByFileAtom,
  dismissViolationAtom,
  scanArchitectureAtom,
  toggleRuleAtom,
} from "./model/atoms";
export {
  generateMockAnalysis,
  generateMockRules,
  MOCK_LAYERS,
  MOCK_RULES,
  MOCK_VIOLATIONS,
} from "./model/mockData";
export type {
  ArchAnalysis,
  ArchLayer,
  ArchRule,
  ArchViolationItem,
} from "./model/types";

// ─── UI ──────────────────────────────────────────────────
export { ArchGuardianPanel } from "./ui/ArchGuardianPanel";
export { LayerDiagram } from "./ui/LayerDiagram";
