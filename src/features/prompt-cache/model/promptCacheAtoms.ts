import { atom } from "jotai";

/** Prompt cache hit rate (0..1) */
export const cacheHitRateAtom = atom(0);

/** Cost savings in USD string (e.g. "1.23") */
export const cacheSavingsAtom = atom("0.00");

/** Whether cache flash animation should play */
export const cacheFlashAtom = atom(false);
