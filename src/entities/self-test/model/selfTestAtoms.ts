import { atom } from "jotai";
import { atomFamily } from "jotai/utils";

import { setDebugLabel } from "../../../shared/lib/atoms/debugLabel";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";

export interface SelfTestIteration {
  id: string;
  testsPassed: number;
  testsFailed: number;
  testsTotal: number;
  status: "running" | "success" | "error" | "skipped";
}

export interface SelfTestLoop {
  turnId: string;
  iterations: SelfTestIteration[];
  currentIndex: number;
  maxIterations: number;
  status: "running" | "completed" | "failed";
}

// eslint-disable-next-line @typescript-eslint/no-deprecated -- atomFamily migration to jotai-family tracked separately
export const selfTestLoopAtomFamily = atomFamily(
  (_turnId: string) => atom<SelfTestLoop | null>(null),
);
setDebugLabel(selfTestLoopAtomFamily, "selfTestLoopAtomFamily");

/** Reset all per-turn self-test state */
export const resetSelfTestStoreAtom = atom(null, (_get, _set) => {
  selfTestLoopAtomFamily.setShouldRemove(() => true);
  selfTestLoopAtomFamily.setShouldRemove(null);
});
registerResetAtom(resetSelfTestStoreAtom);
