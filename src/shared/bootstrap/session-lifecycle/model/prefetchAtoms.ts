import { atom } from "jotai";

import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";

/**
 * Set of session IDs that have already been prefetched.
 * Prevents duplicate prefetch requests for the same session.
 */
export const prefetchedSessionsAtom = atom<ReadonlySet<string>>(new Set<string>());

/**
 * Write-only atom to mark a session as prefetched.
 */
export const markPrefetchedAtom = atom(null, (get, set, sessionId: string) => {
  const current = get(prefetchedSessionsAtom);
  if (current.has(sessionId)) return;
  const next = new Set(current);
  next.add(sessionId);
  set(prefetchedSessionsAtom, next);
});

/**
 * Write-only atom to reset prefetched sessions (e.g. on session list refresh).
 */
export const resetPrefetchedSessionsAtom = atom(null, (_get, set) => {
  set(prefetchedSessionsAtom, new Set<string>());
});

registerResetAtom(resetPrefetchedSessionsAtom);
