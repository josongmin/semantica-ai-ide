import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";

import { messageAtomFamily } from "~entities/message/core";

import { useEditMessage } from "../../features/edit-message";
import { editingMessageIdAtom } from "../../shared/lib";
import type { MessageId } from "../../shared/protocol";
import { Button, Icon, Text } from "../../shared/ui";

/** Max visible rows for the edit textarea */
const EDIT_TEXTAREA_MAX_ROWS = 6;

/** Stable time format options -- avoids creating new object each render */
const TIME_FORMAT_HM: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
};

interface UserMessageRowProps {
  messageId: MessageId;
}

/**
 * User message row — right-aligned bubble with timestamp on hover.
 * Supports inline editing.
 */
export const UserMessageRow = React.memo(function UserMessageRow({
  messageId,
}: UserMessageRowProps) {
  const msg = useAtomValue(messageAtomFamily(messageId));
  const editingId = useAtomValue(editingMessageIdAtom);
  const { startEdit, cancelEdit, submitEdit } = useEditMessage();
  const isEditing = editingId === messageId;
  const [editText, setEditText] = useState("");
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const text = msg?.text ?? "";

  const handleStartEdit = useCallback(() => {
    setEditText(text);
    startEdit(messageId);
  }, [text, messageId, startEdit]);

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

  // Focus edit textarea when entering edit mode
  useEffect(() => {
    if (isEditing && editTextareaRef.current) {
      editTextareaRef.current.focus();
      editTextareaRef.current.selectionStart = editTextareaRef.current.value.length;
    }
  }, [isEditing]);

  if (!msg) return null;

  const timestamp =
    msg.created_at_ms > 0
      ? new Date(msg.created_at_ms).toLocaleTimeString([], TIME_FORMAT_HM)
      : null;

  return (
    <article
      className="py-2.5 group/msg animate-[message-in_200ms_var(--ease-spring)] flex flex-col items-end"
      aria-label="Your message"
      data-testid="message-row"
    >
      {/* Role label + timestamp + actions */}
      <div className="flex items-center gap-1.5 mb-1 pr-1">
        {!isEditing && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleStartEdit}
            aria-label="Edit message"
            className="opacity-0 group-hover/msg:opacity-100 focus:opacity-100 transition-opacity duration-fast
                       text-vsc-text-tertiary hover:text-vsc-text-primary p-0.5"
            title="Edit"
            icon="edit"
          />
        )}
        {timestamp && (
          <Text size="2xs" tone="ghost" mono>
            {timestamp}
          </Text>
        )}
        {msg.user_name && (
          <>
            <Text size="2xs" weight="medium" tone="secondary">
              {msg.user_name}
            </Text>
            <Icon name="account" tokenSize="sm" className="text-vsc-text-ghost" />
          </>
        )}
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-1 w-full max-w-[85%] animate-[fade-in_var(--duration-normal)_var(--ease-default)]">
          <textarea
            ref={editTextareaRef}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={handleEditKeyDown}
            rows={Math.min(editText.split("\n").length + 1, EDIT_TEXTAREA_MAX_ROWS)}
            className="w-full resize-none bg-vsc-input-bg text-vsc-input-fg border border-vsc-focus
                       rounded-md px-3 py-1.5 text-xs leading-relaxed
                       focus-ring"
            aria-label="Edit message"
          />
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelEdit}
              className="text-2xs text-vsc-text-secondary"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmitEdit}
              disabled={!editText.trim()}
              className="text-2xs"
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div className="max-w-[85%] px-3 py-2 rounded-lg bg-vsc-accent/8 border border-vsc-accent/15 text-md leading-normal whitespace-pre-wrap wrap-break-word">
          {text}
        </div>
      )}
    </article>
  );
});
