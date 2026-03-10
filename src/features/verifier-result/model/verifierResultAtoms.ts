import { createStateAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { VerifierResult } from "../../../shared/protocol";

export const [verifierResultAtom, setVerifierResultAtom, resetVerifierResultAtom] =
  createStateAtomSet<VerifierResult | null>(null);

registerResetAtom(resetVerifierResultAtom);
