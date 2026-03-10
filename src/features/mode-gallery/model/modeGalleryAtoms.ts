/**
 * Mode Gallery atoms for browsing and installing community workflow modes.
 *
 * Manages mode list with search, category filtering, and install state.
 */
import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { ModeEntry } from "../../../shared/protocol";

// ─── Core Store ──────────────────────────────────────────────

/** All mode gallery entries */
export const modeGalleryAtom = atom<readonly ModeEntry[]>([]);

/** Write-only: set mode gallery from a serverEvent payload */
export const setModeGalleryAtom = atom(null, (_get, set, entries: readonly ModeEntry[]) => {
  set(modeGalleryAtom, entries);
});

// ─── Search & Filter ─────────────────────────────────────────

/** Current search query for mode gallery */
export const modeSearchQueryAtom = atom("");

/** Currently selected category filter (empty string = all) */
export const modeCategoryFilterAtom = atom("");

// ─── Derived Atoms ───────────────────────────────────────────

/** Derived: all unique categories from the gallery */
export const modeCategoriesAtom = atom((get) => {
  const entries = get(modeGalleryAtom);
  const cats = new Set<string>();
  for (const entry of entries) {
    for (const cat of entry.categories) {
      cats.add(cat);
    }
  }
  return [...cats].sort();
});

/** Derived: filtered modes by search query and category */
export const filteredModesAtom = atom((get) => {
  const entries = get(modeGalleryAtom);
  const query = get(modeSearchQueryAtom).toLowerCase().trim();
  const category = get(modeCategoryFilterAtom);

  return entries.filter((entry) => {
    const matchesQuery =
      !query ||
      entry.name.toLowerCase().includes(query) ||
      entry.description.toLowerCase().includes(query) ||
      entry.author.toLowerCase().includes(query);

    const matchesCategory = !category || entry.categories.includes(category);

    return matchesQuery && matchesCategory;
  });
});

/** Write-only: reset mode gallery state */
export const resetModeGalleryStoreAtom = atom(null, (_get, set) => {
  set(modeGalleryAtom, []);
  set(modeSearchQueryAtom, "");
  set(modeCategoryFilterAtom, "");
});

registerResetAtom(resetModeGalleryStoreAtom);
