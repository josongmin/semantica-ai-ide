import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSetAtom } from "jotai";

import { setPendingQuoteAtom } from "../../shared/lib";
import type { MessageId } from "../../shared/protocol";
import { Icon, Text } from "../../shared/ui";

interface QuoteSelectionPopoverProps {
  readonly messageId: MessageId;
  readonly containerRef: React.RefObject<HTMLElement | null>;
}

interface PopoverPosition {
  readonly top: number;
  readonly left: number;
}

/**
 * Small popover that appears when user selects text in a message.
 * Shows a "Quote" button that sets the selected text as pending quote.
 */
export const QuoteSelectionPopover = React.memo(function QuoteSelectionPopover({
  messageId,
  containerRef,
}: QuoteSelectionPopoverProps) {
  const [selectedText, setSelectedText] = useState("");
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const setPendingQuote = useSetAtom(setPendingQuoteAtom);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !containerRef.current) {
      setPosition(null);
      setSelectedText("");
      return;
    }

    const text = selection.toString().trim();
    if (!text) {
      setPosition(null);
      setSelectedText("");
      return;
    }

    // Check selection is within our container
    const range = selection.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) {
      setPosition(null);
      setSelectedText("");
      return;
    }

    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    setSelectedText(text);

    // Position above selection, clamped within container
    const POPOVER_HEIGHT = 32;
    const POPOVER_HALF_WIDTH = 40;
    let top = rect.top - containerRect.top - POPOVER_HEIGHT;
    let left = rect.left - containerRect.left + rect.width / 2;

    // Clamp top so popover doesn't go above container
    if (top < 0) top = rect.bottom - containerRect.top + 4;
    // Clamp horizontal within container bounds
    left = Math.max(POPOVER_HALF_WIDTH, Math.min(left, containerRect.width - POPOVER_HALF_WIDTH));

    setPosition({ top, left });
  }, [containerRef]);

  const handleQuote = useCallback(() => {
    if (!selectedText) return;
    setPendingQuote({ message_id: messageId, text: selectedText });
    setPosition(null);
    setSelectedText("");
    window.getSelection()?.removeAllRanges();
  }, [selectedText, messageId, setPendingQuote]);

  // Listen for mouseup within the container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("mouseup", handleMouseUp);
    return () => container.removeEventListener("mouseup", handleMouseUp);
  }, [containerRef, handleMouseUp]);

  // Close on outside click
  useEffect(() => {
    if (!position) return;

    const handleDocClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPosition(null);
        setSelectedText("");
      }
    };
    // Delay attaching to avoid immediately closing
    const timer = setTimeout(() => document.addEventListener("mousedown", handleDocClick), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleDocClick);
    };
  }, [position]);

  if (!position || !selectedText) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute z-[--z-overlay] animate-[fade-in_150ms_ease]"
      style={{ top: position.top, left: position.left, transform: "translateX(-50%)" }}
      data-testid="quote-selection-popover"
    >
      <button
        type="button"
        onClick={handleQuote}
        className="flex items-center gap-1 px-2 py-1 rounded-md shadow-md
                   bg-vsc-surface-1 border border-vsc-border
                   hover:bg-vsc-list-hover transition-colors duration-fast cursor-pointer text-xs focus-ring"
        title="Quote this text"
      >
        <Icon name="quote" tokenSize="2xs" className="text-vsc-text-secondary" />
        <Text size="2xs" weight="medium">
          Quote
        </Text>
      </button>
    </div>
  );
});
