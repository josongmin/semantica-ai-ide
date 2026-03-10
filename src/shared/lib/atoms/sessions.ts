/**
 * Sub-barrel: Session tab & persistence atoms.
 *
 * Usage: import { openSessionTabAtom } from "~shared/lib/atoms/sessions"
 */

// Session persistence
export {
  persistedSessionIdAtom,
  persistSessionIdAtom,
  restorePersistedSessionAtom,
} from "./sessionPersistenceAtoms";

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
