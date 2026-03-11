import { useCallback, useEffect, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { sessionMetaAtom } from "~entities/session/state";
import { enqueueMessageAtom, messageQueueAtom } from "~shared/bootstrap/send-message";

import { sendMessageAdapterAtom } from "../../../shared/lib/atoms";
import type { useFileAttachments } from "./useFileAttachments";

export interface UsePromptSendOptions {
  text: string;
  setText: (v: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  resetTextareaHeight: () => void;
  attachments: ReturnType<typeof useFileAttachments>["attachments"];
  clearAttachments: () => void;
  pushHistory: (entry: string) => void;
}

/**
 * Send logic, stop agent, message queueing, and the
 * "resume after running" side-effect that drains the queue.
 */
export function usePromptSend({
  text,
  setText,
  textareaRef,
  resetTextareaHeight,
  attachments,
  clearAttachments,
  pushHistory,
}: UsePromptSendOptions) {
  const sendAdapter = useAtomValue(sendMessageAdapterAtom);
  const send = sendAdapter?.send;
  const stopAgent = sendAdapter?.stopAgent;
  const meta = useAtomValue(sessionMetaAtom);
  const isRunning = meta.status === "running";
  const messageQueue = useAtomValue(messageQueueAtom);
  const setMessageQueue = useSetAtom(messageQueueAtom);
  const enqueueMessage = useSetAtom(enqueueMessageAtom);

  // ─── Send / Stop ────────────────────────────────────────
  const [sending, setSending] = useState(false);
  const sendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    // Prevent double-submit for 300ms
    setSending(true);
    if (sendingTimerRef.current !== null) clearTimeout(sendingTimerRef.current);
    sendingTimerRef.current = setTimeout(() => {
      setSending(false);
      sendingTimerRef.current = null;
    }, 300);

    pushHistory(trimmed);

    if (isRunning) {
      enqueueMessage({ text: trimmed, attachments: [...attachments] });
      setText("");
      clearAttachments();
    } else {
      send?.(trimmed);
      setText("");
    }
    resetTextareaHeight();
  }, [
    text,
    sending,
    isRunning,
    send,
    pushHistory,
    enqueueMessage,
    attachments,
    clearAttachments,
    setText,
    resetTextareaHeight,
  ]);

  // Cleanup sending timer on unmount
  useEffect(() => {
    return () => {
      if (sendingTimerRef.current !== null) clearTimeout(sendingTimerRef.current);
    };
  }, []);

  const handleStop = useCallback(() => {
    stopAgent?.();
  }, [stopAgent]);

  // ─── Drain queue when agent stops ──────────────────────
  const prevRunningRef = useRef(false);
  useEffect(() => {
    const wasRunning = prevRunningRef.current;
    prevRunningRef.current = isRunning;

    if (wasRunning && !isRunning) {
      textareaRef.current?.focus();
      if (messageQueue.length > 0) {
        const first = messageQueue[0];
        setMessageQueue(messageQueue.slice(1));
        if (first) {
          send?.(first.text, first.attachments);
        }
      }
    }
  }, [isRunning, messageQueue, setMessageQueue, send, textareaRef]);

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !sending;

  return {
    send,
    sending,
    isRunning,
    canSend,
    enqueueMessage,
    handleSend,
    handleStop,
  };
}
