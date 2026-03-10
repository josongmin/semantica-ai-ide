import { useMemo } from "react";
import { useAtomValue } from "jotai";

import {
  activeTabIdAtom,
  fuzzyScore,
  openTabsAtom,
  pinnedSessionIdsAtom,
  sessionListAtom,
} from "../../../shared/lib";
import type { SessionListEntry } from "../../../shared/protocol";

const MAX_RESULTS = 50;

export type ScoredEntry = SessionListEntry & { _score: number };

/**
 * Encapsulates session search: fuzzy scoring, filtering, and priority ranking.
 *
 * When `query` is empty, sessions are ranked by priority:
 *   active > pinned > open tabs > most recent.
 * When `query` is non-empty, sessions are filtered and ranked by fuzzy score.
 */
export function useSessionSearch(query: string): ScoredEntry[] {
  const sessions = useAtomValue(sessionListAtom);
  const openTabs = useAtomValue(openTabsAtom);
  const activeTabId = useAtomValue(activeTabIdAtom);
  const pinnedIds = useAtomValue(pinnedSessionIdsAtom);

  // Build open-tab ID set for ranking
  const openTabIds = useMemo(() => {
    const set = new Set<string>();
    for (const tab of openTabs) set.add(tab.session_id);
    return set;
  }, [openTabs]);

  // Filter + rank sessions
  const results = useMemo(() => {
    let scored: ScoredEntry[];

    if (!query) {
      scored = sessions.map((s) => ({ ...s, _score: 0 }));
    } else {
      scored = [];
      for (const s of sessions) {
        const titleMatch = fuzzyScore(query, s.title);
        const previewMatch = s.last_message_preview
          ? fuzzyScore(query, s.last_message_preview)
          : null;
        const best = Math.max(titleMatch?.score ?? -1, previewMatch?.score ?? -1);
        if (best >= 0) {
          scored.push({ ...s, _score: best });
        }
      }
    }

    // Sort: when no query, rank by priority then recency;
    // when query present, rank by fuzzy score
    scored.sort((a, b) => {
      if (query) return b._score - a._score;

      // Active session first
      if (a.session_id === activeTabId) return -1;
      if (b.session_id === activeTabId) return 1;

      // Pinned sessions next
      const aPinned = pinnedIds.has(a.session_id);
      const bPinned = pinnedIds.has(b.session_id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      // Open tabs next
      const aOpen = openTabIds.has(a.session_id);
      const bOpen = openTabIds.has(b.session_id);
      if (aOpen && !bOpen) return -1;
      if (!aOpen && bOpen) return 1;

      // Then by most recent
      return b.created_at_ms - a.created_at_ms;
    });

    return scored.slice(0, MAX_RESULTS);
  }, [sessions, query, activeTabId, openTabIds, pinnedIds]);

  return results;
}
