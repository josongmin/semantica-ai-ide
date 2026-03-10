import { atom } from "jotai";

import { focusedTurnIdAtom } from "../../../shared/lib";

const CLEAR_FOCUS_DELAY_MS = 2000;

/** Auto-clear focused turn after highlight animation (2 s timeout). */
let _clearFocusTimer: ReturnType<typeof setTimeout> | null = null;
export const clearFocusedTurnAtom = atom(null, (_get, set) => {
  if (_clearFocusTimer !== null) clearTimeout(_clearFocusTimer);
  _clearFocusTimer = setTimeout(() => set(focusedTurnIdAtom, null), CLEAR_FOCUS_DELAY_MS);
});
