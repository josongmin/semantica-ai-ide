import { atom } from "jotai";

/** Whether the Ctrl+R history search overlay is open */
export const historySearchOpenAtom = atom(false);

/** Current search query in the overlay */
export const historySearchQueryAtom = atom("");
