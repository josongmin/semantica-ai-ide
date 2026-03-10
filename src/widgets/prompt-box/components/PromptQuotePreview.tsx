import React from "react";

import { Button, Icon, Text } from "../../../shared/ui";

interface PromptQuotePreviewProps {
  quote: { text: string };
  onClear: () => void;
}

/**
 * Displays a pending quote preview above the prompt input,
 * with a dismiss button.
 */
export const PromptQuotePreview = React.memo(function PromptQuotePreview({
  quote,
  onClear,
}: PromptQuotePreviewProps) {
  return (
    <div
      className="flex items-start gap-2 mx-2.5 mt-2 px-2.5 py-1.5 rounded border-l-2 border-vsc-focus/50 bg-vsc-surface-1/50"
      data-testid="pending-quote"
    >
      <Icon name="quote" tokenSize="2xs" className="text-vsc-text-ghost mt-0.5 shrink-0" />
      <Text size="xs" tone="secondary" className="flex-1 line-clamp-2 whitespace-pre-wrap">
        {quote.text}
      </Text>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClear}
        aria-label="Remove quote"
        icon="close"
        className="shrink-0 text-vsc-text-tertiary"
      />
    </div>
  );
});
