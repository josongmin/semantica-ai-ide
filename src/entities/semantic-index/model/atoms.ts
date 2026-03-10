import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { IndexStatus, SemanticSearchResult, SymbolMention } from "../../../shared/protocol";

/** Current index status */
export const indexStatusAtom = atom<IndexStatus>("idle");

/** Indexing progress (0–100) */
export const indexProgressAtom = atom<number>(0);

/** Number of indexed files */
export const indexFileCountAtom = atom<number>(0);

/** Latest semantic search results */
export const searchResultsAtom = atom<readonly SemanticSearchResult[]>([]);

/** Latest symbol mentions */
export const symbolMentionsAtom = atom<readonly SymbolMention[]>([]);

/** Write-only: set index status with optional progress and file_count */
export const setIndexStatusAtom = atom(
  null,
  (
    _get,
    set,
    payload: {
      status: IndexStatus;
      progress?: number;
      file_count?: number;
    },
  ) => {
    set(indexStatusAtom, payload.status);
    if (payload.progress !== undefined) {
      set(indexProgressAtom, payload.progress);
    }
    if (payload.file_count !== undefined) {
      set(indexFileCountAtom, payload.file_count);
    }
  },
);

/** Write-only: set search results */
export const setSearchResultsAtom = atom(
  null,
  (
    _get,
    set,
    payload: {
      query: string;
      results: readonly SemanticSearchResult[];
    },
  ) => {
    set(searchResultsAtom, payload.results);
  },
);

/** Write-only: set symbol mentions */
export const setSymbolMentionsAtom = atom(null, (_get, set, symbols: readonly SymbolMention[]) => {
  set(symbolMentionsAtom, symbols);
});

/** Write-only: reset all semantic index state */
export const resetSemanticIndexStoreAtom = atom(null, (_get, set) => {
  set(indexStatusAtom, "idle");
  set(indexProgressAtom, 0);
  set(indexFileCountAtom, 0);
  set(searchResultsAtom, []);
  set(symbolMentionsAtom, []);
});

/** Derived: human-readable status label */
export const indexStatusLabelAtom = atom((get) => {
  const status = get(indexStatusAtom);
  const progress = get(indexProgressAtom);
  const fileCount = get(indexFileCountAtom);

  switch (status) {
    case "idle":
      return "Idle";
    case "indexing":
      return `Indexing... (${progress}%)`;
    case "ready":
      return `Ready (${fileCount.toLocaleString()} files)`;
    case "error":
      return "Error";
  }
});

/** Derived: true when index is in ready state */
export const isIndexReadyAtom = atom((get) => get(indexStatusAtom) === "ready");

registerResetAtom(resetSemanticIndexStoreAtom);
