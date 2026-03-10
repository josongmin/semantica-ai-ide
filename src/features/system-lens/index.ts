/**
 * System Lens — Live system information overlay
 *
 * Gutter badges showing callers/callees/impact per symbol.
 * Hover cards with detailed analysis data.
 * Mini graph for quick visual exploration.
 */

// ─── Model ───────────────────────────────────────────────
export {
  activeLensBadgesAtom,
  activeLensKindsAtom,
  clearLensHoverAtom,
  closeMiniGraphAtom,
  lensBadgeMapAtom,
  lensDetailDataAtom,
  lensDetailLoadingAtom,
  lensHoverTargetAtom,
  lensMiniGraphCenterAtom,
  lensMiniGraphVisibleAtom,
  loadLensBadgesAtom,
  loadLensDetailAtom,
  openMiniGraphAtom,
  systemLensEnabledAtom,
  toggleLensKindAtom,
} from "./model/atoms";
export { generateMockBadges, generateMockDetail } from "./model/mockData";
export type { ImpactItem, LensBadgeData, LensDetailData } from "./model/types";

// ─── Lib ─────────────────────────────────────────────────
export { useSystemLensActions } from "./lib/useSystemLensActions";
export { useSystemLensBootstrap } from "./lib/useSystemLensBootstrap";

// ─── UI ──────────────────────────────────────────────────
export { LensGutterBadge } from "./ui/LensGutterBadge";
export { LensHoverCard } from "./ui/LensHoverCard";
export { LensMiniGraph } from "./ui/LensMiniGraph";
export { LensOverlay } from "./ui/LensOverlay";
