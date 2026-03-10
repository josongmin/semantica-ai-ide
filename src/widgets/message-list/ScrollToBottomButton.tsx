import React from "react";

import { cn, Icon } from "../../shared/ui";

export interface ScrollToBottomButtonProps {
  isAtBottom: boolean;
  isRunning: boolean;
  onClick: () => void;
}

/**
 * Floating button that appears when the user scrolls away from the bottom
 * of the message list. Shows a "Responding" indicator when the agent is
 * actively streaming and the user is scrolled up.
 */
export const ScrollToBottomButton = React.memo(function ScrollToBottomButton({
  isAtBottom,
  isRunning,
  onClick,
}: ScrollToBottomButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isRunning && !isAtBottom ? "Responding — click to scroll to bottom" : "Scroll to bottom"}
      aria-hidden={isAtBottom}
      tabIndex={isAtBottom ? -1 : 0}
      className={cn(
        "absolute bottom-2 right-4 z-[--z-overlay] cursor-pointer",
        "bg-vsc-surface-1 border border-vsc-border",
        "flex items-center justify-center",
        "hover:bg-vsc-list-hover transition-all duration-normal focus-ring",
        "rounded-full shadow-md",
        isAtBottom
          ? "opacity-0 pointer-events-none translate-y-2"
          : "opacity-100 translate-y-0",
        isRunning && !isAtBottom
          ? "h-8 px-3 gap-2 animate-[responding-glow_2s_ease-in-out_infinite]"
          : "w-8 h-8",
      )}
      title={isRunning && !isAtBottom ? "Responding — click to scroll" : "Scroll to bottom"}
    >
      {isRunning && !isAtBottom ? (
        <>
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inset-0 rounded-full bg-vsc-info opacity-75" aria-hidden="true" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-vsc-info" />
          </span>
          <span className="text-2xs font-medium text-vsc-text-secondary whitespace-nowrap">
            Responding
          </span>
          <Icon name="chevron-down" tokenSize="sm" className="text-vsc-text-secondary" />
        </>
      ) : (
        <Icon name="chevron-down" tokenSize="base" />
      )}
    </button>
  );
});
