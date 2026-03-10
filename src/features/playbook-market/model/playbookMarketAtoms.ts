/**
 * Playbook Market atoms for browsing and installing agent playbooks/skills.
 *
 * Manages playbook list with search filtering and install state.
 */
import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { PlaybookEntry } from "../../../shared/protocol";

// ─── Core Store ──────────────────────────────────────────────

/** All playbook market entries */
export const playbookMarketAtom = atom<readonly PlaybookEntry[]>([]);

/** Write-only: set playbook market from a serverEvent payload */
export const setPlaybookMarketAtom = atom(null, (_get, set, entries: readonly PlaybookEntry[]) => {
  set(playbookMarketAtom, entries);
});

// ─── Search & Filter ─────────────────────────────────────────

/** Current search query for playbook market */
export const playbookSearchQueryAtom = atom("");

/** Currently selected category filter (empty string = all) */
export const playbookCategoryFilterAtom = atom("");

// ─── Derived Atoms ───────────────────────────────────────────

/** Derived: all unique categories from the market */
export const playbookCategoriesAtom = atom((get) => {
  const entries = get(playbookMarketAtom);
  const cats = new Set<string>();
  for (const entry of entries) {
    if (entry.category) {
      cats.add(entry.category);
    }
  }
  return [...cats].sort();
});

/** Derived: filtered playbooks by search query and category */
export const filteredPlaybooksAtom = atom((get) => {
  const entries = get(playbookMarketAtom);
  const query = get(playbookSearchQueryAtom).toLowerCase().trim();
  const category = get(playbookCategoryFilterAtom);

  return entries.filter((entry) => {
    const matchesQuery =
      !query ||
      entry.name.toLowerCase().includes(query) ||
      entry.description.toLowerCase().includes(query) ||
      entry.author.toLowerCase().includes(query);

    const matchesCategory = !category || entry.category === category;

    return matchesQuery && matchesCategory;
  });
});

/** Write-only: reset playbook market state */
export const resetPlaybookMarketStoreAtom = atom(null, (_get, set) => {
  set(playbookMarketAtom, []);
  set(playbookSearchQueryAtom, "");
  set(playbookCategoryFilterAtom, "");
});

registerResetAtom(resetPlaybookMarketStoreAtom);
