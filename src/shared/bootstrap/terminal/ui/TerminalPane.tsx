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
  /**
   * AI inline mode ref — true once ##ai prefix is detected.
   * Used by handleBeforeInput (ref-based, no re-render dependency).
   * When active, ALL input is routed to AI pipeline; nothing reaches PTY.
   */
  const aiModeActiveRef = useRef(false);
  const [aiModeIntent, setAiModeIntent] = useState<AIInlineIntent | null>(null);

  const handleTerminalInput = useCallback(
    (data: string) => {
      // ─── Reset on line-terminating / line-editing control chars ────
      // Enter, newline, Ctrl+C
      if (data === "\r" || data === "\n" || data === "\x03") {
        inputBufferRef.current = "";
        ghostText.clearGhostText();
        if (!aiModeActiveRef.current) setAiModeIntent(null);
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

      // ─── Detect ##ai prefix → activate AI mode ────
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

      // Transition into AI mode: erase prefix from shell, take over input
      if (detectedIntent && !aiModeActiveRef.current) {
        aiModeActiveRef.current = true;
        // Erase the prefix characters from shell's input buffer with Ctrl+U
        // (they were already sent to PTY before detection)
        if (isTerminalBridgeReady()) void writeToPty(sessionId, "\x15");
        // Re-echo the prefix to xterm display so user still sees it
        viewportRef.current?.writeToDisplay(`\r${buf}`);
      } else if (!detectedIntent && aiModeActiveRef.current) {
        aiModeActiveRef.current = false;
      }

      setAiModeIntent(detectedIntent);
    },
    [ghostText, sessionId],
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

  /** Write ##ai prefix to terminal display and activate AI mode (slash command entry) */
  const writeAIPrefix = useCallback((intent: AIInlineIntent) => {
    const prefix = AI_INLINE_PREFIX[intent];
    // Write prefix to display only (not PTY) — AI mode owns all input from here
    viewportRef.current?.writeToDisplay(`${prefix} `);
    inputBufferRef.current = `${prefix} `;
    aiModeActiveRef.current = true;
    setAiModeIntent(intent);
  }, []);

  /**
   * Gate ALL terminal input through AI pipeline when aiModeActiveRef is true.
   * Called from both attachCustomKeyEventHandler (DOM level) and onData (xterm level).
   * Returns true → data is consumed here; PTY never receives it.
   */
  const handleBeforeInput = useCallback(
    (data: string): boolean => {
      if (!aiModeActiveRef.current) return false;

      // ─── Ctrl+C / Escape: cancel AI mode, let shell handle ────
      if (data === "\x03") {
        aiModeActiveRef.current = false;
        inputBufferRef.current = "";
        setAiModeIntent(null);
        // Let Ctrl+C pass to PTY so shell gets a fresh prompt
        return false;
      }

      // ─── Enter: submit AI query ────
      if (data === "\r") {
        const buf = inputBufferRef.current;
        const sorted = Object.entries(AI_INLINE_PREFIX).sort(([, a], [, b]) => b.length - a.length);
        let matchedIntent: AIInlineIntent = "ask";
        let matchedPrefix = "##ai";
        for (const [intent, prefix] of sorted) {
          if (buf.startsWith(`${prefix} `) || buf === prefix) {
            matchedIntent = intent as AIInlineIntent;
            matchedPrefix = prefix;
            break;
          }
        }

        const query = buf.slice(matchedPrefix.length).trim();
        inputBufferRef.current = "";
        aiModeActiveRef.current = false;
        setAiModeIntent(null);

        if (!query) {
          // No query typed — send Enter to PTY for fresh prompt
          // (shell buffer is already clean since we Ctrl+U'd on mode enter)
          if (isTerminalBridgeReady()) void writeToPty(sessionId, "\r");
          return true;
        }

        // Generate AI response
        const suggestion = mockGenerateCommand(query, null);
        const intentLabel = { fix: "FIX", explain: "EXPLAIN", ask: "AI" }[matchedIntent];

        const lines = [
          `\x1b[1;35m✦ ${intentLabel}\x1b[0m \x1b[36m${suggestion.command}\x1b[0m`,
          `\x1b[2m  ${suggestion.explanation}\x1b[0m`,
        ];
        if (suggestion.alternatives != null && suggestion.alternatives.length > 0) {
          lines.push(`\x1b[2m  alt: ${suggestion.alternatives.join(" | ")}\x1b[0m`);
        }
        const response = `\r\n${lines.join("\r\n")}\r\n`;

        // Shell buffer is already clean (Ctrl+U on mode enter).
        // Send Enter for a fresh prompt, then display AI response.
        if (isTerminalBridgeReady()) {
          void writeToPty(sessionId, "\r");
          setTimeout(() => {
            viewportRef.current?.writeToDisplay(response);
          }, 40);
        } else {
          viewportRef.current?.writeToDisplay(response);
        }

        // Dispatch to agent for deeper analysis
        intents.dispatchAIQuery(matchedIntent, query, matchedIntent === "fix" ? "fix" : "explain");

        return true;
      }

      // ─── Escape sequences (arrows, etc): ignore in AI mode ────
      if (data.startsWith("\x1b")) return true;

      // ─── Backspace: erase from display + buffer ────
      if (data === "\x7f" || data === "\b") {
        // Don't backspace past the prefix
        const sorted = Object.entries(AI_INLINE_PREFIX).sort(([, a], [, b]) => b.length - a.length);
        let prefixLen = 4; // default "##ai"
        for (const [, prefix] of sorted) {
          if (inputBufferRef.current.startsWith(prefix)) {
            prefixLen = prefix.length;
            break;
          }
        }
        if (inputBufferRef.current.length > prefixLen) {
          viewportRef.current?.writeToDisplay("\b \b");
        }
        return true; // always consume — handleTerminalInput updates the buffer
      }

      // ─── Printable chars: echo to display (PTY won't echo since we block it) ────
      if (data.charCodeAt(0) >= 0x20) {
        viewportRef.current?.writeToDisplay(data);
      }

      return true; // consume all input in AI mode
    },
    [sessionId, intents],
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
