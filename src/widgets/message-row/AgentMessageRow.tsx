import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";

import {
  effectiveAgentRoleForMessageAtomFamily,
  messageAtomFamily,
} from "~entities/message/core";

import { getAgentRoleConfig } from "../../entities/agent-identity";
import { writeToClipboard } from "../../shared/lib";
import { sendMessageAdapterAtom } from "../../shared/lib/atoms";
import type { MessageId } from "../../shared/protocol";
import {
  Button,
  cn,
  COPY_FEEDBACK_MS,
  ErrorBoundary,
  Icon,
  InlineBanner,
  MessageSkeleton,
  Text,
  ThinkingIndicator,
} from "../../shared/ui";
import { ErrorClassification } from "../error-classification";
import { MarkdownContent } from "../markdown-content";
import { QuoteBlock, QuoteSelectionPopover } from "../quote-reply";

/** Stable time format options -- avoids creating new object each render */
const TIME_FORMAT_HM: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
};

interface AgentMessageRowProps {
  messageId: MessageId;
}

/**
 * Agent / System message row — full-width markdown + copy/retry + thinking indicator.
 */
export const AgentMessageRow = React.memo(function AgentMessageRow({
  messageId,
}: AgentMessageRowProps) {
  const msg = useAtomValue(messageAtomFamily(messageId));
  const effectiveRole = useAtomValue(effectiveAgentRoleForMessageAtomFamily(messageId));
  const sendAdapter = useAtomValue(sendMessageAdapterAtom);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController>();
  const messageContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      clearTimeout(copyTimerRef.current);
    };
  }, []);

  const text = msg?.text ?? "";

  const handleCopy = useCallback(() => {
    if (!text) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;
    clearTimeout(copyTimerRef.current);
    writeToClipboard(text).then(
      () => {
        if (signal.aborted) return;
        setCopyState("copied");
        copyTimerRef.current = setTimeout(() => setCopyState("idle"), COPY_FEEDBACK_MS);
      },
      () => {
        if (signal.aborted) return;
        setCopyState("failed");
        copyTimerRef.current = setTimeout(() => setCopyState("idle"), COPY_FEEDBACK_MS);
      },
    );
  }, [text]);

  const handleRetry = useCallback(() => {
    sendAdapter?.retryMessage(messageId);
  }, [sendAdapter, messageId]);

  if (!msg) return null;

  const isStreaming = msg.status === "streaming";
  const isError = msg.status === "error";
  const hasText = text.length > 0;

  // Skip empty agent/system messages that have no visible content
  if (!isStreaming && !hasText && !isError && !msg.diff_loaded && !msg.quoted_text) {
    return null;
  }

  const timestamp =
    msg.created_at_ms > 0
      ? new Date(msg.created_at_ms).toLocaleTimeString([], TIME_FORMAT_HM)
      : null;

  // Approximate token count (1 token ~ 4 characters for English)
  const tokenEstimate = hasText ? Math.ceil(text.length / 4) : 0;

  return (
    <article
      className="py-2.5 group/msg relative animate-[message-in_200ms_var(--ease-spring)]"
      aria-label={msg.role === "system" ? "System message" : "Agent message"}
      aria-busy={isStreaming}
      data-testid="message-row"
    >
      {/* Role label + timestamp + token count + actions */}
      <div className="flex items-center gap-1.5 mb-1.5">
        {msg.role === "system" ? (
          <>
            <Icon name="info" tokenSize="xs" className="text-vsc-text-ghost" />
            <Text size="2xs" weight="medium" tone="ghost">
              System
            </Text>
          </>
        ) : (
          (() => {
            const roleConfig = getAgentRoleConfig(effectiveRole);
            return (
              <>
                <Icon
                  name={roleConfig.icon}
                  tokenSize="xs"
                  className={cn("shrink-0", roleConfig.textClass)}
                />
                <Text size="2xs" weight="semibold" className={roleConfig.textClass}>
                  {msg.agent_name ?? roleConfig.label}
                </Text>
              </>
            );
          })()
        )}
        {timestamp && (
          <Text size="2xs" tone="ghost" mono>
            {timestamp}
          </Text>
        )}
        {tokenEstimate > 0 && !isStreaming && (
          <Text
            size="2xs"
            tone="ghost"
            className="opacity-0 group-hover/msg:opacity-70 transition-opacity duration-fast"
            mono
            title={`~${tokenEstimate.toLocaleString()} tokens`}
            data-testid="token-count"
          >
            ~{tokenEstimate > 999 ? `${(tokenEstimate / 1000).toFixed(1)}k` : tokenEstimate} tok
          </Text>
        )}
        <div className="flex-1" />
        {/* Action buttons — visible on hover */}
        {!isStreaming && hasText && (
          <div className="flex gap-1 opacity-0 group-hover/msg:opacity-100 focus-within:opacity-100 transition-opacity duration-fast">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              aria-label="Copy message"
              className="text-vsc-text-tertiary hover:text-vsc-text-primary transition-colors duration-fast p-0.5"
              title={(() => {
                if (copyState === "copied") return "Copied!";
                if (copyState === "failed") return "Copy failed";
                return "Copy";
              })()}
              icon={(() => {
                if (copyState === "copied") return "check";
                if (copyState === "failed") return "error";
                return "copy";
              })()}
            />
          </div>
        )}
        {/* Retry on error — hidden when classified_error provides its own retry UI */}
        {isError && !msg.classified_error && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleRetry}
            aria-label="Retry"
            className="text-2xs"
            icon="refresh"
          >
            Retry
          </Button>
        )}
      </div>

      {/* Quoted message reference */}
      {msg.quoted_text && (
        <QuoteBlock quotedText={msg.quoted_text} quotedMessageId={msg.quoted_message_id} />
      )}

      {/* Message content */}
      <div ref={messageContentRef} className="text-md leading-normal relative">
        {isStreaming && !hasText ? (
          <>
            <MessageSkeleton />
            <ThinkingIndicator />
          </>
        ) : (
          <div className={cn(isStreaming && "animate-[streaming-reveal_0.5s_ease-out]")}>
            <ErrorBoundary
              fallback={(err) => (
                <InlineBanner variant="error">Failed to render message: {err.message}</InlineBanner>
              )}
            >
              <MarkdownContent text={text} />
            </ErrorBoundary>
          </div>
        )}
        {/* Quote selection popover for agent messages */}
        {!isStreaming && hasText && (
          <QuoteSelectionPopover messageId={messageId} containerRef={messageContentRef} />
        )}
      </div>

      {/* Classified error detail */}
      {isError && msg.classified_error && (
        <div className="mt-1.5">
          <ErrorClassification error={msg.classified_error} onRetry={handleRetry} />
        </div>
      )}

      {/* Fallback error detail (unclassified) */}
      {isError && !msg.classified_error && msg.error_detail && (
        <div className="mt-1.5 px-2 py-1.5 rounded bg-vsc-error/5 border border-vsc-error/15 text-xs text-vsc-error/80">
          {msg.error_detail}
        </div>
      )}

      {/* Diff preview */}
      {msg.diff_loaded && (
        <pre className="mt-1.5 p-2 rounded text-xs bg-vsc-code-bg overflow-auto leading-tight max-h-[--panel-max-h-md]">
          {msg.diff_loaded}
        </pre>
      )}
    </article>
  );
});
