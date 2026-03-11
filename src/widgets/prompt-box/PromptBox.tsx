import React from "react";

import { cn, CommandPalette, Icon, Text } from "../../shared/ui";
import { AttachmentChips } from "./AttachmentChips";
import { FileMentionPopover } from "./FileMentionPopover";
import { usePromptBoxLogic } from "./hooks/usePromptBoxLogic";
import { MessageQueuePanel } from "./MessageQueuePanel";
import { PromptHistorySearchOverlay } from "./PromptHistorySearchOverlay";
import { PromptStatusBar } from "./PromptStatusBar";

// ─── Quote Preview ──────────────────────────────────────────

const PromptQuotePreview = React.memo(function PromptQuotePreview({
  quote,
  onClear,
}: {
  quote: { text: string };
  onClear: () => void;
}) {
  return (
    <div
      className="flex items-start gap-2 mx-2.5 mt-2 px-2.5 py-1.5 rounded border-l-2 border-vsc-focus/50 bg-vsc-surface-1/50"
      data-testid="pending-quote"
    >
      <Icon name="quote" tokenSize="2xs" className="text-vsc-text-ghost mt-0.5 shrink-0" />
      <Text size="xs" tone="secondary" className="flex-1 line-clamp-2 whitespace-pre-wrap">
        {quote.text}
      </Text>
      <button
        type="button"
        onClick={onClear}
        aria-label="Remove quote"
        className="p-0.5 rounded hover:bg-vsc-toolbar cursor-pointer shrink-0 focus-ring"
      >
        <Icon name="close" tokenSize="2xs" className="text-vsc-text-tertiary" />
      </button>
    </div>
  );
});

// ─── PromptBox ──────────────────────────────────────────────

/**
 * Multiline prompt input box with slash command palette.
 * Enter to send, Shift+Enter for newline, Esc to stop.
 * Type "/" to open the command palette with fuzzy autocomplete.
 */
export const PromptBox = React.memo(function PromptBox() {
  const {
    // State
    text,
    isRunning,
    pendingQuote,
    attachments,
    projectFiles,

    // Refs
    textareaRef,
    containerRef,

    // Slash command
    slashCmd,

    // Mention
    mention,

    // Drag & drop
    dragDrop: { dropRef, isDragging, handleDragOver, handleDragLeave, handleDrop },

    // Computed
    activeDescendant,
    argHint,

    // Handlers
    canSend,
    handleSend,
    handleStop,
    handleHistorySelect,
    handleOpenCommands,
    handleKeyDown,
    handleInput,
    handlePaste,
    clearQuote,
    removeFile,
  } = usePromptBoxLogic();

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="mx-2 mb-1 mt-0.5">
      <MessageQueuePanel />

      <div
        ref={dropRef}
        className={cn(
          "relative rounded-lg overflow-hidden border border-vsc-border bg-vsc-surface-1",
          isDragging && "ring-2 ring-inset ring-vsc-focus ring-dashed",
        )}
        data-testid="prompt-box"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-[--z-overlay] flex items-center justify-center bg-vsc-surface-1/80 backdrop-blur-sm pointer-events-none rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-vsc-focus/10 border border-vsc-focus/30">
              <Icon name="cloud-upload" tokenSize="sm" className="text-vsc-focus" />
              <Text size="sm" weight="medium" tone="primary">
                Drop files to attach
              </Text>
            </div>
          </div>
        )}

        <PromptHistorySearchOverlay onSelect={handleHistorySelect} />

        <CommandPalette
          open={slashCmd.isOpen}
          onClose={slashCmd.close}
          groups={slashCmd.groups}
          selectedIndex={slashCmd.selectedIndex}
          onSelect={slashCmd.executeCommand}
          onHover={slashCmd.setSelectedIndex}
          query={slashCmd.query}
          anchorRef={containerRef}
          argHint={argHint}
        />

        <FileMentionPopover
          open={mention.mentionOpen}
          onClose={mention.closeMention}
          onSelect={mention.handleMentionSelect}
          files={projectFiles}
          query={mention.mentionQuery}
          anchorRect={mention.mentionAnchorRect}
        />

        {pendingQuote && <PromptQuotePreview quote={pendingQuote} onClear={clearQuote} />}

        <AttachmentChips attachments={attachments} onRemove={removeFile} className="px-2.5 pt-2" />

        <div ref={containerRef} className="px-2.5 pt-1 pb-0.5">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              isRunning
                ? "Agent is working… (Enter to queue, Esc to stop)"
                : "Esc to focus or unfocus input"
            }
            aria-label="Message input"
            aria-expanded={slashCmd.isOpen || mention.mentionOpen}
            aria-controls={slashCmd.isOpen ? "command-palette" : undefined}
            aria-activedescendant={activeDescendant}
            rows={1}
            className="w-full resize-none bg-transparent text-vsc-input-fg border-none
                       py-1.5 text-xs leading-normal
                       placeholder:text-vsc-text-ghost focus:outline-none
                       disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <PromptStatusBar
          isRunning={isRunning}
          attachments={attachments}
          onOpenCommands={handleOpenCommands}
          onSend={handleSend}
          onStop={handleStop}
          canSend={canSend}
        />
      </div>
    </div>
  );
});
