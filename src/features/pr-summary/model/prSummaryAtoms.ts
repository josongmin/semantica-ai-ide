import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { PRSummary } from "../../../shared/protocol";

/** Whether the PR summary dialog is open */
export const prSummaryDialogOpenAtom = atom(false);

/** The current PR summary content (null = not yet generated) */
export const prSummaryContentAtom = atom<PRSummary | null>(null);

/** Write-only: set the PR summary content */
export const setPrSummaryContentAtom = atom(null, (_get, set, summary: PRSummary) => {
  set(prSummaryContentAtom, summary);
});

/** Write-only: reset the PR summary store */
export const resetPrSummaryStoreAtom = atom(null, (_get, set) => {
  set(prSummaryDialogOpenAtom, false);
  set(prSummaryContentAtom, null);
});

registerResetAtom(resetPrSummaryStoreAtom);
