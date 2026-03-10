import { createStateAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { AgentWave } from "../../../shared/protocol";

export const [agentWaveAtom, setAgentWaveAtom, resetAgentWaveAtom] =
  createStateAtomSet<AgentWave | null>(null);

registerResetAtom(resetAgentWaveAtom);
