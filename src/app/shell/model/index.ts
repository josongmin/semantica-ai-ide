// ─── Shell State (Atoms) ────────────────────────────────
export type { LayoutPreset, ShellLayoutState, SplitDirection, SurfaceId } from "./shellAtoms";
export {
  activeSidebarViewAtom,
  activeSurfaceAtom,
  activeTrayViewAtom,
  agentPanelVisibleAtom,
  agentPanelWidthAtom,
  applyLayoutPresetAtom,
  focusModeAtom,
  resetShellLayoutAtom,
  secondarySurfaceAtom,
  shellLayoutAtom,
  sidebarVisibleAtom,
  sidebarWidthAtom,
  splitDirectionAtom,
  splitRatioAtom,
  toggleAgentPanelAtom,
  toggleFocusModeAtom,
  toggleSidebarAtom,
  toggleSplitAtom,
  toggleTrayAtom,
  toggleZenModeAtom,
  trayHeightAtom,
  trayMaximizedAtom,
  trayVisibleAtom,
  zenModeAtom,
} from "./shellAtoms";

// ─── Zone Manager (persistence) ─────────────────────────
export { clearShellLayout, loadShellLayout, saveShellLayout } from "./ZoneManager";

// ─── View Registry ──────────────────────────────────────
export type {
  FrameSlot,
  PersistenceScope,
  ViewDefinition,
  ViewKind,
} from "./viewRegistry";
export { getAllViews, getViewById, getViewsForFrame, registerView } from "./viewRegistry";

// ─── Intent Router ──────────────────────────────────────
export type { IntentAction } from "./intentRouter";
export { dispatchIntentAtom } from "./intentRouter";
