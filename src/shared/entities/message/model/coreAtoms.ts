/**
 * Core message read atoms — message family, order, and streaming append.
 *
 * Pure read atoms and the per-message atom family live here so that
 * rendering consumers do not depend on turn or write atoms.
 */
import { atom } from "jotai";
import { atomFamily } from "jotai/utils";

import { inferAgentRole } from "~shared/lib/inferAgentRole";
import type {
  MessageId,
  UiMessage,
} from "~shared/protocol";

import { turnAtomFamily } from "./turnAtoms";

// ─── Message Atoms ─────────────────────────────────────────

/** Ordered list of message IDs */
export const messageOrderAtom = atom<readonly MessageId[]>([]);

/** Set for O(1) membership checks when upserting */
export const messageIdSetAtom = atom<ReadonlySet<MessageId>>(new Set<MessageId>());

/** Per-message atom family — only subscribers of a specific message re-render */
// eslint-disable-next-line @typescript-eslint/no-deprecated -- migration to jotai-family tracked separately
export const messageAtomFamily = atomFamily(
  (_id: MessageId) => atom<UiMessage | null>(null),
  (a: MessageId, b: MessageId) => a === b,
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- atomFamily lacks debugLabel in type, but supports it at runtime
(messageAtomFamily as any).debugLabel = "messageAtomFamily";

/** Agent role for display: msg.agent_role, or inferred from turn when absent */
// eslint-disable-next-line @typescript-eslint/no-deprecated -- migration to jotai-family tracked separately
export const effectiveAgentRoleForMessageAtomFamily = atomFamily(
  (messageId: MessageId) =>
    atom((get) => {
      const msg = get(messageAtomFamily(messageId));
      if (!msg?.agent_role && msg?.turn_id) {
        const turn = get(turnAtomFamily(msg.turn_id));
        return turn ? inferAgentRole(turn) : undefined;
      }
      return msg?.agent_role;
    }),
  (a: MessageId, b: MessageId) => a === b,
);
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- atomFamily lacks debugLabel in type, but supports it at runtime
(effectiveAgentRoleForMessageAtomFamily as any).debugLabel = "effectiveAgentRoleForMessageAtomFamily";

/** Write-only: append text chunk to existing message (streaming) */
export const appendTextAtom = atom(null, (get, set, payload: { id: MessageId; chunk: string }) => {
  if (!payload.chunk) return;
  const msg = get(messageAtomFamily(payload.id));
  if (!msg) return;
  set(messageAtomFamily(payload.id), {
    ...msg,
    text: msg.text + payload.chunk,
  });
});
