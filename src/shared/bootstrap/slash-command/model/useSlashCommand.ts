import { type KeyboardEvent as ReactKeyboardEvent, useCallback } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import {
  closeSlashPaletteAtom,
  openSlashPaletteAtom,
  slashCommandOpenAtom,
  slashCommandQueryAtom,
  slashCommandRegistryAtom,
  slashCommandSelectedIndexAtom,
} from "./atoms";
import type { CommandGroup, CommandMatch } from "./types";
import { useCommandExecution } from "./useCommandExecution";
import { useCommandFilter } from "./useCommandFilter";

export interface UseSlashCommandReturn {
  isOpen: boolean;
  query: string;
  flatMatches: CommandMatch[];
  groups: CommandGroup[];
  selectedIndex: number;
  setSelectedIndex: (i: number) => void;
  close: () => void;
  executeCommand: (id: string) => void;
  /** Call from textarea onChange — detects "/" trigger and updates query */
  handleTextChange: (value: string) => void;
  /** Call from textarea onKeyDown — intercepts nav keys when palette is open */
  handleKeyDown: (e: ReactKeyboardEvent) => boolean;
}

/**
 * Primary orchestrator hook for the slash command palette.
 * Integrates palette state, filtering, keyboard nav, and execution.
 *
 * @param callbacks - Optional send/clear callbacks for command execution
 */
export function useSlashCommand(callbacks?: {
  onSendMessage?: (text: string) => void;
  onClearText?: () => void;
}): UseSlashCommandReturn {
  const isOpen = useAtomValue(slashCommandOpenAtom);
  const [query, setQuery] = useAtom(slashCommandQueryAtom);
  const [selectedIndex, setSelectedIndex] = useAtom(slashCommandSelectedIndexAtom);
  const commands = useAtomValue(slashCommandRegistryAtom);
  const openPalette = useSetAtom(openSlashPaletteAtom);
  const closePalette = useSetAtom(closeSlashPaletteAtom);

  const { flatMatches, groups } = useCommandFilter(query, commands);
  const { execute } = useCommandExecution(callbacks);

  const close = useCallback(() => {
    closePalette();
  }, [closePalette]);

  const executeCommand = useCallback(
    (id: string) => {
      const match = flatMatches.find((m) => m.command.id === id);
      if (match) {
        execute(match.command);
      }
      closePalette();
    },
    [flatMatches, execute, closePalette],
  );

  const executeSelected = useCallback(() => {
    if (flatMatches.length > 0 && selectedIndex >= 0 && selectedIndex < flatMatches.length) {
      const sel = flatMatches[selectedIndex]; if (sel !== undefined) execute(sel.command);
    }
    closePalette();
  }, [flatMatches, selectedIndex, execute, closePalette]);

  /**
   * Detect "/" at start of input to open palette, extract query after "/".
   * Close palette when "/" is removed.
   */
  const handleTextChange = useCallback(
    (value: string) => {
      // Only trigger for single-line input starting with "/"
      if (value.startsWith("/") && !value.includes("\n")) {
        if (!isOpen) {
          openPalette();
        }
        // Extract query after "/"
        setQuery(value.slice(1));
        setSelectedIndex(0);
      } else if (isOpen) {
        closePalette();
      }
    },
    [isOpen, openPalette, closePalette, setQuery, setSelectedIndex],
  );

  /**
   * Intercept keyboard events when palette is open.
   * Returns true if the event was handled (caller should not process further).
   */
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent): boolean => {
      if (!isOpen) return false;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          const next = selectedIndex < flatMatches.length - 1 ? selectedIndex + 1 : 0;
          setSelectedIndex(next);
          return true;
        }
        case "ArrowUp": {
          e.preventDefault();
          const prev = selectedIndex > 0 ? selectedIndex - 1 : flatMatches.length - 1;
          setSelectedIndex(prev);
          return true;
        }
        case "Enter":
        case "Tab": {
          e.preventDefault();
          executeSelected();
          return true;
        }
        case "Escape": {
          e.preventDefault();
          closePalette();
          return true;
        }
        default:
          return false;
      }
    },
    [isOpen, selectedIndex, flatMatches.length, setSelectedIndex, executeSelected, closePalette],
  );

  return {
    isOpen,
    query,
    flatMatches,
    groups,
    selectedIndex,
    setSelectedIndex,
    close,
    executeCommand,
    handleTextChange,
    handleKeyDown,
  };
}
