import { createStateAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { LivingSpec } from "../../../shared/protocol";

export const [livingSpecAtom, setLivingSpecAtom, resetLivingSpecAtom] =
  createStateAtomSet<LivingSpec | null>(null);

registerResetAtom(resetLivingSpecAtom);
