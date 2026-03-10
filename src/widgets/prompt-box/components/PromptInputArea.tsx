import React from "react";

import { Icon } from "../../../shared/ui";

interface PromptInputAreaProps {
  text: string;
  textareaRef: React.Ref<HTMLTextAreaElement>;
  containerRef: React.Ref<HTMLDivElement>;
  isRunning: boolean;
  handleInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handlePaste: (e: React.ClipboardEvent) => void;
  handleSend: () => void;
  handleStop: () => void;
  slashCmdOpen: boolean;
  mentionOpen: boolean;
  activeDescendant: string | undefined;
}

/**
 * The core textarea + send/stop button area of the prompt box.
 */
export const PromptInputArea = React.memo(function PromptInputArea({
  text,
  textareaRef,
  containerRef,
  isRunning,
  handleInput,
  handleKeyDown,
  handlePaste,
  handleSend,
  handleStop,
  slashCmdOpen,
  mentionOpen,
  activeDescendant,
}: PromptInputAreaProps) {
  return (
    <div ref={containerRef} className="flex items-end gap-2 px-2 py-2">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={
          isRunning
            ? "Agent is working\u2026 (Esc to stop)"
            : "Esc to focus or unfocus input"
        }
        disabled={isRunning}
        aria-label="Message input"
        aria-expanded={slashCmdOpen || mentionOpen}
        aria-controls={slashCmdOpen ? "command-palette" : undefined}
        aria-activedescendant={activeDescendant}
        rows={1}
        className="flex-1 resize-none bg-transparent text-vsc-input-fg border-none
                   px-3 py-2 text-sm leading-relaxed min-h-[2.5rem]
                   placeholder:text-vsc-text-ghost focus:outline-none
                   transition-[height] duration-normal ease-out
                   disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {isRunning ? (
        <button
          type="button"
          onClick={handleStop}
          aria-label="Stop agent"
          className="flex items-center justify-center w-8 h-8 rounded-sm
                     bg-vsc-error/20 text-vsc-error
                     hover:bg-vsc-error/30 transition-colors duration-fast cursor-pointer focus-ring"
          title="Stop (Esc)"
        >
          <Icon name="debug-stop" />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          aria-label="Send message"
          className="flex items-center justify-center w-7 h-7 rounded-md
                     bg-vsc-button text-vsc-button-fg
                     hover:bg-vsc-button-hover transition-colors duration-fast
                     disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer focus-ring"
          title="Send (Enter)"
        >
          <Icon name="arrow-up" tokenSize="sm" />
        </button>
      )}
    </div>
  );
});
