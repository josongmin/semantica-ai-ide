import { useCallback, useEffect, useState } from "react";

import { getVscodeApi } from "../../../shared/lib";

/** Grace period before response is actually sent — allows undo */
export const UNDO_WINDOW_MS = 2500;

// ─── Undo-able submission hook ──────────────────────────────
export function useUndoableSubmit(requestId: string) {
  const [pendingAnswer, setPendingAnswer] = useState<{ answer: string | string[]; sentAt: number } | null>(null);
  const [countdown, setCountdown] = useState(0);

  const submit = useCallback(
    (answer: string | string[]) => {
      setPendingAnswer({ answer, sentAt: Date.now() });
      setCountdown(UNDO_WINDOW_MS);
    },
    [],
  );

  const undo = useCallback(() => {
    setPendingAnswer(null);
    setCountdown(0);
  }, []);

  // Countdown tick + auto-commit
  useEffect(() => {
    if (!pendingAnswer) return;
    const interval = setInterval(() => {
      const remaining = UNDO_WINDOW_MS - (Date.now() - pendingAnswer.sentAt);
      if (remaining <= 0) {
        clearInterval(interval);
        getVscodeApi().postMessage({
          type: "RESPOND_USER_INPUT",
          request_id: requestId,
          answer: pendingAnswer.answer,
        });
        setPendingAnswer(null);
        setCountdown(0);
      } else {
        setCountdown(remaining);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [pendingAnswer, requestId]);

  return { pendingAnswer, countdown, submit, undo };
}
