/**
 * Mission Control atoms for monitoring parallel agents.
 *
 * Provides a grid/list view of all active agent instances with
 * their statuses, progress, and risk levels.
 */
import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { AgentInstanceId, MissionControlAgent } from "../../../shared/protocol";

// ─── Grid Layout ─────────────────────────────────────────────

/** Layout mode for the mission control grid */
export type AgentGridLayout = "grid" | "list";
export const agentGridLayoutAtom = atom<AgentGridLayout>("grid");

/** Whether mission control panel is visible */
export const missionControlVisibleAtom = atom(false);

// ─── Agent Data ──────────────────────────────────────────────

/** All mission control agents keyed by id */
export const missionControlAgentsMapAtom = atom<ReadonlyMap<AgentInstanceId, MissionControlAgent>>(
  new Map(),
);

/** Write-only: replace all mission control agents */
export const setMissionControlAgentsAtom = atom(
  null,
  (_get, set, agents: readonly MissionControlAgent[]) => {
    const map = new Map<AgentInstanceId, MissionControlAgent>();
    for (const agent of agents) {
      map.set(agent.id, agent);
    }
    set(missionControlAgentsMapAtom, map);
  },
);

/** Derived: ordered list of agents (sorted by name) */
export const missionControlAgentsListAtom = atom((get) => {
  const map = get(missionControlAgentsMapAtom);
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
});

/** Derived: count of agents by status */
export const missionControlStatusCountsAtom = atom((get) => {
  const agents = get(missionControlAgentsListAtom);
  let running = 0;
  let idle = 0;
  let error = 0;
  for (const a of agents) {
    if (a.status === "running") running++;
    else if (a.status === "idle") idle++;
    else error++;
  }
  return { running, idle, error, total: agents.length };
});

/** Write-only: reset mission control store */
export const resetMissionControlStoreAtom = atom(null, (_get, set) => {
  set(missionControlAgentsMapAtom, new Map());
  set(missionControlVisibleAtom, false);
  set(agentGridLayoutAtom, "grid");
});

registerResetAtom(resetMissionControlStoreAtom);
