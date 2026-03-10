import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { ThreeModelState } from "../../../shared/protocol";

/** Default initial state for the three-model architecture */
const DEFAULT_THREE_MODEL_STATE: ThreeModelState = {
  planner: { model: "", status: "idle", output: "" },
  coder: { model: "", status: "idle", output: "" },
  critic: { model: "", status: "idle", output: "" },
};

/** Current state of the three-model architecture (Planner / Coder / Critic) */
export const threeModelStateAtom = atom<ThreeModelState>(DEFAULT_THREE_MODEL_STATE);

/** Write-only: replace the entire three-model state */
export const setThreeModelStateAtom = atom(null, (_get, set, state: ThreeModelState) => {
  set(threeModelStateAtom, state);
});

/** Write-only: reset to defaults */
export const resetThreeModelStoreAtom = atom(null, (_get, set) => {
  set(threeModelStateAtom, DEFAULT_THREE_MODEL_STATE);
});

registerResetAtom(resetThreeModelStoreAtom);
