import { atom } from "jotai";

// ─── Review State ───────────────────────────────────────────

/** Review changes panel visibility */
export const reviewChangesPanelVisibleAtom = atom(false);

/** Review changes panel: currently expanded file path */
export const reviewExpandedFileAtom = atom<string | null>(null);

/** Review changes panel: search query for filename filtering */
export const reviewSearchQueryAtom = atom("");
