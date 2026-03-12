import React from "react";

import type { Attachment } from "../../shared/protocol";
import { Button, Icon, Text } from "../../shared/ui";
import { AgentRequestModeSelector } from "../agent-request-mode";
import { ModelSwitcherMenu } from "../model-switcher";
import { ProgressIndicator } from "../progress-indicator";
import { VoiceInputButton } from "../voice-input";

export interface PromptStatusBarProps {
  isRunning: boolean;
  attachments: readonly Attachment[];
  onOpenCommands: () => void;
  onSend: () => void;
  onStop: () => void;
  canSend: boolean;
  hideActionButton?: boolean;
}

/**
 * Primary action button logic:
 *  - Typing text → always Send (arrow-up), regardless of streaming
 *  - No text + streaming → Stop (square)
 *  - No text + idle → Send disabled
 */
export const PromptStatusBar = React.memo(function PromptStatusBar({
  isRunning,
  attachments,
  onOpenCommands,
  onSend,
  onStop,
  canSend,
  hideActionButton,
}: PromptStatusBarProps) {
  const showStop = isRunning && !canSend;

  return (
    <div className="flex items-center gap-0.5 pr-1 pb-0.5 pt-0.5 min-h-6 text-3xs [&_button]:text-3xs flex-wrap">
      {/* Model + ASK mode */}
      <ModelSwitcherMenu className="text-3xs shrink-0" />
      <AgentRequestModeSelector className="text-3xs shrink-0" />

      {/* Attached files (images excluded — shown as thumbnails above) */}
      {attachments.filter((a) => a.type !== "image").length > 0 && (
        <div className="flex items-center gap-1.5">
          {attachments
            .filter((a) => a.type !== "image")
            .map((att) => (
              <span key={att.path} className="flex items-center gap-1 text-vsc-text-secondary">
                <Icon name="symbol-file" tokenSize="2xs" className="text-vsc-text-ghost" />
                <Text as="span" size="2xs" truncate className="max-w-[140px]">
                  {att.name}
                </Text>
              </span>
            ))}
        </div>
      )}

      <div className="flex-1" />

      {/* Tools — visible when idle OR streaming */}
      <div className="flex items-center gap-0.5 min-h-6 shrink-0">
        {isRunning && <ProgressIndicator />}
        {!isRunning && (
          <>
            <VoiceInputButton />
            <Button
              variant="ghost"
              size="xs"
              icon="attach"
              className="text-vsc-text-ghost hover:text-vsc-text-secondary transition-none p-0.5 min-h-5 min-w-5 [&_.codicon]:text-2xs"
              title="Attach file"
              aria-label="Attach file"
            />
            <Button
              variant="ghost"
              size="xs"
              onClick={onOpenCommands}
              className="text-vsc-text-ghost hover:text-vsc-text-secondary transition-none font-medium p-0.5 min-h-5 min-w-5"
              title="Commands"
              aria-label="Open commands"
            >
              /
            </Button>
          </>
        )}
      </div>

      {/* Primary action — single button that morphs between Send ↔ Stop */}
      {!hideActionButton &&
        (showStop ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onStop}
            aria-label="Stop agent"
            className="w-3.5 h-3.5 rounded-full bg-vsc-error/20 text-vsc-error hover:bg-vsc-error/30 transition-none p-0"
            title="Stop (Esc)"
          >
            <Icon name="primitive-square" tokenSize="2xs" className="text-3xs" />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="icon"
            onClick={canSend ? onSend : undefined}
            disabled={!canSend}
            aria-label={isRunning ? "Queue message" : "Send message"}
            className="w-3.5 h-3.5 rounded-full disabled:opacity-30 transition-none p-0"
            style={{ backgroundColor: "var(--color-gnb-accent)" }}
            title={isRunning ? "Queue (Enter)" : "Send (Enter)"}
          >
            <Icon name="arrow-up" tokenSize="3xs" />
          </Button>
        ))}
    </div>
  );
});
