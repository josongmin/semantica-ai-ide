import { atom } from "jotai";

import type { MessageId } from "../../protocol";

// ─── Message Editing ────────────────────────────────────

/** ID of the user message currently being edited (null = none) */
export const editingMessageIdAtom = atom<MessageId | null>(null);

// ─── Thinking / Fast Mode ────────────────────────────────

/** Whether thinking mode is enabled */
export const thinkingModeAtom = atom(false);

/** Whether fast mode is enabled */
export const fastModeAtom = atom(false);
