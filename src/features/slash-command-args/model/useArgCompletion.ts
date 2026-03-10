import { useMemo } from "react";

import { getCommandArgs } from "./argRegistry";
import type { ArgSuggestion, CommandArgDef } from "./types";

export interface ArgCompletionResult {
  /** Current argument definition (if command accepts args) */
  currentArg: CommandArgDef | null;
  /** Filtered suggestions for the current argument */
  suggestions: readonly ArgSuggestion[];
  /** Whether the command accepts arguments */
  hasArgs: boolean;
}

/**
 * Provides argument completion suggestions for a slash command.
 *
 * @param commandId - The command being invoked
 * @param argQuery - The partial argument text the user has typed
 */
export function useArgCompletion(commandId: string | null, argQuery: string): ArgCompletionResult {
  return useMemo(() => {
    if (!commandId) {
      return { currentArg: null, suggestions: [], hasArgs: false };
    }

    const cmdArgs = getCommandArgs(commandId);
    if (!cmdArgs || cmdArgs.args.length === 0) {
      return { currentArg: null, suggestions: [], hasArgs: false };
    }

    // For now, support single-argument commands (first arg)
    const currentArg = cmdArgs.args[0];
    if (currentArg === undefined) {
      return { currentArg: null, suggestions: [], hasArgs: false };
    }
    const staticSuggestions = currentArg.suggestions ?? [];
    const query = argQuery.toLowerCase().trim();

    const filtered: ArgSuggestion[] = staticSuggestions
      .filter((s) => !query || s.toLowerCase().includes(query))
      .map((s) => ({
        value: s,
        label: s,
      }));

    return { currentArg, suggestions: filtered, hasArgs: true };
  }, [commandId, argQuery]);
}
