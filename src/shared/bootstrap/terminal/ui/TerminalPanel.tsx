/**
 * TerminalPanel — RFC-TERMINAL-005 §11, Assembled Bottom Panel
 *
 * The full terminal panel that combines all Phase A+B components:
 * - Session tabs (top)
 * - xterm.js viewport (z-0)
 * - Semantic overlay with blocks, rail, sticky header (z-10)
 * - Search overlay (z-25)
 *
 * This is the single component mounted in the app shell's bottom panel.
 *
 * Session, search, command, and resize logic are extracted into
 * focused hooks under ./hooks/ for SRP compliance.
 */

import { memo, useCallback, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import { useBlockNavigation } from "../lib/useBlockNavigation";
import { useFEParserFallback } from "../lib/useFEParserFallback";
import { useGhostText } from "../lib/useGhostText";
import { usePluginParserSync } from "../lib/usePluginParserSync";
import { useTerminalKeyboard } from "../lib/useTerminalKeyboard";
import { useTerminalProblemsSync } from "../lib/useTerminalProblemsSync";
import { showAICommandInputAtom, terminalCommandSearchVisibleAtom } from "../model/aiAtoms";
import { activeSessionCommandsAtom } from "../model/atoms";
import type { TerminalCommand } from "../model/types";
import { AICommandInput } from "./AICommandInput";
import { AIExplainPopover } from "./AIExplainPopover";
import { AIGhostText } from "./AIGhostText";
import { BlockOutline } from "./BlockOutline";
import { CommandSearchOverlay } from "./CommandSearchOverlay";
import { useResizableSidebar } from "./hooks/useResizableSidebar";
import { useTerminalCommands } from "./hooks/useTerminalCommands";
import { useTerminalSearch } from "./hooks/useTerminalSearch";
import { useTerminalSessions } from "./hooks/useTerminalSessions";
import { JumpToBottom } from "./JumpToBottom";
import { OverlayRoot } from "./OverlayRoot";
import { TerminalSearchOverlay } from "./TerminalSearchOverlay";
import { TerminalSessionTabs } from "./TerminalSessionTabs";
import { TerminalViewportRaw, type TerminalViewportRawHandle } from "./TerminalViewportRaw";

// ─── Component ─────────────────────────────────────────────

export interface TerminalViewProps {
  className?: string;
}

/** @deprecated Use TerminalViewProps instead */
export type TerminalPanelProps = TerminalViewProps;

export const TerminalView = memo(function TerminalView({ className }: TerminalViewProps) {
  const viewportRef = useRef<TerminalViewportRawHandle>(null);
  const activeCommands = useAtomValue(activeSessionCommandsAtom);
  const showAIInput = useSetAtom(showAICommandInputAtom);
  const setCommandSearchVisible = useSetAtom(terminalCommandSearchVisibleAtom);

  // ─── Extracted hooks ─────────────────────────────────────
  const { sessions, activeSessionId, createSession: handleCreateSession } = useTerminalSessions();
  const { searchState, searchHandlers } = useTerminalSearch(viewportRef);
  const { sidebarWidth, sidebarElRef, handleResizePointerDown } = useResizableSidebar();

  // ─── Phase C hooks (FE parsers, plugin sync, problems sync) ──
  useFEParserFallback();
  usePluginParserSync();
  useTerminalProblemsSync();

  // ─── Ghost text (history-based completion) ──────────────
  const ghostText = useGhostText();
  const inputBufferRef = useRef("");

  const handleTerminalInput = useCallback(
    (data: string) => {
      // Enter or Ctrl-C: reset buffer
      if (data === "\r" || data === "\n" || data === "\x03") {
        inputBufferRef.current = "";
        ghostText.clearGhostText();
        return;
      }
      // Backspace
      if (data === "\x7f" || data === "\b") {
        inputBufferRef.current = inputBufferRef.current.slice(0, -1);
      } else if (data.length === 1 && data >= " ") {
        // Printable character
        inputBufferRef.current += data;
      }
      ghostText.updateGhostText(inputBufferRef.current);
    },
    [ghostText],
  );

  // ─── Block navigation ─────────────────────────────────────
  const scrollToCommand = useCallback((command: TerminalCommand) => {
    if (!command.outputLineRange) return;
    viewportRef.current?.scrollToLine(command.outputLineRange.start);
  }, []);
  const blockNav = useBlockNavigation(scrollToCommand);

  // ─── Command actions (uses blockNav) ──────────────────────
  const {
    handleRerun,
    handleCommandRailClick,
    handleCopyCommand,
    handleCopyBlock,
    handleOpenProblems,
    handleAskAgent,
    handleExplain,
    handleAskAgentFocused,
    handleAIExecute,
    intents,
  } = useTerminalCommands(viewportRef, blockNav);

  // ─── Keyboard shortcuts (block navigation + search + AI) ─
  const handleCommandSearchOpen = useCallback(() => {
    setCommandSearchVisible(true);
  }, [setCommandSearchVisible]);

  const handleKeyDown = useTerminalKeyboard({
    navigation: blockNav,
    onSearchOpen: () => searchHandlers.setSearchOpen(true),
    onAICommandInput: showAIInput,
    onCommandSearch: handleCommandSearchOpen,
    onAskAgent: handleAskAgentFocused,
  });

  return (
    <div
      className={cn("flex h-full", "bg-vsc-bg", className)}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="region"
      aria-label="Terminal panel"
      data-testid="terminal-panel"
    >
      {/* Left: Viewport + Overlay stack */}
      <div className="flex flex-col flex-1 min-w-0 px-2">
        <div className="relative flex-1 min-h-0">
          {/* All sessions stay mounted; only active is visible (preserves xterm state) */}
          {sessions.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-vsc-text-ghost select-none">
              <Icon name="terminal" size={32} className="opacity-30" />
              <div className="text-sm">No terminal sessions</div>
              <div className="text-xs text-vsc-text-ghost/60">Open a terminal to get started</div>
            </div>
          ) : (
            sessions.map((s) => (
              <div
                key={s.sessionId}
                className="absolute inset-0"
                style={{ display: s.sessionId === activeSessionId ? "flex" : "none" }}
              >
                <TerminalViewportRaw
                  sessionId={s.sessionId}
                  onSearchResults={searchHandlers.handleSearchResults}
                  onScroll={blockNav.onUserScroll}
                  onInput={s.sessionId === activeSessionId ? handleTerminalInput : undefined}
                  ref={s.sessionId === activeSessionId ? viewportRef : undefined}
                />
              </div>
            ))
          )}

          {/* z-10: Semantic overlay (blocks, rail, decorations) */}
          <OverlayRoot
            onRerun={handleRerun}
            onCommandRailClick={handleCommandRailClick}
            onCopyCommand={handleCopyCommand}
            onCopyBlock={handleCopyBlock}
            onOpenProblems={handleOpenProblems}
            onAskAgent={handleAskAgent}
            onExplain={handleExplain}
            onDiagnosticClick={intents.openDiagnostic}
            onFileLinkClick={intents.openFile}
            onUrlClick={intents.openUrl}
            focusedCommandId={blockNav.focusedCommandId}
          />

          {/* z-15: Jump to bottom button (when auto-follow disabled) */}
          <JumpToBottom visible={!blockNav.autoFollow} onClick={blockNav.jumpToBottom} />

          {/* z-11: Ghost text suggestion overlay */}
          <AIGhostText />

          {/* z-22: AI Command Input (Cmd+I) */}
          <AICommandInput onExecute={handleAIExecute} />

          {/* z-23: AI Explain popover */}
          <AIExplainPopover onExecuteFix={handleAIExecute} onAskAgent={handleAskAgentFocused} />

          {/* z-24: Command search overlay (Cmd+K) */}
          <CommandSearchOverlay onExecute={handleAIExecute} />

          {/* z-25: Search overlay */}
          <TerminalSearchOverlay
            isOpen={searchState.searchOpen}
            onClose={searchHandlers.handleSearchClose}
            onSearch={searchHandlers.handleSearch}
            onNavigate={searchHandlers.handleSearchNavigate}
            matchCount={searchState.matchCount}
            currentMatch={searchState.currentMatch}
          />
        </div>

        {/* Bottom status bar */}
        <TerminalStatusBar sessionCount={sessions.length} activeSessionId={activeSessionId} />
      </div>

      {/* Resize handle */}
      <div
        onPointerDown={handleResizePointerDown}
        className={cn(
          "w-px shrink-0 cursor-col-resize",
          "bg-vsc-border/20 hover:bg-vsc-accent/60",
          "transition-colors duration-fast",
        )}
      />

      {/* Right: Sidebar — block outline + session tabs */}
      <div
        ref={sidebarElRef}
        style={{ width: sidebarWidth }}
        className="shrink-0 flex flex-col min-h-0 bg-vsc-surface-0"
      >
        {/* Block navigator (mini outline of command blocks) */}
        {activeCommands.length > 0 && (
          <BlockOutline
            commands={activeCommands}
            activeCommandId={blockNav.focusedCommandId ?? undefined}
            onCommandClick={handleCommandRailClick}
            className="mx-1 mt-1 mb-0.5"
          />
        )}
        <div className="flex-1 min-h-0 overflow-hidden">
          <TerminalSessionTabs onCreateSession={handleCreateSession} />
        </div>
      </div>
    </div>
  );
});

// ─── Status Bar ────────────────────────────────────────────

interface TerminalStatusBarProps {
  sessionCount: number;
  activeSessionId: string | null;
}

const TerminalStatusBar = memo(function TerminalStatusBar({
  sessionCount,
  activeSessionId,
}: TerminalStatusBarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-2 py-0.5",
        "bg-vsc-surface-0 border-t border-vsc-border/30",
        "text-3xs text-vsc-text-ghost select-none",
      )}
    >
      <span>
        {sessionCount} session{sessionCount !== 1 ? "s" : ""}
      </span>
      {activeSessionId && (
        <span className="font-mono opacity-50 truncate max-w-[200px]">{activeSessionId}</span>
      )}
    </div>
  );
});

/** @deprecated Use TerminalView instead */
export { TerminalView as TerminalPanel };
