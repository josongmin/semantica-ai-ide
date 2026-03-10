import type { CommandWithArgs } from "./types";

/**
 * Registry of commands that accept arguments.
 * Maps command IDs to their argument definitions.
 */
export const COMMAND_ARGS: readonly CommandWithArgs[] = [
  {
    commandId: "model",
    args: [
      {
        name: "model_id",
        description: "Model to switch to",
        suggestions: ["claude-opus-4-6", "claude-sonnet-4-6", "claude-haiku-4-5"],
        placeholder: "model name",
      },
    ],
  },
  {
    commandId: "export",
    args: [
      {
        name: "format",
        description: "Export format",
        suggestions: ["markdown", "json"],
        placeholder: "format",
      },
    ],
  },
  {
    commandId: "compact",
    args: [
      {
        name: "instruction",
        description: "Custom compaction instruction",
        placeholder: "focus on...",
      },
    ],
  },
];

/** Lookup argument definitions for a command */
export function getCommandArgs(commandId: string): CommandWithArgs | null {
  return COMMAND_ARGS.find((c) => c.commandId === commandId) ?? null;
}
