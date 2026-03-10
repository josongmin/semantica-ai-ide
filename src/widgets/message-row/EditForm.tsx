import React, { useCallback, useEffect, useRef, useState } from "react";

import { useEditMessage } from "../../features/edit-message";
import type { MessageId } from "../../shared/protocol";

/** Max visible rows for the edit textarea */
const EDIT_TEXTAREA_MAX_ROWS = 6;

interface EditFormProps {
  messageId: MessageId;
  initialText: string;
}

/**
 * Inline edit form for user messages — textarea with Save/Cancel.
 * Manages its own local edit text state; receives initial text from parent.
 */
export const EditForm = React.memo(function EditForm({
  messageId,
  initialText,
}: EditFormProps) {
  const { cancelEdit, submitEdit } = useEditMessage();
  const [editText, setEditText] = useState(initialText);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmitEdit = useCallback(() => {
    submitEdit(messageId, editText);
  }, [messageId, editText, submitEdit]);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleSubmitEdit();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        cancelEdit();
      }
    },
    [handleSubmitEdit, cancelEdit],
  );

  // Focus edit textarea on mount
  useEffect(() => {
    if (editTextareaRef.current) {
      editTextareaRef.current.focus();
      editTextareaRef.current.selectionStart = editTextareaRef.current.value.length;
    }
  }, []);

  return (
    <div className="flex flex-col gap-1 w-full max-w-[85%]">
      <textarea
        ref={editTextareaRef}
        value={editText}
        onChange={(e) => setEditText(e.target.value)}
        onKeyDown={handleEditKeyDown}
        rows={Math.min(editText.split("\n").length + 1, EDIT_TEXTAREA_MAX_ROWS)}
        className="w-full resize-none bg-vsc-input-bg text-vsc-input-fg border border-vsc-focus
                   rounded-md px-3 py-1.5 text-xs leading-relaxed
                   focus:outline-none focus:border-vsc-focus focus:ring-1 focus:ring-vsc-focus/30"
        aria-label="Edit message"
      />
      <div className="flex justify-end gap-1">
        <button
          type="button"
          onClick={cancelEdit}
          className="px-2 py-0.5 rounded text-2xs text-vsc-text-secondary
                     hover:bg-vsc-toolbar transition-colors duration-fast cursor-pointer focus-ring"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmitEdit}
          disabled={!editText.trim()}
          className="px-2 py-0.5 rounded text-2xs bg-vsc-button text-vsc-button-fg
                     hover:bg-vsc-button-hover transition-colors duration-fast cursor-pointer focus-ring
                     disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </div>
  );
});
