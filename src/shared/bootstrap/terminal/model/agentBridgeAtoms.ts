/**
 * Agent Bridge Atoms — RFC-TERMINAL-016 §2.4
 *
 * State bridge between terminal intents and the agent panel.
 * When a user clicks "Ask Agent" on a failed command block,
 * the attachment is stored here for the agent chat to display.
 */

import { atom } from "jotai";

import type { AskAgentPayload } from "./intentTypes";

/** Current terminal block attachment for agent chat (null = none pending) */
export const terminalAgentAttachmentAtom = atom<AskAgentPayload | null>(null);

/** Dismiss the current attachment (after agent processes it) */
export const dismissAgentAttachmentAtom = atom(null, (_get, set) => {
  set(terminalAgentAttachmentAtom, null);
});
