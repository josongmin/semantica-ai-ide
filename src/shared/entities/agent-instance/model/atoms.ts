import { atom } from "jotai";

import { createBoundedAtomFamily } from "~shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "~shared/lib/atoms/debugLabel";
import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";
import type { AgentInstance, AgentInstanceId, AgentInstanceStatus } from "~shared/protocol";

/** Per-agent-instance atom family */
export const agentInstanceAtomFamily = createBoundedAtomFamily(
  (_id: string) => atom<AgentInstance | null>(null),
  { maxSize: 200 },
  (a: string, b: string) => a === b,
);
setDebugLabel(agentInstanceAtomFamily, "agentInstanceAtomFamily");

/** Ordered list of agent instance IDs (preserves insertion order for rendering) */
export const agentInstanceIdsAtom = atom<readonly string[]>([]);

/** Set for O(1) membership checks when upserting */
const agentInstanceSetAtom = atom<ReadonlySet<string>>(new Set<string>());

/** Write-only: upsert an agent instance into the store */
export const upsertAgentInstanceAtom = atom(null, (get, set, instance: AgentInstance) => {
  set(agentInstanceAtomFamily(instance.id), instance);

  const idSet = get(agentInstanceSetAtom);
  if (!idSet.has(instance.id)) {
    const nextSet = new Set(idSet);
    nextSet.add(instance.id);
    set(agentInstanceSetAtom, nextSet);
    set(agentInstanceIdsAtom, [...get(agentInstanceIdsAtom), instance.id]);
  }
});

/** Write-only: update agent instance status (partial: status, progress?, error_message?) */
export const updateAgentStatusAtom = atom(
  null,
  (
    get,
    set,
    payload: {
      id: AgentInstanceId;
      status: AgentInstanceStatus;
      progress?: number;
      error_message?: string;
    },
  ) => {
    const instance = get(agentInstanceAtomFamily(payload.id));
    if (!instance) return;
    set(agentInstanceAtomFamily(payload.id), {
      ...instance,
      status: payload.status,
      progress: payload.progress ?? instance.progress,
      error_message: payload.error_message ?? instance.error_message,
    });
  },
);

/** Write-only: remove an agent instance from the store */
export const removeAgentInstanceAtom = atom(null, (get, set, id: AgentInstanceId) => {
  agentInstanceAtomFamily.remove(id);

  const idSet = get(agentInstanceSetAtom);
  if (idSet.has(id)) {
    const nextSet = new Set(idSet);
    nextSet.delete(id);
    set(agentInstanceSetAtom, nextSet);
    set(
      agentInstanceIdsAtom,
      get(agentInstanceIdsAtom).filter((existingId) => existingId !== id),
    );
  }
});

/** Write-only: reset all agent instance state (call on session change) */
export const resetAgentStoreAtom = atom(null, (get, set) => {
  const ids = get(agentInstanceSetAtom);
  for (const id of ids) {
    agentInstanceAtomFamily.remove(id);
  }
  set(agentInstanceIdsAtom, []);
  set(agentInstanceSetAtom, new Set());
});

/** Derived: count of agent instances currently running */
export const runningAgentsCountAtom = atom((get) => {
  const ids = get(agentInstanceIdsAtom);
  let count = 0;
  for (const id of ids) {
    const instance = get(agentInstanceAtomFamily(id));
    if (instance?.status === "running") count++;
  }
  return count;
});

/** Derived: boolean — true when at least one agent is running */
export const hasActiveAgentsAtom = atom((get) => get(runningAgentsCountAtom) > 0);

/** Derived: agent IDs partitioned by running vs completed (for UX grouping) */
export const agentIdsPartitionedAtom = atom((get) => {
  const ids = get(agentInstanceIdsAtom);
  const running: string[] = [];
  const completed: string[] = [];
  for (const id of ids) {
    const instance = get(agentInstanceAtomFamily(id));
    if (!instance) continue;
    if (instance.status === "running" || instance.status === "queued") {
      running.push(id);
    } else {
      completed.push(id);
    }
  }
  return { running, completed };
});

registerResetAtom(resetAgentStoreAtom);
