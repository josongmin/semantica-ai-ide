/**
 * Write atoms — dispatchers and event handlers that mutate message state.
 *
 * Upsert, status, diff-loaded, error classification, and store reset.
 */
import { atom } from "jotai";

import type {
  ClassifiedError,
  MessageId,
  MessageStatus,
  UiMessage,
} from "~shared/protocol";

import { messageAtomFamily, messageIdSetAtom, messageOrderAtom } from "./coreAtoms";
import {
  activeTurnIdAtom,
  turnAtomFamily,
  turnIdSetAtom,
  turnOrderAtom,
} from "./turnAtoms";

// ─── Message Writers ───────────────────────────────────────

/** Write-only: upsert a message into the store */
export const upsertMessageAtom = atom(null, (get, set, msg: UiMessage) => {
  set(messageAtomFamily(msg.id), msg);

  const idSet = get(messageIdSetAtom);
  if (!idSet.has(msg.id)) {
    const nextSet = new Set(idSet);
    nextSet.add(msg.id);
    set(messageIdSetAtom, nextSet);
    set(messageOrderAtom, [...get(messageOrderAtom), msg.id]);
  }
});

/** Write-only: set diff_loaded text for a message */
export const setDiffLoadedAtom = atom(
  null,
  (get, set, payload: { id: MessageId; diff_text: string }) => {
    const msg = get(messageAtomFamily(payload.id));
    if (!msg) return;
    set(messageAtomFamily(payload.id), {
      ...msg,
      diff_loaded: payload.diff_text,
    });
  },
);

/** Write-only: attach a classified error to an existing message */
export const classifyErrorAtom = atom(
  null,
  (get, set, payload: { id: MessageId; error: ClassifiedError }) => {
    const msg = get(messageAtomFamily(payload.id));
    if (!msg) return;
    set(messageAtomFamily(payload.id), {
      ...msg,
      classified_error: payload.error,
    });
  },
);

/** Write-only: set message status */
export const setMessageStatusAtom = atom(
  null,
  (get, set, payload: { id: MessageId; status: MessageStatus }) => {
    const msg = get(messageAtomFamily(payload.id));
    if (!msg) return;
    set(messageAtomFamily(payload.id), {
      ...msg,
      status: payload.status,
    });
  },
);

/** Write-only: reset all message and turn state (call on session change to prevent memory leaks) */
export const resetMessageStoreAtom = atom(null, (get, set) => {
  // Clean up atomFamily caches to prevent unbounded memory growth
  for (const id of get(messageIdSetAtom)) {
    messageAtomFamily.remove(id);
  }
  for (const id of get(turnIdSetAtom)) {
    turnAtomFamily.remove(id);
  }
  set(messageOrderAtom, []);
  set(messageIdSetAtom, new Set());
  set(turnOrderAtom, []);
  set(turnIdSetAtom, new Set());
  set(activeTurnIdAtom, null);
});
