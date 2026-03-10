/**
 * Adapter atom for send-message feature.
 *
 * Widgets read this atom instead of importing directly from
 * `features/send-message`, breaking the DIP violation.
 * The feature layer hydrates the adapter at bootstrap time.
 */
import { atom } from "jotai";

import type { Attachment } from "../../protocol";

// ─── Re-declare minimal types ───────────────────────────────────────

export interface QueuedMessage {
  readonly text: string;
  readonly attachments: readonly Attachment[];
}

// ─── Adapter interface ──────────────────────────────────────────────

export interface SendMessageAdapter {
  /** Send a user message (with optional attachment override). */
  send: (text: string, attachmentsOverride?: readonly Attachment[]) => void;
  /** Stop the currently running agent. */
  stopAgent: () => void;
  /** Retry a previously failed message. */
  retryMessage: (messageId: string) => void;
  /** Enqueue a message to send after the current turn completes. */
  enqueue: (msg: QueuedMessage) => void;
  /** Remove a queued message by index. */
  removeQueued: (index: number) => void;
  /** Current message queue. */
  readonly queue: readonly QueuedMessage[];
}

// ─── Adapter atom (null before hydration) ───────────────────────────

export const sendMessageAdapterAtom = atom<SendMessageAdapter | null>(null);
sendMessageAdapterAtom.debugLabel = "sendMessageAdapterAtom";
