import { createStateAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { DebugState } from "../../../shared/protocol";

const DEFAULT_DEBUG_STATE: DebugState = {
  phase: "idle",
  hypotheses: [],
};

export const [debugStateAtom, setDebugStateAtom, resetDebugStateAtom] =
  createStateAtomSet<DebugState>(DEFAULT_DEBUG_STATE);

registerResetAtom(resetDebugStateAtom);
