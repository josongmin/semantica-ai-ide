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

export const AGENT_ROLE_CONFIG: Record<AgentRole, AgentRoleConfig> = {
  orchestrator: {
    label: "Orchestrator Agent",
    icon: "organization",
    color: "keyword",
    bgClass: "bg-vsc-keyword/15",
    textClass: "text-vsc-keyword",
    dotClass: "bg-vsc-keyword",
    borderClass: "border-vsc-keyword/30",
  },
  planner: {
    label: "Planner Agent",
    icon: "compass",
    color: "warning",
    bgClass: "bg-vsc-warning/15",
    textClass: "text-vsc-warning",
    dotClass: "bg-vsc-warning",
    borderClass: "border-vsc-warning/30",
  },
  coder: {
    label: "Coder Agent",
    icon: "code",
    color: "success",
    bgClass: "bg-vsc-success/15",
    textClass: "text-vsc-success",
    dotClass: "bg-vsc-success",
    borderClass: "border-vsc-success/30",
  },
  reviewer: {
    label: "Reviewer Agent",
    icon: "eye",
    color: "info",
    bgClass: "bg-vsc-info/15",
    textClass: "text-vsc-info",
    dotClass: "bg-vsc-info",
    borderClass: "border-vsc-info/30",
  },
  debugger: {
    label: "Debugger Agent",
    icon: "bug",
    color: "error",
    bgClass: "bg-vsc-error/15",
    textClass: "text-vsc-error",
    dotClass: "bg-vsc-error",
    borderClass: "border-vsc-error/30",
  },
  tester: {
    label: "Tester Agent",
    icon: "beaker",
    color: "link",
    bgClass: "bg-vsc-link/15",
    textClass: "text-vsc-link",
    dotClass: "bg-vsc-link",
    borderClass: "border-vsc-link/30",
  },
  researcher: {
    label: "Researcher Agent",
    icon: "search",
    color: "info",
    bgClass: "bg-vsc-info/15",
    textClass: "text-vsc-info",
    dotClass: "bg-vsc-info",
    borderClass: "border-vsc-info/30",
  },
  educator: {
    label: "Explainer Agent",
    icon: "book",
    color: "info",
    bgClass: "bg-vsc-info/15",
    textClass: "text-vsc-info",
    dotClass: "bg-vsc-info",
    borderClass: "border-vsc-info/30",
  },
  critic: {
    label: "Critic Agent",
    icon: "shield",
    color: "warning",
    bgClass: "bg-vsc-warning/15",
    textClass: "text-vsc-warning",
    dotClass: "bg-vsc-warning",
    borderClass: "border-vsc-warning/30",
  },
  requirements: {
    label: "Requirements Agent",
    icon: "milestone",
    color: "link",
    bgClass: "bg-vsc-link/15",
    textClass: "text-vsc-link",
    dotClass: "bg-vsc-link",
    borderClass: "border-vsc-link/30",
  },
  security: {
    label: "Security Agent",
    icon: "lock",
    color: "error",
    bgClass: "bg-vsc-error/15",
    textClass: "text-vsc-error",
    dotClass: "bg-vsc-error",
    borderClass: "border-vsc-error/30",
  },
  architect: {
    label: "Architect Agent",
    icon: "symbol-structure",
    color: "link",
    bgClass: "bg-vsc-link/15",
    textClass: "text-vsc-link",
    dotClass: "bg-vsc-link",
    borderClass: "border-vsc-link/30",
  },
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
