/**
 * Bookmark atoms — feature-layer state for turn bookmarks.
 *
 * Manages the set of bookmarked turn IDs, their labels, drawer visibility,
 * and the active filter.
 */
import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { BookmarkLabel, TurnId } from "../../../shared/protocol";

// ─── Bookmark Filter ─────────────────────────────────────

export type BookmarkFilter = "all" | BookmarkLabel;

/** Current bookmark drawer filter */
export const bookmarkFilterAtom = atom<BookmarkFilter>("all");

// ─── Bookmarked Turn IDs ─────────────────────────────────

/** Set of bookmarked turn IDs (source of truth) */
export const bookmarkedTurnIdsAtom = atom<ReadonlySet<TurnId>>(new Set<TurnId>());

/** Map of turn ID → bookmark label */
export const bookmarkLabelsAtom = atom<ReadonlyMap<TurnId, BookmarkLabel>>(
  new Map<TurnId, BookmarkLabel>(),
);

/** Whether the bookmark drawer is open */
export const bookmarkDrawerOpenAtom = atom(false);

/** Write-only: toggle a bookmark on a turn */
export const toggleBookmarkAtom = atom(
  null,
  (get, set, payload: { turn_id: TurnId; bookmarked: boolean; bookmark_label?: BookmarkLabel }) => {
    const ids = get(bookmarkedTurnIdsAtom);
    const labels = get(bookmarkLabelsAtom);
    const nextIds = new Set(ids);
    const nextLabels = new Map(labels);

    if (payload.bookmarked) {
      nextIds.add(payload.turn_id);
      if (payload.bookmark_label) {
        nextLabels.set(payload.turn_id, payload.bookmark_label);
      }
    } else {
      nextIds.delete(payload.turn_id);
      nextLabels.delete(payload.turn_id);
    }

    set(bookmarkedTurnIdsAtom, nextIds);
    set(bookmarkLabelsAtom, nextLabels);
  },
);

/** Write-only: reset bookmark store */
export const resetBookmarkStoreAtom = atom(null, (_get, set) => {
  set(bookmarkedTurnIdsAtom, new Set<TurnId>());
  set(bookmarkLabelsAtom, new Map<TurnId, BookmarkLabel>());
  set(bookmarkDrawerOpenAtom, false);
  set(bookmarkFilterAtom, "all");
});

registerResetAtom(resetBookmarkStoreAtom);
