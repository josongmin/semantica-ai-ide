import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { upsertMessageAtom, upsertTurnAtom } from "~entities/message/writers";
import { clearAttachmentsAtom, pendingAttachmentsAtom } from "~shared/lib";
import { getVscodeApi } from "~shared/lib/vscodeApi";
import type { Attachment, MessageId, TurnId, UiMessage } from "~shared/protocol";

/** Max characters for turn phase summary preview */
const TURN_SUMMARY_MAX_LENGTH = 80;

let messageCounter = 0;
function generateMessageId(): MessageId {
  return `msg-${Date.now()}-${++messageCounter}` as MessageId;
}

let turnCounter = 0;
function generateTurnId(): TurnId {
  return `turn-${Date.now()}-${++turnCounter}` as TurnId;
}

/** Reset counters between tests for isolation */
export function resetSendMessageCounters(): void {
  messageCounter = 0;
  turnCounter = 0;
}

/**
 * Hook for sending user messages.
 * Immediately creates local UiMessage + Turn, then posts to extension host.
 * @param attachmentsOverride - when provided (e.g. from queue), use instead of pendingAttachmentsAtom
 */
export function useSendMessage(): {
  send: (text: string, attachmentsOverride?: readonly Attachment[]) => void;
  stopAgent: () => void;
  retryMessage: (messageId: string) => void;
} {
  const upsertMessage = useSetAtom(upsertMessageAtom);
  const upsertTurn = useSetAtom(upsertTurnAtom);
  const attachments = useAtomValue(pendingAttachmentsAtom);
  const clearAttachments = useSetAtom(clearAttachmentsAtom);

  const send = useCallback(
    (text: string, attachmentsOverride?: readonly Attachment[]) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const attach = attachmentsOverride ?? attachments;

      const msgId = generateMessageId();
      const turnId = generateTurnId();
      const now = Date.now();

      const userMsg: UiMessage = {
        id: msgId,
        turn_id: turnId,
        role: "user",
        created_at_ms: now,
        text: trimmed,
        status: "final",
      };

      upsertMessage(userMsg);
      upsertTurn({
        id: turnId,
        phases: [
          {
            phase: "user_message",
            message_ids: [msgId],
            tool_call_ids: [],
            summary: trimmed.slice(0, TURN_SUMMARY_MAX_LENGTH),
            collapsed: false,
            status: "success",
          },
        ],
        status: "running",
        created_at_ms: now,
      });

      getVscodeApi().postMessage({
        type: "SEND_MESSAGE",
        text: trimmed,
        message_id: msgId,
        turn_id: turnId,
        attachments: attach.length > 0 ? attach : undefined,
      });

      // Clear pending attachments when using atom (not queue override)
      if (!attachmentsOverride && attachments.length > 0) {
        clearAttachments();
      }
    },
    [upsertMessage, upsertTurn, attachments, clearAttachments],
  );

  const stopAgent = useCallback(() => {
    getVscodeApi().postMessage({ type: "STOP_AGENT" });
  }, []);

  const retryMessage = useCallback((messageId: string) => {
    getVscodeApi().postMessage({
      type: "RETRY_MESSAGE",
      messageId,
    });
  }, []);

  return { send, stopAgent, retryMessage };
}
