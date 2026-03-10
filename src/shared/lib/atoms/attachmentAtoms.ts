import { atom } from "jotai";

import type { Attachment } from "../../protocol";

// ─── Pending Attachments ─────────────────────────────────

/** Attachments queued for the next message */
export const pendingAttachmentsAtom = atom<readonly Attachment[]>([]);

/** Add an attachment to the pending list */
export const addAttachmentAtom = atom(null, (get, set, attachment: Attachment) => {
  const current = get(pendingAttachmentsAtom);
  // Avoid duplicates by path
  if (current.some((a) => a.path === attachment.path)) return;
  set(pendingAttachmentsAtom, [...current, attachment]);
});

/** Remove an attachment by path */
export const removeAttachmentAtom = atom(null, (get, set, path: string) => {
  const current = get(pendingAttachmentsAtom);
  set(
    pendingAttachmentsAtom,
    current.filter((a) => a.path !== path),
  );
});

/** Clear all pending attachments */
export const clearAttachmentsAtom = atom(null, (_get, set) => {
  set(pendingAttachmentsAtom, []);
});

/** Reset all attachment atoms to their defaults */
export const resetAttachmentAtomsAtom = atom(null, (_get, set) => {
  set(pendingAttachmentsAtom, []);
});
