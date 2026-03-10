import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { SessionId, ShareLink } from "../../../shared/protocol";

/** Whether the share dialog is open */
export const shareDialogOpenAtom = atom(false);

/** Map of session IDs to their generated share links */
export const shareLinksAtom = atom<ReadonlyMap<SessionId, ShareLink>>(
  new Map<SessionId, ShareLink>(),
);

/** Write-only: set a share link for a session */
export const setShareLinkAtom = atom(
  null,
  (get, set, payload: { session_id: SessionId; link: ShareLink }) => {
    const existing = get(shareLinksAtom);
    const next = new Map(existing);
    next.set(payload.session_id, payload.link);
    set(shareLinksAtom, next);
  },
);

/** Write-only: reset session-share store */
export const resetSessionShareStoreAtom = atom(null, (_get, set) => {
  set(shareDialogOpenAtom, false);
  set(shareLinksAtom, new Map<SessionId, ShareLink>());
});

registerResetAtom(resetSessionShareStoreAtom);
