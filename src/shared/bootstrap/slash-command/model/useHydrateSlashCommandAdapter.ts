/**
 * Hydrate hook that populates the slash-command adapter atom.
 * Called once at bootstrap time from StreamingBootstrap.
 *
 * NOTE: This adapter exposes the static parts (registry, filter, execution).
 * useSlashCommand requires per-instance callbacks (onSendMessage, onClearText),
 * so widgets needing the full orchestration still use that hook directly.
 * This adapter covers simpler consumers that only need read access
 * to command types and palette state.
 */
import { useCallback, useEffect, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  type SlashCommandAdapter,
  slashCommandAdapterAtom,
} from "~shared/lib/atoms/slashCommandAdapterAtoms";

import {
  closeSlashPaletteAtom,
  slashCommandOpenAtom,
  slashCommandQueryAtom,
  slashCommandRegistryAtom,
  slashCommandSelectedIndexAtom,
} from "./atoms";
import { useCommandExecution } from "./useCommandExecution";
import { useCommandFilter } from "./useCommandFilter";

export function useHydrateSlashCommandAdapter(): void {
  const isOpen = useAtomValue(slashCommandOpenAtom);
  const query = useAtomValue(slashCommandQueryAtom);
  const selectedIndex = useAtomValue(slashCommandSelectedIndexAtom);
  const commands = useAtomValue(slashCommandRegistryAtom);
  const closePalette = useSetAtom(closeSlashPaletteAtom);
  const setAdapter = useSetAtom(slashCommandAdapterAtom);

  const { flatMatches, groups } = useCommandFilter(query, commands);
  const { execute } = useCommandExecution();

  const executeCommand = useCallback(
    (id: string) => {
      const match = flatMatches.find((m) => m.command.id === id);
      if (match) execute(match.command);
      closePalette();
    },
    [flatMatches, execute, closePalette],
  );

  const noop = useCallback(() => {
    // No-op — per-instance widgets use useSlashCommand directly
  }, []);

  const noopKeyDown = useCallback(() => false, []);

  const adapter: SlashCommandAdapter = useMemo(
    () => ({
      isOpen,
      query,
      flatMatches,
      groups,
      selectedIndex,
      setSelectedIndex: noop as unknown as (i: number) => void,
      close: closePalette,
      executeCommand,
      handleTextChange: noop as unknown as (value: string) => void,
      handleKeyDown: noopKeyDown as unknown as SlashCommandAdapter["handleKeyDown"],
    }),
    [isOpen, query, flatMatches, groups, selectedIndex, closePalette, executeCommand, noop, noopKeyDown],
  );

  useEffect(() => {
    setAdapter(adapter);
  }, [setAdapter, adapter]);
}
