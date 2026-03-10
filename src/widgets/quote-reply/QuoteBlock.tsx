import React from "react";

import type { MessageId } from "../../shared/protocol";
import { Icon, Text } from "../../shared/ui";

interface QuoteBlockProps {
  readonly quotedText: string;
  readonly quotedMessageId?: MessageId;
}

/**
 * Renders quoted text with a left border bar and reference to original message.
 * Displayed above message content when a message quotes another.
 */
export const QuoteBlock = React.memo(function QuoteBlock({
  quotedText,
  quotedMessageId,
}: QuoteBlockProps) {
  return (
    <div
      className="border-l-2 border-vsc-focus/50 pl-2.5 py-1 mb-1.5 rounded-r bg-vsc-surface-1/50"
      role="blockquote"
      data-testid="quote-block"
    >
      <div className="flex items-center gap-1 mb-0.5">
        <Icon name="quote" tokenSize="2xs" className="text-vsc-text-ghost" />
        <Text size="xs" tone="ghost">
          {quotedMessageId ? `Replying to message` : "Quote"}
        </Text>
      </div>
      <Text size="xs" tone="secondary" className="line-clamp-3 whitespace-pre-wrap break-words">
        {quotedText}
      </Text>
    </div>
  );
});
