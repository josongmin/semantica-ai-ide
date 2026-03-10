/**
 * JumpToBottom — RFC-TERMINAL-004 §7.2
 *
 * Floating button that appears when user scrolls away from the bottom.
 * Clicking re-enables auto-follow and jumps to the latest output.
 */

import { memo } from "react";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

export interface JumpToBottomProps {
  visible: boolean;
  onClick: () => void;
  className?: string;
}

export const JumpToBottom = memo(function JumpToBottom({
  visible,
  onClick,
  className,
}: JumpToBottomProps) {
  if (!visible) return null;

  return (
    <button
      type="button"
      className={cn(
        "absolute bottom-4 left-1/2 -translate-x-1/2 z-[15]",
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
        "bg-vsc-surface-2/95 backdrop-blur-sm",
        "border border-vsc-border/40",
        "text-2xs text-vsc-text-secondary",
        "shadow-md",
        "hover:bg-vsc-accent/20 hover:text-vsc-accent hover:border-vsc-accent/40",
        "active:scale-95",
        "transition-[background-color,color,border-color] duration-fast",
        "pointer-events-auto cursor-pointer focus-ring",
        "animate-in fade-in slide-in-from-bottom-2",
        className,
      )}
      onClick={onClick}
      title="Jump to bottom"
    >
      <Icon name="arrow-down" size={12} />
      <span className="font-medium whitespace-nowrap">Jump to bottom</span>
    </button>
  );
});
