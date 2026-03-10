import { useCallback } from "react";
import { useAtomValue, useStore } from "jotai";

import {
  currentPageAtom,
  persistedSessionIdAtom,
  persistSessionIdAtom,
  sessionListAtom,
  setSessionListAtom,
} from "~shared/lib";
import { getVscodeApi } from "~shared/lib/vscodeApi";

/**
 * Hook for managing session lifecycle: create, resume, and delete sessions.
 * All real operations happen on the extension host — this hook sends requests
 * and performs optimistic UI updates.
 */
export function useSessionLifecycle(): {
  createSession: () => void;
  resumeSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  loadSessionList: () => void;
  activeSessionId: string | null;
} {
  const store = useStore();
  const activeSessionId = useAtomValue(persistedSessionIdAtom);

  const createSession = useCallback(() => {
    getVscodeApi().postMessage({ type: "NEW_SESSION" });
    store.set(currentPageAtom, "chat");
  }, [store]);

  const resumeSession = useCallback(
    (sessionId: string) => {
      getVscodeApi().postMessage({ type: "RESUME_SESSION", session_id: sessionId });
      store.set(persistSessionIdAtom, sessionId);
      store.set(currentPageAtom, "chat");
    },
    [store],
  );

  const deleteSession = useCallback(
    (sessionId: string) => {
      // Snapshot for optimistic rollback
      const snapshot = store.get(sessionListAtom);

      getVscodeApi().postMessage({ type: "DELETE_SESSION", session_id: sessionId });

      // Optimistic removal from session list
      store.set(
        setSessionListAtom,
        snapshot.filter((s) => s.session_id !== sessionId),
      );

      // Rollback if no server acknowledgement within 10s
      const rollbackTimer = setTimeout(() => {
        const current = store.get(sessionListAtom);
        if (!current.some((s) => s.session_id === sessionId)) {
          store.set(setSessionListAtom, snapshot);
        }
      }, 10_000);

      // Clear rollback timer if the session list gets a server update
      const unsubscribe = store.sub(sessionListAtom, () => {
        clearTimeout(rollbackTimer);
        unsubscribe();
      });

      // If deleting the active session, start a new one
      const persisted = store.get(persistedSessionIdAtom);
      if (persisted === sessionId) {
        store.set(persistSessionIdAtom, null);
        getVscodeApi().postMessage({ type: "NEW_SESSION" });
        store.set(currentPageAtom, "chat");
      }
    },
    [store],
  );

  const loadSessionList = useCallback(() => {
    getVscodeApi().postMessage({ type: "LOAD_SESSION_LIST" });
  }, []);

  return { createSession, resumeSession, deleteSession, loadSessionList, activeSessionId };
}
