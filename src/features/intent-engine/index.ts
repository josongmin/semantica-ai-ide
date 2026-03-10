/**
 * Intent Engine — Natural language intent to plan execution
 */

// ─── Model
export {
  activeIntentSessionAtom,
  cancelIntentAtom,
  closeIntentBarAtom,
  executePlanAtom,
  intentAnalysisAtom,
  intentBarVisibleAtom,
  intentHistoryAtom,
  intentInputAtom,
  intentLoadingAtom,
  intentPlanAtom,
  openIntentBarAtom,
  submitIntentAtom,
} from "./model/atoms";
export { generateMockAnalysis, generateMockPlan } from "./model/mockData";
export type {
  Intent,
  IntentAnalysis,
  IntentPlan,
  IntentPlanStep,
  IntentRisk,
  IntentSession,
  IntentTarget,
} from "./model/types";

// ─── UI
export { IntentBar } from "./ui/IntentBar";
export { IntentPlanPreview } from "./ui/IntentPlanPreview";
export { IntentTimeline } from "./ui/IntentTimeline";
