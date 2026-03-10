// ─── Model ─────────────────────────────────────────────────
export {
  closeCodeLensAtom,
  type CodeLensData,
  codeLensDataAtom,
  codeLensLoadingAtom,
  type CodeLensTarget,
  codeLensTargetAtom,
  codeLensVisibleAtom,
  openCodeLensAtom,
  toggleCodeLensAtom,
} from "./model/codeLensAtoms";
export { generateMockLensData } from "./model/mockCodeLensData";

// ─── UI ────────────────────────────────────────────────────
export { CodeLensCard, type CodeLensCardProps } from "./ui/CodeLensCard";
export { CodeLensOverlay } from "./ui/CodeLensOverlay";
export { GhostHint, type GhostHintProps } from "./ui/GhostHint";
