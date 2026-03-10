import React, { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  acceptAutoMemoryForTurnAtom,
  autoMemorySuggestionsFamily,
  dismissAutoMemoryForTurnAtom,
} from "../../features/auto-memory";
import type { TurnId } from "../../shared/protocol";
import { Button, Icon, Text } from "../../shared/ui";

interface AutoMemoryToastProps {
  readonly turnId: TurnId;
}

/**
 * Inline suggestion card appearing below a turn.
 * Shows "Remember this?" with the pattern description.
 * Accept (creates memory rule) / Dismiss buttons.
 * Confidence indicator via subtle opacity.
 */
export const AutoMemoryToast = React.memo(function AutoMemoryToast({
  turnId,
}: AutoMemoryToastProps) {
  const suggestions = useAtomValue(autoMemorySuggestionsFamily(turnId));
  const accept = useSetAtom(acceptAutoMemoryForTurnAtom);
  const dismiss = useSetAtom(dismissAutoMemoryForTurnAtom);

  const handleAccept = useCallback(
    (id: string) => {
      accept({ id, turn_id: turnId });
    },
    [accept, turnId],
  );

  const handleDismiss = useCallback(
    (id: string) => {
      dismiss({ id, turn_id: turnId });
    },
    [dismiss, turnId],
  );

  if (suggestions.length === 0) return null;

  return (
    <>
      {suggestions.map((suggestion, i) => (
        <div
          key={suggestion.id}
          role="alert"
          className="mx-4 my-2 pl-4 pr-2.5 py-2.5 rounded-lg border border-vsc-info/30 bg-vsc-info/5
                     flex items-start gap-2.5 transition-opacity duration-normal
                     animate-[slide-up-in_200ms_var(--ease-spring)]"
          style={{
            opacity: 0.6 + suggestion.confidence * 0.4,
            animationDelay: `${i * 60}ms`,
            animationFillMode: "both",
            fontFamily: "var(--font-chat)",
          }}
          data-testid={`auto-memory-toast-${suggestion.id}`}
        >
          <Icon name="lightbulb" tokenSize="sm" className="text-vsc-info shrink-0 mt-0.5" />

          <div className="flex-1 min-w-0">
            <Text size="xs" weight="medium" className="mb-0.5">
              Remember this?
            </Text>
            <Text size="2xs" tone="secondary" className="line-clamp-2">
              {suggestion.title}: {suggestion.content}
            </Text>

            {/* Confidence bar */}
            <div className="mt-1 h-0.5 w-full rounded-full bg-vsc-border overflow-hidden">
              <div
                className="h-full rounded-full bg-vsc-info transition-[width] duration-normal"
                style={{ width: `${Math.round(suggestion.confidence * 100)}%` }}
                aria-label={`Confidence: ${Math.round(suggestion.confidence * 100)}%`}
              />
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              icon="check"
              aria-label={`Accept suggestion: ${suggestion.title}`}
              onClick={() => handleAccept(suggestion.id)}
            />
            <Button
              variant="ghost"
              size="sm"
              icon="close"
              aria-label={`Dismiss suggestion: ${suggestion.title}`}
              onClick={() => handleDismiss(suggestion.id)}
            />
          </div>
        </div>
      ))}
    </>
  );
});
