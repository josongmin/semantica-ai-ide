import { createPushAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { AgentSteer } from "../../../shared/protocol";

export const [agentSteersAtom, pushAgentSteerAtom, resetAgentSteerAtom] =
  createPushAtomSet<AgentSteer>();

registerResetAtom(resetAgentSteerAtom);
