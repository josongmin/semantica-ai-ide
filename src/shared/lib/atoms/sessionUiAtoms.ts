/**
 * Sub-barrel: session tab, focus, and navigation atoms.
 */

// Session tabs
export type { SessionTab } from "./sessionTabAtoms";
export {
  activeTabAtom,
  activeTabIdAtom,
  closeAllTabsAtom,
  closeOtherTabsAtom,
  closeTabAtom,
  isSessionPinnedAtom,
  newTabAtom,
  openSessionTabAtom,
  openTabsAtom,
  pinnedSessionIdsAtom,
  reorderTabsAtom,
  resetTabsAtom,
  sessionSidebarOpenAtom,
  sessionSwitcherOpenAtom,
  switchTabByIndexAtom,
  togglePinSessionAtom,
  turnTocOpenAtom,
  updateTabMetaAtom,
} from "./sessionTabAtoms";

// Navigation
export type { SettingsTab } from "./navigationAtoms";
export { settingsTabAtom } from "./navigationAtoms";
