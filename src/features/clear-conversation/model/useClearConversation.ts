import { useCallback } from "react";
import { useStore } from "jotai";

import { resetDiffStoreAtom } from "~entities/diff";
import { resetMessageStoreAtom } from "~entities/message/writers";
import { resetSessionStoreAtom } from "~entities/session/state";
import { resetTimelineStoreAtom } from "~entities/timeline-event";
import { resetToolCallStoreAtom } from "~entities/tool-call";

import { clearAttachmentsAtom } from "../../../shared/lib";
import { getVscodeApi } from "../../../shared/lib/vscodeApi";

export function useClearConversation(): { clearConversation: () => void } {
  const store = useStore();

  const clearConversation = useCallback(() => {
    getVscodeApi().postMessage({ type: "CLEAR_CONVERSATION" });

    // Optimistically reset local stores
    store.set(resetMessageStoreAtom);
    store.set(resetDiffStoreAtom);
    store.set(resetToolCallStoreAtom);
    store.set(resetTimelineStoreAtom);
    store.set(resetSessionStoreAtom);
    store.set(clearAttachmentsAtom);
  }, [store]);

  return { clearConversation };
}
