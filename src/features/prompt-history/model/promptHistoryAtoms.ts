import { atom } from "jotai";

/** Maximum number of prompt history entries to retain */
const MAX_HISTORY_SIZE = 50;

/** Stack of previously sent prompts (most recent first) */
export const promptHistoryAtom = atom<readonly string[]>([]);

/** Write atom: push a new entry to the front of the history stack */
export const pushPromptHistoryAtom = atom(null, (get, set, text: string) => {
  const prev = get(promptHistoryAtom);
  // Deduplicate consecutive identical entries
  if (prev.length > 0 && prev[0] === text) return;
  const next = [text, ...prev].slice(0, MAX_HISTORY_SIZE);
  set(promptHistoryAtom, next);
});
