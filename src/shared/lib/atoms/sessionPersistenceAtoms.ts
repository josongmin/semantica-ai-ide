import { atom } from "jotai";

import { getVscodeApi } from "../vscodeApi";

interface PersistedWebviewState {
  activeSessionId?: string | null;
}

/** Persisted session ID (survives webview reload via VSCode setState/getState) */
export const persistedSessionIdAtom = atom<string | null>(null);

/** Write-only: save session ID to VSCode state and update atom */
export const persistSessionIdAtom = atom(null, (_get, set, sessionId: string | null) => {
  set(persistedSessionIdAtom, sessionId);
  getVscodeApi().setState({ activeSessionId: sessionId } satisfies PersistedWebviewState);
});

/** Write-only: restore session ID from VSCode state on startup */
export const restorePersistedSessionAtom = atom(null, (_get, set) => {
  const raw = getVscodeApi().getState();
  if (raw === null || typeof raw !== "object") return;

  const state = raw as PersistedWebviewState;
  if (typeof state.activeSessionId === "string" && state.activeSessionId) {
    set(persistedSessionIdAtom, state.activeSessionId);
    getVscodeApi().postMessage({
      type: "RESUME_SESSION",
      session_id: state.activeSessionId,
    });
  }
});
