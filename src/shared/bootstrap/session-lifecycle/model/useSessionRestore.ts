import { useEffect } from "react";
import { useAtomValue, useStore } from "jotai";

import { sessionMetaAtom } from "~entities/session/state";
import { persistSessionIdAtom, restorePersistedSessionAtom } from "~shared/lib";

/**
 * One-time session restore on mount + auto-persist when session changes.
 * Call once at the app root (e.g., StreamingBootstrap).
 */
export function useSessionRestore(): void {
  const store = useStore();
  const sessionId = useAtomValue(sessionMetaAtom).session_id;

  // Restore on mount: read from VSCode state and resume if found
  useEffect(() => {
    store.set(restorePersistedSessionAtom);
  }, [store]);

  // Auto-persist whenever session_id changes
  useEffect(() => {
    store.set(persistSessionIdAtom, sessionId);
  }, [store, sessionId]);
}
