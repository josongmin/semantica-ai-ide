import { atom } from "jotai";

import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";
import type { Attachment } from "~shared/protocol";

/** Queued message when agent is running (streaming). Sent after current turn completes. */
export interface QueuedMessage {
  readonly text: string;
  readonly attachments: readonly Attachment[];
}

/** FIFO queue for messages sent during streaming. */
export const messageQueueAtom = atom<QueuedMessage[]>([]);

/** Write-only: enqueue a message to send after current turn. */
export const enqueueMessageAtom = atom(null, (get, set, msg: QueuedMessage) => {
  set(messageQueueAtom, [...get(messageQueueAtom), msg]);
});

/** Write-only: remove a single queued message by index. */
export const removeQueuedMessageAtom = atom(null, (get, set, index: number) => {
  set(messageQueueAtom, get(messageQueueAtom).filter((_, i) => i !== index));
});

/** Write-only: clear queue (e.g. on session switch). */
export const resetMessageQueueAtom = atom(null, (_get, set) => {
  set(messageQueueAtom, []);
});

registerResetAtom(resetMessageQueueAtom);
