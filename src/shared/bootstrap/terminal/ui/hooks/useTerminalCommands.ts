/**
 * useTerminalCommands — extracted from TerminalPanel
 *
 * Command action handlers for terminal blocks:
 * - Rerun a command via PTY
 * - Copy command text / block markdown
 * - Open problems panel
 * - Ask agent (explain, fix, debug)
 * - Scroll to command via rail click
 */

import { useCallback } from "react";
import { useAtomValue } from "jotai";

import { logger } from "~shared/lib/logger";

import { blockToMarkdown } from "../../lib/blockExport";
import { isTerminalBridgeReady, writeToPty } from "../../lib/tauriTerminalBridge";
import { useAIExplain } from "../../lib/useAIExplain";
import type { BlockNavigationActions, BlockNavigationState } from "../../lib/useBlockNavigation";
import { useTerminalIntentDispatch } from "../../lib/useTerminalIntentDispatch";
import { activeTerminalSessionIdAtom, terminalParsedEventMapAtom } from "../../model/atoms";
import type { DiagnosticEvent, TerminalCommand } from "../../model/types";
import type { TerminalViewportRawHandle } from "../TerminalViewportRaw";

export function useTerminalCommands(
  viewportRef: React.RefObject<TerminalViewportRawHandle | null>,
  blockNav: BlockNavigationState & BlockNavigationActions,
) {
  const activeSessionId = useAtomValue(activeTerminalSessionIdAtom);
  const parsedEventMap = useAtomValue(terminalParsedEventMapAtom);
  const { requestExplain } = useAIExplain();
  const intents = useTerminalIntentDispatch();

  const handleRerun = useCallback(
    (command: TerminalCommand) => {
      if (!activeSessionId || !isTerminalBridgeReady()) return;
      writeToPty(activeSessionId, `${command.command}\n`).catch((err: unknown) => {
        logger.warn("[TerminalPanel] Rerun failed:", err);
      });
    },
    [activeSessionId],
  );

  const handleCommandRailClick = useCallback(
    (command: TerminalCommand) => {
      if (!command.outputLineRange) return;
      viewportRef.current?.scrollToLine(command.outputLineRange.start);
    },
    [viewportRef],
  );

  const handleCopyCommand = useCallback((command: TerminalCommand) => {
    void navigator.clipboard.writeText(command.command);
  }, []);

  const handleCopyBlock = useCallback(
    (command: TerminalCommand) => {
      const events = activeSessionId
        ? (parsedEventMap.get(activeSessionId) ?? [])
        : [];
      const md = blockToMarkdown(command, events);
      void navigator.clipboard.writeText(md);
    },
    [activeSessionId, parsedEventMap],
  );

  const handleOpenProblems = useCallback(
    (command: TerminalCommand, diagnostics: DiagnosticEvent[]) => {
      intents.openProblems(command, diagnostics);
    },
    [intents],
  );

  const handleAskAgent = useCallback(
    (command: TerminalCommand, intent: "explain" | "fix" | "debug") => {
      intents.askAgent(command, intent);
    },
    [intents],
  );

  const handleExplain = useCallback(
    (command: TerminalCommand) => {
      // Trigger inline explain popover (shows loading -> mock AI result)
      requestExplain(command);
      // Also dispatch to agent bridge for deeper analysis
      intents.askAgent(command, "explain");
    },
    [intents, requestExplain],
  );

  // Ask agent about the currently focused block
  const handleAskAgentFocused = useCallback(() => {
    if (blockNav.focusedCommand?.status === "failed") {
      intents.askAgent(blockNav.focusedCommand, "fix");
    }
  }, [blockNav.focusedCommand, intents]);

  // Execute a command string via PTY (used by AI command input)
  const handleAIExecute = useCallback(
    (command: string) => {
      if (!activeSessionId || !isTerminalBridgeReady()) return;
      writeToPty(activeSessionId, `${command}\n`).catch((err: unknown) => {
        logger.warn("[TerminalPanel] AI command exec failed:", err);
      });
    },
    [activeSessionId],
  );

  return {
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
  } as const;
}
