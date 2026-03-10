/**
 * Self-Explaining Code — Symbol existence reasoning
 */

// ─── Model
export {
  closeSelfExplainAtom,
  openSelfExplainAtom,
  selfExplainDataAtom,
  selfExplainLoadingAtom,
  selfExplainVisibleAtom,
} from "./model/atoms";
export { generateMockExplanation } from "./model/mockData";
export type { SelfExplanation } from "./model/types";

// ─── UI
export { SelfExplainPanel } from "./ui/SelfExplainPanel";
export { WhyChain } from "./ui/WhyChain";
