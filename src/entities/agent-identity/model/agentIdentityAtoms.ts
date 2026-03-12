import { atom } from "jotai";

import { createBoundedAtomFamily } from "../../../shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "../../../shared/lib/atoms/debugLabel";
import type { AgentRole } from "../../../shared/protocol";

// ─── Agent Identity ──────────────────────────────────────
export interface AgentIdentity {
  readonly id: string;
  readonly name: string;
  readonly role: AgentRole;
  readonly status: "idle" | "working" | "done" | "error";
  readonly model?: string;
  readonly current_task?: string;
}

// ─── Role Visual Config ──────────────────────────────────
export interface AgentRoleConfig {
  readonly label: string;
  readonly icon: string;
  readonly color: string;
  readonly bgClass: string;
  readonly textClass: string;
  readonly dotClass: string;
  readonly borderClass: string;
}

const NEUTRAL: Pick<
  AgentRoleConfig,
  "color" | "bgClass" | "textClass" | "dotClass" | "borderClass"
> = {
  color: "fg",
  bgClass: "bg-vsc-toolbar/50",
  textClass: "text-vsc-text-secondary",
  dotClass: "bg-vsc-text-secondary",
  borderClass: "border-vsc-border",
};

export const AGENT_ROLE_CONFIG: Record<AgentRole, AgentRoleConfig> = {
  orchestrator: { label: "Orchestrator Agent", icon: "organization", ...NEUTRAL },
  planner: { label: "Planner Agent", icon: "compass", ...NEUTRAL },
  coder: { label: "Coder Agent", icon: "code", ...NEUTRAL },
  reviewer: { label: "Reviewer Agent", icon: "eye", ...NEUTRAL },
  debugger: { label: "Debugger Agent", icon: "bug", ...NEUTRAL },
  tester: { label: "Tester Agent", icon: "beaker", ...NEUTRAL },
  researcher: { label: "Researcher Agent", icon: "search", ...NEUTRAL },
  educator: { label: "Explainer Agent", icon: "book", ...NEUTRAL },
  critic: { label: "Critic Agent", icon: "shield", ...NEUTRAL },
  requirements: { label: "Requirements Agent", icon: "milestone", ...NEUTRAL },
  security: { label: "Security Agent", icon: "lock", ...NEUTRAL },
  architect: { label: "Architect Agent", icon: "symbol-structure", ...NEUTRAL },
};

// ─── Atoms ──────────────────────────────────────────────
/** All active agents in the current session */
export const activeAgentsAtom = atom<readonly AgentIdentity[]>([]);

/** Per-turn agent ID mapping (which agent produced which turn) */
export const turnAgentAtomFamily = createBoundedAtomFamily(
  (_turnId: string) => atom<AgentIdentity | null>(null),
  { maxSize: 500 },
  (a: string, b: string) => a === b,
);
setDebugLabel(turnAgentAtomFamily, "turnAgentAtomFamily");

/** Default config when no specific role is assigned */
const DEFAULT_AGENT_CONFIG: AgentRoleConfig = {
  label: "Agent",
  icon: "hubot",
  color: "fg",
  bgClass: "bg-vsc-toolbar/50",
  textClass: "text-vsc-text-secondary",
  dotClass: "bg-vsc-text-secondary",
  borderClass: "border-vsc-border",
};

/** Lookup config by role */
export function getAgentRoleConfig(role?: AgentRole): AgentRoleConfig {
  if (!role) return DEFAULT_AGENT_CONFIG;
  return AGENT_ROLE_CONFIG[role];
}

// Re-export from shared/lib (canonical location) to maintain public API
export { inferAgentRole } from "../../../shared/lib/inferAgentRole";
