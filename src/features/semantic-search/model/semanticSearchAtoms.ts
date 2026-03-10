/**
 * Semantic Search Atoms
 *
 * Jotai state management for the semantic search overlay.
 * Supports three search modes: semantic (AI), text (substring), symbol (code symbols).
 */

import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import { generateMockResults } from "./mockSemanticData";

// ─── Types ──────────────────────────────────────────────────

export type SearchMode = "semantic" | "text" | "symbol";

export interface SemanticSearchResult {
  readonly id: string;
  readonly symbolName: string;
  readonly filePath: string;
  readonly line: number;
  readonly summary: string;
  readonly matchScore: number;
  readonly category: string;
}

export interface SemanticSearchGroup {
  readonly category: string;
  readonly results: readonly SemanticSearchResult[];
}

// ─── Core Atoms ─────────────────────────────────────────────

export const semanticSearchOpenAtom = atom(false);
export const semanticSearchModeAtom = atom<SearchMode>("semantic");
export const semanticSearchQueryAtom = atom("");
export const semanticSearchResultsAtom = atom<readonly SemanticSearchGroup[]>([]);
export const semanticSearchLoadingAtom = atom(false);
export const semanticSearchSelectedIndexAtom = atom(0);

// ─── Derived Atoms ──────────────────────────────────────────

/** The result at the currently selected flat index, or null. */
export const semanticSearchPreviewAtom = atom((get) => {
  const groups = get(semanticSearchResultsAtom);
  const selectedIndex = get(semanticSearchSelectedIndexAtom);

  let cursor = 0;
  for (const group of groups) {
    for (const result of group.results) {
      if (cursor === selectedIndex) return result;
      cursor++;
    }
  }
  return null;
});

/** Total number of results across all groups. */
export const semanticSearchTotalCountAtom = atom((get) => {
  const groups = get(semanticSearchResultsAtom);
  return groups.reduce((sum, g) => sum + g.results.length, 0);
});

// ─── Write Atoms ────────────────────────────────────────────

/** Open the semantic search overlay. */
export const openSemanticSearchAtom = atom(null, (_get, set) => {
  set(semanticSearchOpenAtom, true);
});

/** Close the semantic search overlay and clear state. */
export const closeSemanticSearchAtom = atom(null, (_get, set) => {
  set(semanticSearchOpenAtom, false);
  set(semanticSearchQueryAtom, "");
  set(semanticSearchResultsAtom, []);
  set(semanticSearchLoadingAtom, false);
  set(semanticSearchSelectedIndexAtom, 0);
});

/**
 * Execute a debounced search. Generates mock results after 400ms.
 * Uses a module-level timer to debounce across rapid invocations.
 */
let searchTimer: ReturnType<typeof setTimeout> | null = null;

export const executeSemanticSearchAtom = atom(null, (get, set, query: string) => {
  set(semanticSearchQueryAtom, query);
  set(semanticSearchSelectedIndexAtom, 0);

  if (searchTimer !== null) clearTimeout(searchTimer);

  if (!query.trim()) {
    set(semanticSearchResultsAtom, []);
    set(semanticSearchLoadingAtom, false);
    return;
  }

  set(semanticSearchLoadingAtom, true);

  searchTimer = setTimeout(() => {
    const mode = get(semanticSearchModeAtom);
    const results = generateMockResults(query, mode);
    set(semanticSearchResultsAtom, results);
    set(semanticSearchLoadingAtom, false);
  }, 400);
});

// ─── Reset ──────────────────────────────────────────────────

export const resetSemanticSearchAtomsAtom = atom(null, (_get, set) => {
  if (searchTimer !== null) clearTimeout(searchTimer);
  set(semanticSearchOpenAtom, false);
  set(semanticSearchModeAtom, "semantic");
  set(semanticSearchQueryAtom, "");
  set(semanticSearchResultsAtom, []);
  set(semanticSearchLoadingAtom, false);
  set(semanticSearchSelectedIndexAtom, 0);
});

registerResetAtom(resetSemanticSearchAtomsAtom);
