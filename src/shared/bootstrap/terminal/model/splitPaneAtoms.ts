/**
 * Split pane & tab group atoms
 *
 * Model: each "tab" is a group of 1–2 sessions displayed together.
 *   Tab 1: [session-a]               → single pane
 *   Tab 2: [session-b, session-c]    → split pane
 *   Tab 3: [session-d]               → single pane
 *
 * Clicking Tab 2 shows session-b and session-c side-by-side.
 * Split adds a new session to the current tab.
 */
import { atom } from "jotai";

import type { TerminalSessionId } from "~shared/protocol/types/core";

import { activeTerminalSessionIdAtom, terminalSessionOrderAtom } from "./sessionAtoms";

// ─── State ─────────────────────────────────────────────────

/** Each inner array = one tab group (1–2 session IDs) */
export const tabGroupsAtom = atom<readonly (readonly TerminalSessionId[])[]>([]);

/** Which tab is active (index into tabGroupsAtom) */
export const activeTabIndexAtom = atom<number>(0);

/** Session IDs currently visible in the viewport (synced from active tab group) */
export const visiblePaneIdsAtom = atom<readonly TerminalSessionId[]>([]);

// ─── Derived ───────────────────────────────────────────────

/** Active tab group's session IDs */
export const activeTabSessionsAtom = atom((get) => {
  const groups = get(tabGroupsAtom);
  const idx = get(activeTabIndexAtom);
  return groups[idx] ?? [];
});

/** Whether the active tab is in split mode */
export const isSplitModeAtom = atom((get) => {
  const sessions = get(activeTabSessionsAtom);
  return sessions.length > 1;
});

/** Check if a specific session is currently visible in a pane */
export const isSessionVisibleAtom = atom(
  (get) => (sessionId: TerminalSessionId) => get(visiblePaneIdsAtom).includes(sessionId),
);

// ─── Tab Actions ───────────────────────────────────────────

/** Create a new tab with a single session */
export const createTabAtom = atom(null, (get, set, sessionId: TerminalSessionId) => {
  const groups = get(tabGroupsAtom);
  set(tabGroupsAtom, [...groups, [sessionId]]);
  set(activeTabIndexAtom, groups.length);
  set(visiblePaneIdsAtom, [sessionId]);
  set(activeTerminalSessionIdAtom, sessionId);
});

/** Select a tab by index — restores that tab's split state */
export const selectTabAtom = atom(null, (get, set, index: number) => {
  const groups = get(tabGroupsAtom);
  const sessionIds = groups[index];
  if (sessionIds == null || sessionIds.length === 0) return;
  set(activeTabIndexAtom, index);
  set(visiblePaneIdsAtom, sessionIds);
  set(activeTerminalSessionIdAtom, sessionIds[0] ?? null);
});

/** Close a tab group (caller is responsible for removing sessions) */
export const closeTabAtom = atom(null, (get, set, index: number) => {
  const groups = get(tabGroupsAtom);
  if (index < 0 || index >= groups.length) return;

  const next = [...groups.slice(0, index), ...groups.slice(index + 1)];
  set(tabGroupsAtom, next);

  if (next.length === 0) {
    set(activeTabIndexAtom, 0);
    set(visiblePaneIdsAtom, []);
    set(activeTerminalSessionIdAtom, null);
    return;
  }

  const activeIdx = get(activeTabIndexAtom);
  const newIdx = activeIdx >= next.length ? next.length - 1 : Math.min(activeIdx, index);
  set(activeTabIndexAtom, newIdx);
  const sessionIds = next[newIdx];
  if (sessionIds == null || sessionIds.length === 0) return;
  set(visiblePaneIdsAtom, sessionIds);
  set(activeTerminalSessionIdAtom, sessionIds[0] ?? null);
});

// ─── Split Actions (within active tab) ─────────────────────

/** Add a session to the current tab (split) */
export const splitTabAtom = atom(null, (get, set, sessionId: TerminalSessionId) => {
  const groups = get(tabGroupsAtom);
  const idx = get(activeTabIndexAtom);
  const group = groups[idx];
  if (!group || idx < 0 || idx >= groups.length || group.length >= 2) return; // Max 2 panes per tab

  const updated = groups.map((g, i) => (i === idx ? [...g, sessionId] : g));
  set(tabGroupsAtom, updated);
  const newSessions = updated[idx];
  if (newSessions) set(visiblePaneIdsAtom, newSessions);
});

/** Collapse split in current tab — keep only the focused session */
export const unsplitTabAtom = atom(null, (get, set) => {
  const groups = get(tabGroupsAtom);
  const idx = get(activeTabIndexAtom);
  const group = groups[idx];
  if (!group || idx < 0 || idx >= groups.length || group.length <= 1) return;

  // Keep the currently focused session
  const activeId = get(activeTerminalSessionIdAtom);
  const fallback = group[0] ?? group[1];
  if (!fallback) return;
  const keep: TerminalSessionId =
    activeId != null && group.includes(activeId) ? activeId : fallback;
  // Return the removed session ID so caller can clean it up
  const removed = group.filter((id) => id !== keep);

  const updated = groups.map((g, i) => (i === idx ? [keep] : g));
  set(tabGroupsAtom, updated);
  set(visiblePaneIdsAtom, [keep]);
  set(activeTerminalSessionIdAtom, keep);

  return removed;
});

/** Remove a specific session from a tab group (e.g. when session exits) */
export const removeSessionFromTabAtom = atom(null, (get, set, sessionId: TerminalSessionId) => {
  const groups = get(tabGroupsAtom);

  const updated = groups.map((g) => g.filter((id) => id !== sessionId)).filter((g) => g.length > 0);

  set(tabGroupsAtom, updated);

  const tabRemoved = updated.length < groups.length;
  if (tabRemoved) {
    const activeIdx = get(activeTabIndexAtom);
    const newIdx = Math.min(activeIdx, Math.max(0, updated.length - 1));
    set(activeTabIndexAtom, newIdx);
    const targetGroup = updated.length > 0 ? updated[newIdx] : undefined;
    // Reframe to satisfy type narrowing: when tabRemoved, remaining groups are non-empty
    set(visiblePaneIdsAtom, targetGroup ?? []);
    set(activeTerminalSessionIdAtom, targetGroup?.[0] ?? null);
  } else {
    // Tab still exists but may have lost a split pane
    const idx = get(activeTabIndexAtom);
    const paneIds = updated[idx];
    if (paneIds) set(visiblePaneIdsAtom, paneIds);
  }
});

// ─── Legacy compat ──────────────────────────────────────────

/** @deprecated Use selectTabAtom instead */
export const focusPaneAtom = atom(null, (_get, set, sessionId: TerminalSessionId) => {
  set(visiblePaneIdsAtom, [sessionId]);
  set(activeTerminalSessionIdAtom, sessionId);
});

/** @deprecated Use createTabAtom instead */
export const initVisiblePaneAtom = atom(null, (get, set, sessionId: TerminalSessionId) => {
  const current = get(visiblePaneIdsAtom);
  if (current.length === 0) {
    set(visiblePaneIdsAtom, [sessionId]);
  }
});

/** @deprecated Use splitTabAtom instead */
export const splitPaneAtom = atom(null, (get, set, sessionId: TerminalSessionId) => {
  const current = get(visiblePaneIdsAtom);
  if (current.includes(sessionId)) return;
  set(visiblePaneIdsAtom, [...current, sessionId]);
});

/** @deprecated */
export const unsplitPaneAtom = atom(null, (get, set, sessionId: TerminalSessionId) => {
  const current = get(visiblePaneIdsAtom);
  if (current.length <= 1) return;
  const next = current.filter((id) => id !== sessionId);
  set(visiblePaneIdsAtom, next);
  if (get(activeTerminalSessionIdAtom) === sessionId) {
    set(activeTerminalSessionIdAtom, next[next.length - 1] ?? null);
  }
});

/** @deprecated */
export const syncVisiblePanesAtom = atom(null, (get, set) => {
  const allIds = new Set(get(terminalSessionOrderAtom));
  const visible = get(visiblePaneIdsAtom);
  const cleaned = visible.filter((id) => allIds.has(id));
  if (cleaned.length === 0) {
    const active = get(activeTerminalSessionIdAtom);
    if (active && allIds.has(active)) {
      set(visiblePaneIdsAtom, [active]);
    } else {
      const firstId = get(terminalSessionOrderAtom)[0];
      if (firstId) set(visiblePaneIdsAtom, [firstId]);
    }
    return;
  }
  if (cleaned.length !== visible.length) {
    set(visiblePaneIdsAtom, cleaned);
  }
});

/** @deprecated Use selectPaneAtom (kept for external refs) */
export const selectPaneAtom = atom(null, (_get, set, sessionId: TerminalSessionId) => {
  set(visiblePaneIdsAtom, [sessionId]);
  set(activeTerminalSessionIdAtom, sessionId);
});
