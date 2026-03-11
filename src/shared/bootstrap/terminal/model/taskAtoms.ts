/**
 * Terminal task atoms — task state and task list management.
 *
 * Tasks represent agent-initiated terminal commands that may require approval.
 */
import { atom } from "jotai";
import { atomFamily } from "jotai/utils";

import type { TerminalSessionId } from "~shared/protocol/types/core";
import type { TerminalAgentAction } from "~shared/protocol/types/terminal";

// ─── Task State ────────────────────────────────────────────

/** All pending/executed agent action IDs */
export const terminalTaskOrderAtom = atom<readonly string[]>([]);

/** Set for O(1) membership checks */
const terminalTaskIdSetAtom = atom<ReadonlySet<string>>(new Set<string>());

/** Per-action atom family */
// eslint-disable-next-line @typescript-eslint/no-deprecated -- migration to jotai-family tracked separately
export const terminalTaskAtomFamily = atomFamily(
  (_id: string) => atom<TerminalAgentAction | null>(null),
  (a: string, b: string) => a === b,
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- debugLabel is not in the public type
(terminalTaskAtomFamily as any).debugLabel = "terminalTaskAtomFamily";

// ─── Task Writers ──────────────────────────────────────────

/** Write-only: upsert an agent terminal action */
export const upsertTerminalTaskAtom = atom(null, (get, set, action: TerminalAgentAction) => {
  set(terminalTaskAtomFamily(action.id), action);

  const idSet = get(terminalTaskIdSetAtom);
  if (!idSet.has(action.id)) {
    const nextSet = new Set(idSet);
    nextSet.add(action.id);
    set(terminalTaskIdSetAtom, nextSet);
    set(terminalTaskOrderAtom, [...get(terminalTaskOrderAtom), action.id]);
  }
});

/** Write-only: update the status of an agent terminal action */
export const setTerminalTaskStatusAtom = atom(
  null,
  (get, set, payload: { id: string; status: TerminalAgentAction["status"] }) => {
    const action = get(terminalTaskAtomFamily(payload.id));
    if (!action) return;
    set(terminalTaskAtomFamily(payload.id), {
      ...action,
      status: payload.status,
    });
  },
);

/** Write-only: remove all tasks for a given session */
export const clearTerminalTasksForSessionAtom = atom(
  null,
  (get, set, sessionId: TerminalSessionId) => {
    const idsToRemove: string[] = [];
    for (const id of get(terminalTaskIdSetAtom)) {
      const action = get(terminalTaskAtomFamily(id));
      if (action?.sessionId === sessionId) {
        idsToRemove.push(id);
        terminalTaskAtomFamily.remove(id);
      }
    }

    if (idsToRemove.length === 0) return;

    const removeSet = new Set(idsToRemove);
    const nextSet = new Set(get(terminalTaskIdSetAtom));
    for (const id of idsToRemove) nextSet.delete(id);
    set(terminalTaskIdSetAtom, nextSet);
    set(
      terminalTaskOrderAtom,
      get(terminalTaskOrderAtom).filter((id) => !removeSet.has(id)),
    );
  },
);

/** Write-only: reset all terminal task state */
export const resetTerminalTasksAtom = atom(null, (get, set) => {
  for (const id of get(terminalTaskIdSetAtom)) {
    terminalTaskAtomFamily.remove(id);
  }
  set(terminalTaskOrderAtom, []);
  set(terminalTaskIdSetAtom, new Set());
});
