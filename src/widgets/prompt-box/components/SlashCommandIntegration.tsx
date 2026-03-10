import React, { useMemo } from "react";

import type { CommandGroup, CommandMatch } from "~shared/bootstrap/slash-command";

import { useArgCompletion } from "../../../features/slash-command-args";
import { CommandPalette } from "../../../shared/ui";

interface SlashCommandState {
  isOpen: boolean;
  close: () => void;
  groups: CommandGroup[];
  selectedIndex: number;
  executeCommand: (id: string) => void;
  setSelectedIndex: (i: number) => void;
  query: string;
  flatMatches: CommandMatch[];
}

interface SlashCommandIntegrationProps {
  slashCmd: SlashCommandState;
  anchorRef: React.RefObject<HTMLElement | null>;
}

/**
 * Slash command palette integration with arg-hint support.
 */
export const SlashCommandIntegration = React.memo(function SlashCommandIntegration({
  slashCmd,
  anchorRef,
}: SlashCommandIntegrationProps) {
  const selectedCommandId = useMemo(() => {
    if (!slashCmd.isOpen) return null;
    const flat = slashCmd.flatMatches;
    if (flat.length === 0) return null;
    const sel = flat[slashCmd.selectedIndex];
    return sel?.command.id ?? null;
  }, [slashCmd.isOpen, slashCmd.flatMatches, slashCmd.selectedIndex]);

  const argCompletion = useArgCompletion(selectedCommandId, slashCmd.query);

  const argHint = useMemo(() => {
    if (!argCompletion.hasArgs || !argCompletion.currentArg) return null;
    return {
      placeholder: argCompletion.currentArg.placeholder ?? argCompletion.currentArg.description,
      suggestions: argCompletion.suggestions,
    };
  }, [argCompletion]);

  return (
    <CommandPalette
      open={slashCmd.isOpen}
      onClose={slashCmd.close}
      groups={slashCmd.groups}
      selectedIndex={slashCmd.selectedIndex}
      onSelect={slashCmd.executeCommand}
      onHover={slashCmd.setSelectedIndex}
      query={slashCmd.query}
      anchorRef={anchorRef}
      argHint={argHint}
    />
  );
});
