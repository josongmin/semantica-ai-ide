import { atom } from "jotai";

import type { ModelInfo, SessionListEntry } from "../../protocol";

// ─── Session List ────────────────────────────────────────

/** Session list entries (populated by host) */
export const sessionListAtom = atom<readonly SessionListEntry[]>([]);

/** Write atom to replace the session list */
export const setSessionListAtom = atom(null, (_get, set, sessions: readonly SessionListEntry[]) => {
  set(sessionListAtom, sessions);
});

// ─── Available Models ───────────────────────────────────

/** List of models available for switching */
export const availableModelsAtom = atom<readonly ModelInfo[]>([]);

/** Write atom to replace the available models list */
export const setAvailableModelsAtom = atom(null, (_get, set, models: readonly ModelInfo[]) => {
  set(availableModelsAtom, models);
});

// ─── Project Files (for @mention) ────────────────────────

/** Project file paths for @mention autocomplete */
export const projectFilesAtom = atom<readonly string[]>([]);

/** Write atom to replace project files list */
export const setProjectFilesAtom = atom(null, (_get, set, files: readonly string[]) => {
  set(projectFilesAtom, files);
});
