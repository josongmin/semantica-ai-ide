/**
 * Hydrate hook that populates the send-message adapter atom.
 * Called once at bootstrap time from StreamingBootstrap.
 */
import { useEffect, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  type SendMessageAdapter,
  sendMessageAdapterAtom,
} from "~shared/lib/atoms/sendMessageAdapterAtoms";

import { enqueueMessageAtom, messageQueueAtom, removeQueuedMessageAtom } from "./messageQueueAtoms";
import { useSendMessage } from "./useSendMessage";

export function useHydrateSendMessageAdapter(): void {
  const { send, stopAgent, retryMessage } = useSendMessage();
  const queue = useAtomValue(messageQueueAtom);
  const enqueueMsg = useSetAtom(enqueueMessageAtom);
  const removeMsg = useSetAtom(removeQueuedMessageAtom);
  const setAdapter = useSetAtom(sendMessageAdapterAtom);

  const adapter: SendMessageAdapter = useMemo(
    () => ({
      send,
      stopAgent,
      retryMessage,
      enqueue: enqueueMsg,
      removeQueued: removeMsg,
      queue,
    }),
    [send, stopAgent, retryMessage, enqueueMsg, removeMsg, queue],
  );

  useEffect(() => {
    setAdapter(adapter);
  }, [setAdapter, adapter]);
}
