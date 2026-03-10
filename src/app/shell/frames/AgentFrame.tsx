import React from "react";

import { Icon } from "~shared/ui";

// ─── Types ──────────────────────────────────────────────

interface AgentFrameProps {
  width: number;
  children?: React.ReactNode;
}

// ─── Component ──────────────────────────────────────────

/**
 * Right-side AI Agent frame with SOTA++ breathing glow effect.
 * Houses the chat conversation, prompt box, and agent interactions.
 */
export const AgentFrame = React.memo(function AgentFrame({ width, children }: AgentFrameProps) {
  return (
    <aside
      data-keyboard-zone="agent-panel"
      className="flex flex-col h-full shrink-0 border-l border-vsc-border/30 overflow-hidden bg-vsc-bg ai-breathe"
      style={{ width }}
    >
      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {children ?? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-vsc-text-tertiary">
            {/* Animated AI placeholder */}
            <div className="relative">
              <Icon name="hubot" size={32} className="opacity-20" />
              <span
                className="absolute -inset-2 rounded-full bg-vsc-accent/5"
                style={{ animation: "ai-breathe 3s ease-in-out infinite" }}
              />
            </div>
            <span className="text-xs text-vsc-text-ghost">AI Agent</span>
            <span className="text-2xs text-vsc-text-ghost/50">⌘K ⌘K to toggle</span>
          </div>
        )}
      </div>
    </aside>
  );
});
