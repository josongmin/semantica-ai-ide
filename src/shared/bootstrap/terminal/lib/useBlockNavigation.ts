/**
 * useBlockNavigation — RFC-TERMINAL-004 §2.6
 *
 * Keyboard-driven block navigation:
 * - Cmd+↑/↓: previous/next block
 * - Cmd+Shift+↑/↓: previous/next failed block
 * - Cmd+Home: first block
 * - Cmd+End: last block (tail)
 */

import { useCallback, useRef, useState } from "react";
import { useAtomValue } from "jotai";

import { activeSessionCommandsAtom } from "../model/atoms";
import type { TerminalCommand } from "../model/types";

export interface BlockNavigationState {
  /** Currently focused command ID (via keyboard navigation) */
  focusedCommandId: string | null;
  /** Whether auto-follow is enabled (scroll follows new output) */
  autoFollow: boolean;
}

export interface BlockNavigationActions {
  /** Navigate to the previous block */
  goToPrevBlock: () => void;
  /** Navigate to the next block */
  goToNextBlock: () => void;
  /** Navigate to the previous failed block */
  goToPrevFailedBlock: () => void;
  /** Navigate to the next failed block */
  goToNextFailedBlock: () => void;
  /** Jump to the first block */
  goToFirstBlock: () => void;
  /** Jump to the last block (tail) and re-enable auto-follow */
  goToLastBlock: () => void;
  /** Scroll callback to disable auto-follow when user scrolls up */
  onUserScroll: (isAtBottom: boolean) => void;
  /** Re-enable auto-follow and jump to bottom */
  jumpToBottom: () => void;
  /** Get the focused command for scrolling */
  focusedCommand: TerminalCommand | null;
}

export function useBlockNavigation(
  scrollToCommand?: (command: TerminalCommand) => void,
): BlockNavigationState & BlockNavigationActions {
  const commands = useAtomValue(activeSessionCommandsAtom);
  const [focusedCommandId, setFocusedCommandId] = useState<string | null>(null);
  const [autoFollow, setAutoFollow] = useState(true);
  const lastScrollRef = useRef(true);

  const focusedIdx = focusedCommandId
    ? commands.findIndex((c) => c.commandId === focusedCommandId)
    : -1;

  const focusedCommand = focusedIdx >= 0 ? (commands[focusedIdx] ?? null) : null;

  const navigateTo = useCallback(
    (command: TerminalCommand | undefined) => {
      if (!command) return;
      setFocusedCommandId(command.commandId);
      setAutoFollow(false);
      scrollToCommand?.(command);
    },
    [scrollToCommand],
  );

  const goToPrevBlock = useCallback(() => {
    if (commands.length === 0) return;
    const idx = focusedIdx > 0 ? focusedIdx - 1 : commands.length - 1;
    navigateTo(commands[idx]);
  }, [commands, focusedIdx, navigateTo]);

  const goToNextBlock = useCallback(() => {
    if (commands.length === 0) return;
    const idx = focusedIdx < commands.length - 1 ? focusedIdx + 1 : 0;
    navigateTo(commands[idx]);
  }, [commands, focusedIdx, navigateTo]);

  const goToPrevFailedBlock = useCallback(() => {
    const startIdx = focusedIdx > 0 ? focusedIdx - 1 : commands.length - 1;
    for (let i = startIdx; i >= 0; i--) {
      const cmd = commands[i];
      if (cmd?.status === "failed") {
        navigateTo(cmd);
        return;
      }
    }
    // Wrap around
    for (let i = commands.length - 1; i > startIdx; i--) {
      const cmd = commands[i];
      if (cmd?.status === "failed") {
        navigateTo(cmd);
        return;
      }
    }
  }, [commands, focusedIdx, navigateTo]);

  const goToNextFailedBlock = useCallback(() => {
    const startIdx = focusedIdx >= 0 ? focusedIdx + 1 : 0;
    for (let i = startIdx; i < commands.length; i++) {
      const cmd = commands[i];
      if (cmd?.status === "failed") {
        navigateTo(cmd);
        return;
      }
    }
    // Wrap around
    for (let i = 0; i < startIdx; i++) {
      const cmd = commands[i];
      if (cmd?.status === "failed") {
        navigateTo(cmd);
        return;
      }
    }
  }, [commands, focusedIdx, navigateTo]);

  const goToFirstBlock = useCallback(() => {
    navigateTo(commands[0]);
  }, [commands, navigateTo]);

  const goToLastBlock = useCallback(() => {
    const last = commands[commands.length - 1];
    if (last) {
      setFocusedCommandId(last.commandId);
      setAutoFollow(true);
      scrollToCommand?.(last);
    }
  }, [commands, scrollToCommand]);

  const jumpToBottom = useCallback(() => {
    setAutoFollow(true);
    setFocusedCommandId(null);
    const last = commands[commands.length - 1];
    if (last) scrollToCommand?.(last);
  }, [commands, scrollToCommand]);

  const onUserScroll = useCallback((isAtBottom: boolean) => {
    if (lastScrollRef.current !== isAtBottom) {
      lastScrollRef.current = isAtBottom;
      if (!isAtBottom) {
        setAutoFollow(false);
      }
    }
  }, []);

  return {
    focusedCommandId,
    autoFollow,
    goToPrevBlock,
    goToNextBlock,
    goToPrevFailedBlock,
    goToNextFailedBlock,
    goToFirstBlock,
    goToLastBlock,
    onUserScroll,
    jumpToBottom,
    focusedCommand,
  };
}
