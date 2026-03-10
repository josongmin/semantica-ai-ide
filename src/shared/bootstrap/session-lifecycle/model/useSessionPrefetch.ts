import { useCallback, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { getVscodeApi } from "~shared/lib";

import { markPrefetchedAtom, prefetchedSessionsAtom } from "./prefetchAtoms";

/** Debounce delay for hover-to-prefetch (ms) */
const PREFETCH_DEBOUNCE_MS = 200;

/**
 * Hook for prefetching session data on hover.
 *
 * When the user hovers over a session row, a debounced timer starts.
 * If the mouse stays for 200ms, a PREFETCH_SESSION message is sent
 * to the extension host, and the session is tracked in the prefetched set
 * to avoid duplicate requests.
 *
 * Usage:
 * ```tsx
 * const { onMouseEnter, onMouseLeave } = useSessionPrefetch(sessionId);
 * <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>...</div>
 * ```
 */
export function useSessionPrefetch(sessionId: string): {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  isPrefetched: boolean;
} {
  const prefetchedSessions = useAtomValue(prefetchedSessionsAtom);
  const markPrefetched = useSetAtom(markPrefetchedAtom);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPrefetched = prefetchedSessions.has(sessionId);

  const onMouseEnter = useCallback(() => {
    // Don't prefetch if already done
    if (prefetchedSessions.has(sessionId)) return;

    timerRef.current = setTimeout(() => {
      getVscodeApi().postMessage({
        type: "PREFETCH_SESSION",
        session_id: sessionId,
      });
      markPrefetched(sessionId);
    }, PREFETCH_DEBOUNCE_MS);
  }, [sessionId, prefetchedSessions, markPrefetched]);

  const onMouseLeave = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { onMouseEnter, onMouseLeave, isPrefetched };
}
