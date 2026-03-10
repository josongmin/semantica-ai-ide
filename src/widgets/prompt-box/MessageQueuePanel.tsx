import React, { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { messageQueueAtom, removeQueuedMessageAtom } from "~shared/bootstrap/send-message";

import { useAnimatedPresence } from "../../shared/lib/hooks/useAnimatedPresence";
import { cn, Icon, Text } from "../../shared/ui";

/**
 * Displays queued messages inside the prompt box as a single list.
 * Each row is a record within one shared container — dividers separate items.
 * Auto-hides when queue is empty with exit animation to prevent layout jitter.
 */
export const MessageQueuePanel = React.memo(function MessageQueuePanel() {
  const queue = useAtomValue(messageQueueAtom);
  const removeAt = useSetAtom(removeQueuedMessageAtom);
  const { mounted, exiting, onAnimationEnd } = useAnimatedPresence(queue.length > 0, 150);

  const handleRemove = useCallback(
    (index: number) => {
      removeAt(index);
    },
    [removeAt],
  );

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "mx-1.5 mb-1.5 rounded-xl border border-vsc-border/40 bg-vsc-surface-1 overflow-hidden",
        exiting && "animate-[collapse-height-out_150ms_ease]",
      )}
      data-testid="message-queue-panel"
      onAnimationEnd={onAnimationEnd}
    >
      <div className="max-h-[180px] overflow-y-auto">
        {queue.map((msg, index) => (
          <div
            key={msg.text.slice(0, 40)}
            className="flex items-center gap-2 px-3 py-1.5
                       hover:bg-vsc-list-hover/50 transition-colors duration-fast
                       group/qi"
          >
            {/* Icon */}
            <Icon name="list-ordered" tokenSize="xs" className="text-vsc-text-ghost shrink-0" />

            {/* Message text */}
            <Text size="xs" tone="secondary" truncate className="flex-1 min-w-0">
              {msg.text}
            </Text>

            {/* Attachment indicator */}
            {msg.attachments.length > 0 && (
              <span className="flex items-center gap-1 shrink-0 text-vsc-text-ghost">
                <Icon name="attach" tokenSize="xs" />
                <Text size="xs" tone="ghost">
                  {msg.attachments.length}
                </Text>
              </span>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                className="h-6 px-2.5 rounded-full text-2xs font-medium
                           bg-transparent text-vsc-text-secondary border border-vsc-border
                           hover:bg-vsc-toolbar hover:text-vsc-text-primary
                           transition-colors duration-fast cursor-pointer focus-ring"
                aria-label={`Steer queued message ${index + 1}`}
              >
                Steer
              </button>

              <button
                type="button"
                onClick={() => handleRemove(index)}
                aria-label={`Remove queued message ${index + 1}`}
                className="flex items-center justify-center size-6 rounded-md
                           text-vsc-text-ghost hover:text-vsc-error hover:bg-vsc-error/10
                           transition-colors duration-fast cursor-pointer focus-ring"
              >
                <Icon name="trash" tokenSize="xs" />
              </button>

              <button
                type="button"
                aria-label={`More actions for queued message ${index + 1}`}
                className="flex items-center justify-center size-6 rounded-md
                           text-vsc-text-ghost hover:text-vsc-text-secondary hover:bg-vsc-toolbar
                           transition-colors duration-fast cursor-pointer focus-ring"
              >
                <Icon name="ellipsis" tokenSize="xs" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
