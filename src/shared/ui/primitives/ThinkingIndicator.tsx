import React from "react";

import { cn } from "../variants";
import { Icon } from "./Icon";

export interface ThinkingIndicatorProps {
  label?: string;
  className?: string;
}

/**
 * Animated thinking indicator — 3 bouncing dots.
 * Shown before first token arrives during streaming.
 */
export const ThinkingIndicator = React.memo(function ThinkingIndicator({
  label = "Thinking",
  className,
}: ThinkingIndicatorProps) {
  return (
    <div
      className={cn("flex items-center gap-2 py-2", className)}
      role="status"
      aria-label={`${label}...`}
    >
      <Icon name="hubot" tokenSize="sm" className="text-vsc-text-ghost" />
      <span className="text-xs text-vsc-text-tertiary">{label}</span>
      <span className="flex gap-1" aria-hidden>
        {/* Static list — index key safe */}
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1 h-1 rounded-full bg-vsc-fg/40 animate-[thinking-bounce_1.2s_ease-in-out_infinite]"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
    </div>
  );
});
