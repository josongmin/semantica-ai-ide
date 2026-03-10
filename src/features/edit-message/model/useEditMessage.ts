import { useCallback } from "react";
import { useSetAtom, useStore } from "jotai";

import { messageAtomFamily } from "~entities/message/core";

import { editingMessageIdAtom, getVscodeApi } from "../../../shared/lib";
import type { MessageId } from "../../../shared/protocol";

/**
 * Hook for inline editing of user messages.
 * Allows starting, cancelling, and submitting edits.
 */
export function useEditMessage() {
  const store = useStore();
  const setEditing = useSetAtom(editingMessageIdAtom);

  const startEdit = useCallback(
    (id: MessageId) => {
      setEditing(id);
    },
    [setEditing],
  );

  const cancelEdit = useCallback(() => {
    setEditing(null);
  }, [setEditing]);

  const submitEdit = useCallback(
    (id: MessageId, newText: string) => {
      const trimmed = newText.trim();
      if (!trimmed) return;

      const msg = store.get(messageAtomFamily(id));
      if (!msg) return;

      store.set(messageAtomFamily(id), { ...msg, text: trimmed });
      getVscodeApi().postMessage({ type: "EDIT_MESSAGE", messageId: id, text: trimmed });
      setEditing(null);
    },
    [store, setEditing],
  );

  return { startEdit, cancelEdit, submitEdit };
}
