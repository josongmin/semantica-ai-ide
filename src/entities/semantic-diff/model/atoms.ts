import { atom } from "jotai";

import { createBoundedAtomFamily } from "../../../shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "../../../shared/lib/atoms/debugLabel";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { SemanticDiffResult, TurnId } from "../../../shared/protocol";

/** Per-turn semantic diff result */
export const semanticDiffByTurnFamily = createBoundedAtomFamily(
  (_turnId: TurnId) => atom<SemanticDiffResult | null>(null),
  { maxSize: 500 },
  (a: TurnId, b: TurnId) => a === b,
);
setDebugLabel(semanticDiffByTurnFamily, "semanticDiffByTurnFamily");

/** Reset all semantic-diff state (clears atomFamily cache) */
export const resetSemanticDiffStoreAtom = atom(null, (_get, _set) => {
  semanticDiffByTurnFamily.setShouldRemove(() => true);
  semanticDiffByTurnFamily.setShouldRemove(null);
});
registerResetAtom(resetSemanticDiffStoreAtom);

/** Write atom to set a semantic diff result by turnId */
export const setSemanticDiffResultAtom = atom(null, (_get, set, result: SemanticDiffResult) => {
  set(semanticDiffByTurnFamily(result.turnId), result);
});
