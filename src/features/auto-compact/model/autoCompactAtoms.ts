import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";

/** Whether a compact request is pending user confirmation */
export const pendingCompactAtom = atom(false);

/** Context usage percentage snapshot for the compact dialog */
export const compactUsagePctAtom = atom(0);

/** Reset auto-compact state */
export const resetAutoCompactAtom = atom(null, (_get, set) => {
  set(pendingCompactAtom, false);
  set(compactUsagePctAtom, 0);
});

registerResetAtom(resetAutoCompactAtom);
