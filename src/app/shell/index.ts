// ─── Components ─────────────────────────────────────────
export { KeyboardShortcutOverlay, shortcutOverlayVisibleAtom } from "./KeyboardShortcutOverlay";
export { ResizeHandle } from "./Resizable";
export { ShellLayout } from "./ShellLayout";
export { ShellStatusBar } from "./ShellStatusBar";
export { ZonePanelTabs } from "./ZonePanelTabs";

// ─── Frames ─────────────────────────────────────────────
export { AgentFrame } from "./frames/AgentFrame";
export { FloatingDock } from "./frames/FloatingDock";
export { FloatingFrame } from "./frames/FloatingFrame";
export { FloatingLayer } from "./frames/FloatingLayer";
export { SidebarFrame } from "./frames/SidebarFrame";
export { TitleBar } from "./frames/TitleBar";
export { TrayFrame } from "./frames/TrayFrame";

// ─── Hooks ──────────────────────────────────────────────
export type { IntentKind } from "./useIntentRouter";
export {
  activeIntentAtom,
  clearIntentAtom,
  declareIntentAtom,
  useIntentRouter,
} from "./useIntentRouter";
export { useLayoutPersistence } from "./useLayoutPersistence";
export { useShellKeyboard } from "./useShellKeyboard";

// ─── Model (atoms, registry, persistence) ───────────────
export type {
  LayoutPreset,
  ShellLayoutState,
  SplitDirection,
  SurfaceId,
} from "./model";
export {
  activeSidebarViewAtom,
  activeSurfaceAtom,
  activeTrayViewAtom,
  agentPanelVisibleAtom,
  agentPanelWidthAtom,
  applyLayoutPresetAtom,
  clearShellLayout,
  focusModeAtom,
  loadShellLayout,
  saveShellLayout,
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
  trayHeightAtom,
  trayMaximizedAtom,
  trayVisibleAtom,
} from "./model";
