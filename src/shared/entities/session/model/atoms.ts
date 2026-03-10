import { atom } from "jotai";

import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";
import type { ApprovalMode, Checkpoint, SessionId, SessionMeta } from "~shared/protocol";

const defaultMeta: SessionMeta = {
  session_id: "" as SessionId,
  model_id: "",
  model_label: "",
  approval_mode: "auto",
  status: "idle",
};

/** Current session metadata */
export const sessionMetaAtom = atom<SessionMeta>(defaultMeta);

/** Convenience derived atom for approval mode */
export const approvalModeAtom = atom(
  (get) => get(sessionMetaAtom).approval_mode,
  (get, set, mode: ApprovalMode) => {
    set(sessionMetaAtom, { ...get(sessionMetaAtom), approval_mode: mode });
  },
);

/** Write-only: partial-update session meta */
export const updateSessionMetaAtom = atom(null, (get, set, partial: Partial<SessionMeta>) => {
  set(sessionMetaAtom, { ...get(sessionMetaAtom), ...partial });
});

/** Ordered list of checkpoints */
export const checkpointsAtom = atom<readonly Checkpoint[]>([]);

/** Write-only: reset session state (call on session change) */
export const resetSessionStoreAtom = atom(null, (_get, set) => {
  set(sessionMetaAtom, defaultMeta);
  set(checkpointsAtom, []);
});

/** Write-only: add checkpoint */
export const addCheckpointAtom = atom(null, (get, set, cp: Checkpoint) => {
  set(checkpointsAtom, [...get(checkpointsAtom), cp]);
});

registerResetAtom(resetSessionStoreAtom);
