/**
 * Navigate menu action handlers.
 *
 * Turn navigation reads from atom state (not DOM).
 * Surface history uses browser-style back/forward stack.
 */
import { turnOrderSortedAtom } from "~entities/message";

import { bookmarkDrawerOpenAtom, clearFocusedTurnAtom, focusedTurnIdAtom } from "../../../shared/lib";
import { conversationSearchOpenAtom } from "../../../shared/lib/atoms/dialogAtoms";
import {
  goBackAtom,
  goForwardAtom,
} from "../../../shared/lib/atoms/navigationHistoryAtoms";
import { registerMenuAction } from "../actionRegistry";
import { ACTION_IDS } from "../types";

// ── Turn Navigation (prev / next) ──

function navigateTurn(store: Parameters<Parameters<typeof registerMenuAction>[1]>[0], delta: -1 | 1) {
  const turns = store.get(turnOrderSortedAtom);
  if (turns.length === 0) return;

  const focused = store.get(focusedTurnIdAtom);
  let currentIdx: number;

  if (focused) {
    const idx = turns.indexOf(focused);
    // Defensive: if stale focusedTurnId not in list, treat as boundary
    if (idx >= 0) {
      currentIdx = idx;
    } else {
      currentIdx = delta === -1 ? 0 : turns.length - 1;
    }
  } else {
    // No focus — start from end for prev, start for next
    currentIdx = delta === -1 ? turns.length : -1;
  }

  const nextIdx = Math.max(0, Math.min(turns.length - 1, currentIdx + delta));
  const targetId = turns[nextIdx];
  if (!targetId) return;

  store.set(focusedTurnIdAtom, targetId);
  store.set(clearFocusedTurnAtom);
  window.dispatchEvent(new CustomEvent("scroll-to-turn", { detail: { turnId: targetId } }));
}

registerMenuAction(ACTION_IDS.NAV_PREV_TURN, (store) => navigateTurn(store, -1));
registerMenuAction(ACTION_IDS.NAV_NEXT_TURN, (store) => navigateTurn(store, 1));

// ── Go To Turn (opens search overlay for turn jump) ──
registerMenuAction(ACTION_IDS.NAV_GO_TO_TURN, (store) => {
  store.set(conversationSearchOpenAtom, true);
});

// ── Go To File Change ──
registerMenuAction(ACTION_IDS.NAV_GO_TO_FILE_CHANGE, async (store) => {
  const { reviewChangesPanelVisibleAtom } = await import("../../../shared/lib/atoms/panelAtoms");
  store.set(reviewChangesPanelVisibleAtom, true);
});

// ── Go To Bookmark ──
registerMenuAction(ACTION_IDS.NAV_GO_TO_BOOKMARK, (store) => {
  store.set(bookmarkDrawerOpenAtom, true);
});

// ── Quick File Open ──
registerMenuAction(ACTION_IDS.NAV_QUICK_FILE_OPEN, async (store) => {
  const { filePickerOpenAtom } = await import("../../../shared/lib/atoms/uiAtoms");
  store.set(filePickerOpenAtom, true);
});

// ── Search Symbols ──
registerMenuAction(ACTION_IDS.NAV_SEARCH_SYMBOLS, async (store) => {
  const { symbolPanelVisibleAtom } = await import("../../../shared/lib/atoms/uiAtoms");
  store.set(symbolPanelVisibleAtom, true);
});

// ── Surface History (back / forward) ──
registerMenuAction(ACTION_IDS.NAV_BACK, (store) => {
  store.set(goBackAtom);
});

registerMenuAction(ACTION_IDS.NAV_FORWARD, (store) => {
  store.set(goForwardAtom);
});
