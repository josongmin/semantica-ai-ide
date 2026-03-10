import { atom } from "jotai";

import type { SessionId, SessionListEntry, SessionStatus } from "../../protocol";
import { getVscodeApi } from "../vscodeApi";

// ─── Session Tab Types ──────────────────────────────────

export interface SessionTab {
  readonly session_id: SessionId;
  readonly title: string;
  readonly status: SessionStatus;
  readonly model_label?: string;
  readonly cost_usd?: number;
  readonly turn_count?: number;
  /** Whether this tab's session data is loaded in memory */
  readonly loaded: boolean;
}

// ─── Session Tab Atoms ──────────────────────────────────

/** Ordered list of open session tabs */
export const openTabsAtom = atom<readonly SessionTab[]>([]);

/** Currently active (visible) tab session ID */
export const activeTabIdAtom = atom<SessionId | null>(null);

/** Pinned session IDs (persist across sessions) */
export const pinnedSessionIdsAtom = atom<ReadonlySet<SessionId>>(new Set<SessionId>());

/** Session sidebar visibility */
export const sessionSidebarOpenAtom = atom(false);

/** Session switcher (Cmd+K) visibility */
export const sessionSwitcherOpenAtom = atom(false);

/** Turn table-of-contents visibility */
export const turnTocOpenAtom = atom(false);

// ─── Derived Atoms ──────────────────────────────────────

/** Active tab data (derived) */
export const activeTabAtom = atom<SessionTab | null>((get) => {
  const id = get(activeTabIdAtom);
  if (!id) return null;
  return get(openTabsAtom).find((t) => t.session_id === id) ?? null;
});

/** Check if a session is pinned */
export const isSessionPinnedAtom = atom((get) => {
  const pinned = get(pinnedSessionIdsAtom);
  return (id: SessionId) => pinned.has(id);
});

// ─── Write Atoms ────────────────────────────────────────

/** Open a session in a tab (or switch to it if already open) */
export const openSessionTabAtom = atom(
  null,
  (get, set, entry: SessionListEntry | SessionTab) => {
    const tabs = get(openTabsAtom);
    const existing = tabs.find((t) => t.session_id === entry.session_id);

    if (existing) {
      // Just switch to it
      set(activeTabIdAtom, entry.session_id);
    } else {
      // Add new tab
      const newTab: SessionTab = {
        session_id: entry.session_id,
        title: entry.title,
        status: entry.status,
        model_label: "model_label" in entry ? (entry as SessionListEntry).model_label : undefined,
        cost_usd: entry.cost_usd,
        turn_count: "turn_count" in entry ? (entry as SessionListEntry).turn_count : undefined,
        loaded: false,
      };
      set(openTabsAtom, [...tabs, newTab]);
      set(activeTabIdAtom, entry.session_id);
    }

    // Tell extension host to resume this session
    getVscodeApi().postMessage({
      type: "RESUME_SESSION",
      session_id: entry.session_id,
    });
  },
);

/** Close a tab by session ID */
export const closeTabAtom = atom(null, (get, set, sessionId: SessionId) => {
  const tabs = get(openTabsAtom);
  const idx = tabs.findIndex((t) => t.session_id === sessionId);
  if (idx === -1) return;

  const nextTabs = tabs.filter((t) => t.session_id !== sessionId);
  set(openTabsAtom, nextTabs);

  // If closing the active tab, switch to adjacent
  if (get(activeTabIdAtom) === sessionId) {
    if (nextTabs.length > 0) {
      const nextIdx = Math.min(idx, nextTabs.length - 1);
      const nextTab = nextTabs[nextIdx] as SessionTab | undefined;
      if (nextTab === undefined) return;
      set(activeTabIdAtom, nextTab.session_id);
      getVscodeApi().postMessage({
        type: "RESUME_SESSION",
        session_id: nextTab.session_id,
      });
    } else {
      set(activeTabIdAtom, null);
    }
  }
});

/** Reorder tabs (drag & drop) */
export const reorderTabsAtom = atom(
  null,
  (get, set, payload: { fromIndex: number; toIndex: number }) => {
    const tabs = [...get(openTabsAtom)];
    const [moved] = tabs.splice(payload.fromIndex, 1);
    if (moved === undefined) return;
    tabs.splice(payload.toIndex, 0, moved);
    set(openTabsAtom, tabs);
  },
);

/** Update a tab's metadata (e.g., when session meta changes) */
export const updateTabMetaAtom = atom(
  null,
  (get, set, payload: { session_id: SessionId; updates: Partial<SessionTab> }) => {
    const tabs = get(openTabsAtom);
    set(
      openTabsAtom,
      tabs.map((t) =>
        t.session_id === payload.session_id ? { ...t, ...payload.updates } : t,
      ),
    );
  },
);

/** Pin/unpin a session */
export const togglePinSessionAtom = atom(null, (get, set, sessionId: SessionId) => {
  const pinned = get(pinnedSessionIdsAtom);
  const next = new Set(pinned);
  if (next.has(sessionId)) {
    next.delete(sessionId);
  } else {
    next.add(sessionId);
  }
  set(pinnedSessionIdsAtom, next);
});

/** Create a new tab with a new session */
export const newTabAtom = atom(null, (_get, _set) => {
  getVscodeApi().postMessage({ type: "NEW_SESSION" });
  // The new session will be added via SET_SESSION_META event
});

/** Switch to tab by index (Cmd+1~9) */
export const switchTabByIndexAtom = atom(null, (get, set, index: number) => {
  const tabs = get(openTabsAtom);
  if (index >= 0 && index < tabs.length) {
    const tab = tabs[index] as SessionTab | undefined;
    if (tab === undefined) return;
    set(activeTabIdAtom, tab.session_id);
    getVscodeApi().postMessage({
      type: "RESUME_SESSION",
      session_id: tab.session_id,
    });
  }
});

/** Close all tabs except the given session (batch operation) */
export const closeOtherTabsAtom = atom(null, (get, set, keepSessionId: SessionId) => {
  const tabs = get(openTabsAtom);
  const kept = tabs.filter((t) => t.session_id === keepSessionId);
  set(openTabsAtom, kept);
  if (get(activeTabIdAtom) !== keepSessionId) {
    set(activeTabIdAtom, kept.length > 0 ? keepSessionId : null);
    if (kept.length > 0) {
      getVscodeApi().postMessage({ type: "RESUME_SESSION", session_id: keepSessionId });
    }
  }
});

/** Close all tabs (batch operation) */
export const closeAllTabsAtom = atom(null, (_get, set) => {
  set(openTabsAtom, []);
  set(activeTabIdAtom, null);
});

/** Reset tab state (on full reset) */
export const resetTabsAtom = atom(null, (_get, set) => {
  // Don't reset tabs on session switch — tabs persist across sessions
  // Only reset sidebar/switcher state
  set(sessionSwitcherOpenAtom, false);
  set(turnTocOpenAtom, false);
});
