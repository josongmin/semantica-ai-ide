/**
 * useTerminalSearch — extracted from TerminalPanel
 *
 * Manages terminal search state and handlers:
 * - Open/close search overlay
 * - Dispatch search queries to xterm SearchAddon
 * - Navigate between matches
 * - Track match count and current match index
 */

import { useCallback, useState } from "react";

import type { SearchOptions } from "../TerminalSearchOverlay";
import type { TerminalViewportRawHandle } from "../TerminalViewportRaw";

export interface TerminalSearchState {
  readonly searchOpen: boolean;
  readonly matchCount: number;
  readonly currentMatch: number;
}

export interface TerminalSearchHandlers {
  readonly setSearchOpen: (open: boolean) => void;
  readonly handleSearch: (query: string, options: SearchOptions) => void;
  readonly handleSearchNavigate: (direction: "next" | "prev") => void;
  readonly handleSearchResults: (results: { resultIndex: number; resultCount: number }) => void;
  readonly handleSearchClose: () => void;
}

export function useTerminalSearch(
  viewportRef: React.RefObject<TerminalViewportRawHandle | null>,
) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);

  const handleSearch = useCallback(
    (query: string, options: SearchOptions) => {
      const handle = viewportRef.current;
      if (!handle) return;

      if (!query) {
        handle.clearSearch();
        setMatchCount(0);
        setCurrentMatch(0);
        return;
      }

      // findNext returns boolean; match counts arrive via onSearchResults callback
      handle.search(query, {
        caseSensitive: options.caseSensitive,
        regex: options.regex,
        wholeWord: options.wholeWord,
      });
    },
    [viewportRef],
  );

  const handleSearchNavigate = useCallback(
    (direction: "next" | "prev") => {
      const handle = viewportRef.current;
      if (!handle) return;

      // Navigation returns boolean; counts update via onSearchResults
      if (direction === "next") {
        handle.searchNext();
      } else {
        handle.searchPrevious();
      }
    },
    [viewportRef],
  );

  // Callback for SearchAddon.onDidChangeResults -> updates match count/index
  const handleSearchResults = useCallback(
    (results: { resultIndex: number; resultCount: number }) => {
      setMatchCount(results.resultCount);
      setCurrentMatch(results.resultIndex);
    },
    [],
  );

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false);
    viewportRef.current?.clearSearch();
    setMatchCount(0);
    setCurrentMatch(0);
  }, [viewportRef]);

  return {
    searchState: { searchOpen, matchCount, currentMatch } as TerminalSearchState,
    searchHandlers: {
      setSearchOpen,
      handleSearch,
      handleSearchNavigate,
      handleSearchResults,
      handleSearchClose,
    } as TerminalSearchHandlers,
  } as const;
}
