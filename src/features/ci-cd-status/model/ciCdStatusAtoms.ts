import { createStateAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { CiCdPipeline } from "../../../shared/protocol";

export const [ciCdPipelineAtom, setCiCdPipelineAtom, resetCiCdStatusAtom] =
  createStateAtomSet<CiCdPipeline | null>(null);

registerResetAtom(resetCiCdStatusAtom);
