import { atom } from "jotai";
import { atomFamily } from "jotai/utils";

import { setDebugLabel } from "../../../shared/lib/atoms/debugLabel";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";

export interface AutoFixIteration {
  id: string;
  errorMessage: string;
  fixDescription: string;
  status: "running" | "success" | "error" | "skipped";
}

export interface AutoFixLoop {
  turnId: string;
  iterations: AutoFixIteration[];
  currentIndex: number;
  maxIterations: number;
  status: "running" | "completed" | "failed";
}

// eslint-disable-next-line @typescript-eslint/no-deprecated -- atomFamily migration to jotai-family tracked separately
export const autoFixLoopAtomFamily = atomFamily(
  (_turnId: string) => atom<AutoFixLoop | null>(null),
);
setDebugLabel(autoFixLoopAtomFamily, "autoFixLoopAtomFamily");

/** Reset all per-turn auto-fix state */
export const resetAutoFixStoreAtom = atom(null, (_get, _set) => {
  autoFixLoopAtomFamily.setShouldRemove(() => true);
  autoFixLoopAtomFamily.setShouldRemove(null);
});
registerResetAtom(resetAutoFixStoreAtom);
