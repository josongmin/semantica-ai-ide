import React, { useCallback } from "react";
import { useSetAtom } from "jotai";

import { currentPageAtom, newTabAtom } from "~shared/lib";
import { Icon } from "~shared/ui";

import { activeSurfaceAtom } from "../model/shellAtoms";

// ─── Types ──────────────────────────────────────────────

interface AgentFrameProps {
  width: number;
  children?: React.ReactNode;
}

// ─── Component ──────────────────────────────────────────

/**
 * Right-side AI Agent frame with SOTA++ breathing glow effect.
 * Houses the chat conversation, prompt box, and agent interactions.
 * Cube Cloud 스타일: History | New Chat 헤더.
 */
export const AgentFrame = React.memo(function AgentFrame({ width, children }: AgentFrameProps) {
  const setActiveSurface = useSetAtom(activeSurfaceAtom);
  const setCurrentPage = useSetAtom(currentPageAtom);
  const newTab = useSetAtom(newTabAtom);

  const handleHistory = useCallback(() => {
    setActiveSurface("chat");
    setCurrentPage("sessions");
  }, [setActiveSurface, setCurrentPage]);

  const handleNewChat = useCallback(() => {
    setActiveSurface("chat");
    setCurrentPage("chat");
    newTab();
  }, [setActiveSurface, setCurrentPage, newTab]);

  return (
    <aside
      data-keyboard-zone="agent-panel"
      className="flex flex-col h-full shrink-0 overflow-hidden bg-white ai-breathe"
      style={{ width }}
    >
      {/* History | New Chat 헤더 (children 있을 때만) */}
      {Boolean(children) && (
        <div className="flex items-center gap-4 px-3 h-[36px] border-b border-vsc-border/20 shrink-0 bg-white">
          <button
            type="button"
            onClick={handleHistory}
            className="text-xs text-vsc-text-tertiary hover:text-vsc-fg transition-colors duration-fast focus-ring"
            aria-label="History"
          >
            History
          </button>
          <button
            type="button"
            onClick={handleNewChat}
            className="text-xs text-vsc-accent hover:underline font-medium transition-colors duration-fast focus-ring"
            aria-label="New Chat"
          >
            New Chat
          </button>
        </div>
      )}

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
