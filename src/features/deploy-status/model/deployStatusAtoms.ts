import { createStateAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { DeployStatus } from "../../../shared/protocol";

export const [deployStatusAtom, setDeployStatusAtom, resetDeployStatusAtom] =
  createStateAtomSet<DeployStatus | null>(null);

registerResetAtom(resetDeployStatusAtom);
