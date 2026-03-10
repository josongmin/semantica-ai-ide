/**
 * useTerminalKeyboard — RFC-TERMINAL-004 §2.6
 *
 * Terminal-specific keyboard shortcuts for block navigation,
 * AI command input, and block actions.
 */

import { useCallback } from "react";

import type { BlockNavigationActions } from "./useBlockNavigation";

interface UseTerminalKeyboardOptions {
  navigation: BlockNavigationActions;
  onSearchOpen?: () => void;
  onAICommandInput?: () => void;
  onCommandSearch?: () => void;
  onAskAgent?: () => void;
}

/**
 * Returns a keydown handler for terminal panel keyboard shortcuts.
 * Attach to the terminal panel's root div.
 */
export function useTerminalKeyboard({
  navigation,
  onSearchOpen,
  onAICommandInput,
  onCommandSearch,
  onAskAgent,
}: UseTerminalKeyboardOptions) {
  return useCallback(
    (e: React.KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      // Cmd+F — Search
      if (isMeta && e.key === "f") {
        e.preventDefault();
        onSearchOpen?.();
        return;
      }

      // Cmd+K — Command Search
      if (isMeta && e.key === "k") {
        e.preventDefault();
        onCommandSearch?.();
        return;
      }

      // Cmd+I — AI Command Input
      if (isMeta && e.key === "i") {
        e.preventDefault();
        onAICommandInput?.();
        return;
      }

      // Cmd+Shift+A — Ask Agent about focused block
      if (isMeta && e.shiftKey && e.key === "A") {
        e.preventDefault();
        onAskAgent?.();
        return;
      }

      // Cmd+↑ — Previous block
      if (isMeta && !e.shiftKey && e.key === "ArrowUp") {
        e.preventDefault();
        navigation.goToPrevBlock();
        return;
      }

      // Cmd+↓ — Next block
      if (isMeta && !e.shiftKey && e.key === "ArrowDown") {
        e.preventDefault();
        navigation.goToNextBlock();
        return;
      }

      // Cmd+Shift+↑ — Previous failed block
      if (isMeta && e.shiftKey && e.key === "ArrowUp") {
        e.preventDefault();
        navigation.goToPrevFailedBlock();
        return;
      }

      // Cmd+Shift+↓ — Next failed block
      if (isMeta && e.shiftKey && e.key === "ArrowDown") {
        e.preventDefault();
        navigation.goToNextFailedBlock();
        return;
      }

      // Cmd+Home — First block
      if (isMeta && e.key === "Home") {
        e.preventDefault();
        navigation.goToFirstBlock();
        return;
      }

      // Cmd+End — Last block (tail)
      if (isMeta && e.key === "End") {
        e.preventDefault();
        navigation.goToLastBlock();
        
      }
    },
    [navigation, onSearchOpen, onAICommandInput, onCommandSearch, onAskAgent],
  );
}
