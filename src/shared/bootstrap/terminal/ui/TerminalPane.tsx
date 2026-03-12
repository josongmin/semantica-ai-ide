/**
 * TerminalPane — A single terminal viewport with its overlay stack.
 *
 * Extracted from TerminalView to support split-pane layout.
 * Each pane wraps one xterm session + overlays. Only the focused pane
 * receives keyboard shortcuts and AI overlays.
 */

import { memo, useCallback, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { cn } from "~shared/ui/variants";

import { isTerminalBridgeReady, writeToPty } from "../lib/tauriTerminalBridge";
import { mockGenerateCommand } from "../lib/useAICommandSuggest";
import { useBlockNavigation } from "../lib/useBlockNavigation";
import { useGhostText } from "../lib/useGhostText";
import { useTerminalKeyboard } from "../lib/useTerminalKeyboard";
import {
  AI_INLINE_PREFIX,
  type AIInlineIntent,
  showAICommandInputAtom,
  terminalCommandSearchVisibleAtom,
} from "../model/aiAtoms";
import { activeSessionCommandsAtom } from "../model/atoms";
import { activeTerminalSessionIdAtom } from "../model/sessionAtoms";
import type { TerminalCommand } from "../model/types";
import { AICommandInput } from "./AICommandInput";
import { AIExplainPopover } from "./AIExplainPopover";
import { AIGhostText } from "./AIGhostText";
import { BlockOutline } from "./BlockOutline";
import { CommandSearchOverlay } from "./CommandSearchOverlay";
import { useTerminalCommands } from "./hooks/useTerminalCommands";
import { useTerminalSearch } from "./hooks/useTerminalSearch";
import { JumpToBottom } from "./JumpToBottom";
import { OverlayRoot } from "./OverlayRoot";
import { AIModeBadge } from "./TerminalAIInline";
import { TerminalSearchOverlay } from "./TerminalSearchOverlay";
import {
  TerminalCommandPalette,
  type TerminalSlashCommandId,
  useTerminalSlashCommand,
} from "./TerminalSlashCommands";
import { TerminalViewportRaw, type TerminalViewportRawHandle } from "./TerminalViewportRaw";

export interface TerminalPaneProps {
  sessionId: string;
  isFocused: boolean;
  onFocus: (sessionId: string) => void;
  /** Show block outline inside the pane (only for single-pane mode) */
  showBlockOutline?: boolean;
  /** Session actions for slash commands */
  onSplitSession?: () => void;
  onCreateSession?: () => void;
  onCloseSession?: () => void;
}

export const TerminalPane = memo(function TerminalPane({
  sessionId,
  isFocused,
  onFocus,
  showBlockOutline = false,
  onSplitSession,
  onCreateSession,
  onCloseSession,
}: TerminalPaneProps) {
  const viewportRef = useRef<TerminalViewportRawHandle>(null);
  const activeCommands = useAtomValue(activeSessionCommandsAtom);
  const showAIInput = useSetAtom(showAICommandInputAtom);
  const setCommandSearchVisible = useSetAtom(terminalCommandSearchVisibleAtom);
  const setActiveSessionId = useSetAtom(activeTerminalSessionIdAtom);

  // ─── Search ────────────────────────────────────────────────
  const { searchState, searchHandlers } = useTerminalSearch(viewportRef);

  // ─── Ghost text (history-based completion) ──────────────
  const ghostText = useGhostText();
  const inputBufferRef = useRef("");
  const [aiModeIntent, setAiModeIntent] = useState<AIInlineIntent | null>(null);

  const handleTerminalInput = useCallback(
    (data: string) => {
      // ─── Reset on line-terminating / line-editing control chars ────
      // Enter, newline, Ctrl+C
      if (data === "\r" || data === "\n" || data === "\x03") {
        inputBufferRef.current = "";
        ghostText.clearGhostText();
        setAiModeIntent(null);
        return;
      }

      // Readline operations that desync our buffer with the shell's actual state:
      // Ctrl+U (kill-line), Ctrl+W (kill-word), Ctrl+K (kill-to-end),
      // Ctrl+A/E (home/end), Ctrl+L (clear), Tab (completion)
      const cc = data.charCodeAt(0);
      if (
        data.length === 1 &&
        (cc === 0x15 ||
          cc === 0x17 ||
          cc === 0x0b || // Ctrl+U, Ctrl+W, Ctrl+K
          cc === 0x01 ||
          cc === 0x05 ||
          cc === 0x0c || // Ctrl+A, Ctrl+E, Ctrl+L
          cc === 0x09) // Tab
      ) {
        inputBufferRef.current = "";
        ghostText.clearGhostText();
        setAiModeIntent(null);
        return;
      }

      // Ignore escape sequences (arrow keys \x1b[A, Home/End, etc.)
      // These modify cursor position in ways we can't track — reset to avoid desync
      if (data.startsWith("\x1b")) {
        inputBufferRef.current = "";
        ghostText.clearGhostText();
        setAiModeIntent(null);
        return;
      }

      // Backspace / Delete — grapheme-aware to handle emoji & combining marks
      if (data === "\x7f" || data === "\b") {
        const segments = Array.from(inputBufferRef.current); // codepoint-aware (handles surrogate pairs)
        segments.pop();
        inputBufferRef.current = segments.join("");
      } else if (data.charCodeAt(0) >= 0x20) {
        // Printable text — single char, multi-char paste, emoji, CJK all accepted
        inputBufferRef.current += data;
      }

      ghostText.updateGhostText(inputBufferRef.current);

      // ─── Detect ##ai prefix for AI mode badge ────
      const buf = inputBufferRef.current;
      let detectedIntent: AIInlineIntent | null = null;
      const sortedPrefixes = Object.entries(AI_INLINE_PREFIX).sort(
        ([, a], [, b]) => b.length - a.length,
      );
      for (const [intent, prefix] of sortedPrefixes) {
        if (buf.startsWith(prefix)) {
          detectedIntent = intent as AIInlineIntent;
          break;
        }
      }
      setAiModeIntent(detectedIntent);
    },
    [ghostText],
  );

  // ─── Block navigation ─────────────────────────────────────
  const scrollToCommand = useCallback((command: TerminalCommand) => {
    if (!command.outputLineRange) return;
    viewportRef.current?.scrollToLine(command.outputLineRange.start);
  }, []);
  const blockNav = useBlockNavigation(scrollToCommand);

  // ─── Command actions ──────────────────────────────────────
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

  // ─── Keyboard shortcuts (only for focused pane) ───────────
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

  // ─── Slash command palette ────────────────────────────────
  const slashCmd = useTerminalSlashCommand();
  const [slashAnchor, setSlashAnchor] = useState<{ x: number; y: number } | null>(null);

  const handleSlashCommand = useCallback(
    (position: { x: number; y: number }) => {
      setSlashAnchor(position);
      slashCmd.open();
    },
    [slashCmd],
  );

  /** Write ##ai prefix to terminal prompt (user types query in terminal) */
  const writeAIPrefix = useCallback(
    (intent: AIInlineIntent) => {
      if (!isTerminalBridgeReady()) return;
      const prefix = AI_INLINE_PREFIX[intent];
      void writeToPty(sessionId, `${prefix} `);
      inputBufferRef.current = `${prefix} `;
      setAiModeIntent(intent);
    },
    [sessionId],
  );

  /** Intercept Enter when ##ai prefix detected — don't let shell execute it */
  const handleBeforeInput = useCallback(
    (data: string): boolean => {
      if (data !== "\r") return false;

      const buf = inputBufferRef.current;
      // Match longest prefix first (##ai-fix before ##ai)
      const sorted = Object.entries(AI_INLINE_PREFIX).sort(([, a], [, b]) => b.length - a.length);
      let matchedIntent: AIInlineIntent | null = null;
      let matchedPrefix = "";
      for (const [intent, prefix] of sorted) {
        if (buf.startsWith(`${prefix} `) || buf === prefix) {
          matchedIntent = intent as AIInlineIntent;
          matchedPrefix = prefix;
          break;
        }
      }
      if (!matchedIntent) return false;

      const query = buf.slice(matchedPrefix.length).trim();
      inputBufferRef.current = "";
      setAiModeIntent(null);

      if (!query) {
        // No query — just clear the line
        if (isTerminalBridgeReady()) void writeToPty(sessionId, "\x15\r");
        return true;
      }

      // Generate AI response
      const suggestion = mockGenerateCommand(query, null);
      const intentLabel = { fix: "FIX", explain: "EXPLAIN", ask: "AI" }[matchedIntent];

      // Format ANSI colored response
      const lines = [
        `\x1b[1;35m✦ ${intentLabel}\x1b[0m \x1b[36m${suggestion.command}\x1b[0m`,
        `\x1b[2m  ${suggestion.explanation}\x1b[0m`,
      ];
      if (suggestion.alternatives != null && suggestion.alternatives.length > 0) {
        lines.push(`\x1b[2m  alt: ${suggestion.alternatives.join(" | ")}\x1b[0m`);
      }
      const response = `\r\n${lines.join("\r\n")}\r\n`;

      // Clear the typed ##ai text from shell, show response, get fresh prompt
      if (isTerminalBridgeReady()) {
        // Tauri mode: Ctrl+C aborts current line, then display response + fresh prompt
        void writeToPty(sessionId, "\x03");
        setTimeout(() => {
          viewportRef.current?.writeToDisplay(response);
        }, 40);
      } else {
        // Mock/dev mode: just display response directly
        viewportRef.current?.writeToDisplay(response);
      }

      return true;
    },
    [sessionId],
  );

  const handleSlashSelect = useCallback(
    (id: TerminalSlashCommandId) => {
      slashCmd.close();
      setSlashAnchor(null);

      switch (id) {
        case "ai-ask":
          writeAIPrefix("ask");
          break;
        case "ai-fix":
          writeAIPrefix("fix");
          break;
        case "ai-explain":
          writeAIPrefix("explain");
          break;
        case "session-split":
          onSplitSession?.();
          break;
        case "session-new-tab":
          onCreateSession?.();
          break;
        case "session-close":
          onCloseSession?.();
          break;
        case "util-clear":
          handleAIExecute("clear");
          break;
        case "util-search":
          searchHandlers.setSearchOpen(true);
          break;
        case "util-copy-output":
          if (blockNav.focusedCommandId) {
            const cmd = activeCommands.find((c) => c.commandId === blockNav.focusedCommandId);
            if (cmd) handleCopyBlock(cmd);
          }
          break;
        case "util-open-editor":
          // TODO: open current directory in editor
          break;
      }
    },
    [
      slashCmd,
      writeAIPrefix,
      onSplitSession,
      onCreateSession,
      onCloseSession,
      searchHandlers,
      handleCopyBlock,
      handleAIExecute,
      blockNav.focusedCommandId,
      activeCommands,
    ],
  );

  const handleSlashClose = useCallback(() => {
    slashCmd.close();
    setSlashAnchor(null);
  }, [slashCmd]);

  const handleSlashKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        slashCmd.moveSelection(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        slashCmd.moveSelection(-1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const id = slashCmd.getSelectedCommandId();
        if (id) handleSlashSelect(id);
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleSlashClose();
      }
    },
    [slashCmd, handleSlashSelect, handleSlashClose],
  );

  const handlePaneFocus = useCallback(() => {
    onFocus(sessionId);
    setActiveSessionId(sessionId as never);
  }, [sessionId, onFocus, setActiveSessionId]);

  return (
    <div
      className={cn(
        "flex flex-col flex-1 min-w-0",
        "hover:bg-vsc-surface-1/30",
        isFocused && "ring-1 ring-vsc-border/50 ring-inset rounded-sm",
      )}
      onFocus={handlePaneFocus}
      onPointerDown={handlePaneFocus}
      onKeyDown={isFocused ? handleKeyDown : undefined}
      tabIndex={-1}
    >
      <div className="relative flex-1 min-h-0">
        <div className="absolute inset-0 flex">
          <TerminalViewportRaw
            sessionId={sessionId}
            onSearchResults={searchHandlers.handleSearchResults}
            onScroll={blockNav.onUserScroll}
            onInput={isFocused ? handleTerminalInput : undefined}
            onSlashCommand={isFocused ? handleSlashCommand : undefined}
            onBeforeInput={isFocused ? handleBeforeInput : undefined}
            ref={viewportRef}
          />
        </div>

        {/* Semantic overlay */}
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

        <JumpToBottom visible={!blockNav.autoFollow} onClick={blockNav.jumpToBottom} />

        {/* AI overlays only for focused pane */}
        {isFocused && (
          <>
            <AIGhostText />
            <AICommandInput onExecute={handleAIExecute} />
            <AIExplainPopover onExecuteFix={handleAIExecute} onAskAgent={handleAskAgentFocused} />
            <CommandSearchOverlay onExecute={handleAIExecute} />
            <AIModeBadge
              visible={aiModeIntent !== null}
              intent={aiModeIntent ?? "ask"}
              viewportRef={viewportRef}
            />
          </>
        )}

        {/* Search overlay */}
        <TerminalSearchOverlay
          isOpen={searchState.searchOpen}
          onClose={searchHandlers.handleSearchClose}
          onSearch={searchHandlers.handleSearch}
          onNavigate={searchHandlers.handleSearchNavigate}
          matchCount={searchState.matchCount}
          currentMatch={searchState.currentMatch}
        />

        {/* Slash command palette */}
        {isFocused && (
          <TerminalCommandPalette
            open={slashCmd.isOpen}
            query={slashCmd.query}
            groups={slashCmd.filteredGroups}
            selectedIndex={slashCmd.selectedIndex}
            anchorPosition={slashAnchor}
            onSelect={handleSlashSelect}
            onHover={slashCmd.setSelectedIndex}
            onQueryChange={slashCmd.setQuery}
            onKeyDown={handleSlashKeyDown}
            onClose={handleSlashClose}
          />
        )}
      </div>

      {/* Block outline inside pane (single mode only) */}
      {showBlockOutline && activeCommands.length > 0 && (
        <BlockOutline
          commands={activeCommands}
          activeCommandId={blockNav.focusedCommandId ?? undefined}
          onCommandClick={handleCommandRailClick}
          className="mx-1 mt-0.5 mb-0.5"
        />
      )}
    </div>
  );
});
