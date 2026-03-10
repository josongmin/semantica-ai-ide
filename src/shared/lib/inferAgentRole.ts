import type { AgentRole, Turn, TurnPhaseEntry } from "../protocol";

/** Check if a phase has meaningful content */
function phaseHasContent(phase: TurnPhaseEntry): boolean {
  return phase.message_ids.length > 0 || phase.tool_call_ids.length > 0;
}

/**
 * Infer agent role from turn phases when `agent_role` is not explicitly set.
 * Maps the dominant phase to the most fitting agent persona.
 *
 * Lives in shared/lib so both entities/message and entities/agent-identity
 * can use it without cross-entity imports.
 */
export function inferAgentRole(turn: Turn): AgentRole {
  if (turn.agent_role) return turn.agent_role;

  const has = (p: string) => turn.phases.some((e) => e.phase === p && phaseHasContent(e));

  if (turn.status === "error") return "debugger";
  if (has("changes")) return "coder";
  if (has("plan")) return "architect";
  if (has("analysis")) return "requirements";
  if (has("thinking")) return "planner";
  if (has("summary")) return "researcher";

  return "coder";
}
