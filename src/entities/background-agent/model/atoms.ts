import { atom } from "jotai";

import { createBoundedAtomFamily } from "../../../shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "../../../shared/lib/atoms/debugLabel";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { BackgroundAgentId, BackgroundAgentStatus } from "../../../shared/protocol";

/** All registered background agents */
export const backgroundAgentsAtom = atom<readonly BackgroundAgentStatus[]>([]);

/** Count of currently running agents — shown in HeaderBar */
export const activeBackgroundAgentCountAtom = atom(
  (get) => get(backgroundAgentsAtom).filter((a) => a.state === "running").length,
);

/** Per-agent lookup */
export const backgroundAgentFamily = createBoundedAtomFamily(
  (id: BackgroundAgentId) =>
    atom((get) => get(backgroundAgentsAtom).find((a) => a.agentId === id) ?? null),
  { maxSize: 200 },
  (a: BackgroundAgentId, b: BackgroundAgentId) => a === b,
);
setDebugLabel(backgroundAgentFamily, "backgroundAgentFamily");

/** Upsert agent status — used by sync hook */
export const upsertBackgroundAgentAtom = atom(null, (get, set, status: BackgroundAgentStatus) => {
  const prev = get(backgroundAgentsAtom);
  const idx = prev.findIndex((a) => a.agentId === status.agentId);
  if (idx >= 0) {
    const next = [...prev];
    next[idx] = status;
    set(backgroundAgentsAtom, next);
  } else {
    set(backgroundAgentsAtom, [...prev, status]);
  }
});

/** Reset all background agent state */
export const resetBackgroundAgentStoreAtom = atom(null, (_get, set) => {
  set(backgroundAgentsAtom, []);
  backgroundAgentFamily.setShouldRemove(() => true);
  backgroundAgentFamily.setShouldRemove(null);
});
registerResetAtom(resetBackgroundAgentStoreAtom);

/** Remove agent by ID */
export const removeBackgroundAgentAtom = atom(null, (get, set, agentId: BackgroundAgentId) => {
  set(
    backgroundAgentsAtom,
    get(backgroundAgentsAtom).filter((a) => a.agentId !== agentId),
  );
});
