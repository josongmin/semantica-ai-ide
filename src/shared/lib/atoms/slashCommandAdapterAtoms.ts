/**
 * Adapter atom for slash-command feature.
 *
 * Widgets read this atom instead of importing directly from
 * `features/slash-command` and `features/slash-command-args`,
 * breaking the DIP violation.
 * The feature layer hydrates the adapter at bootstrap time.
 */
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { atom } from "jotai";

// ─── Re-declare minimal types so shared layer has no feature deps ──

export type CommandAction =
  | { readonly type: "execute" }
  | { readonly type: "send_message"; readonly text: string }
  | { readonly type: "navigate"; readonly page: string }
  | { readonly type: "open_sub_panel"; readonly panelId: string };

export type CommandCategory = "session" | "tools" | "navigation" | "features" | "settings";

export interface SlashCommandDef {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly description: string;
  readonly category: CommandCategory;
  readonly icon: string;
  readonly shortcutHint?: string;
  readonly keywords?: readonly string[];
  readonly hidden?: boolean;
  readonly action: CommandAction;
}

export interface CommandMatch {
  readonly command: SlashCommandDef;
  readonly score: number;
  readonly matchIndices: readonly number[];
}

export interface CommandGroup {
  readonly category: CommandCategory;
  readonly label: string;
  readonly items: readonly CommandMatch[];
}

export interface CommandArgDef {
  readonly name: string;
  readonly description: string;
  readonly required?: boolean;
  readonly suggestions?: readonly string[];
  readonly placeholder?: string;
}

export interface ArgSuggestion {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
}

// ─── Adapter interface ──────────────────────────────────────────────

export interface SlashCommandAdapter {
  /** Whether the slash command palette is open. */
  readonly isOpen: boolean;
  /** Current query string (text after "/"). */
  readonly query: string;
  /** Flat list of matched commands. */
  readonly flatMatches: readonly CommandMatch[];
  /** Grouped commands for rendering. */
  readonly groups: readonly CommandGroup[];
  /** Currently selected index in the palette. */
  readonly selectedIndex: number;
  /** Set the selected index. */
  setSelectedIndex: (i: number) => void;
  /** Close the palette. */
  close: () => void;
  /** Execute a command by id. */
  executeCommand: (id: string) => void;
  /** Handle textarea text change (detects "/" trigger). */
  handleTextChange: (value: string) => void;
  /** Handle keyboard events when palette is open. Returns true if handled. */
  handleKeyDown: (e: ReactKeyboardEvent) => boolean;
}

export interface ArgCompletionAdapter {
  /** Current argument definition (if command accepts args). */
  readonly currentArg: CommandArgDef | null;
  /** Filtered suggestions for the current argument. */
  readonly suggestions: readonly ArgSuggestion[];
  /** Whether the command accepts arguments. */
  readonly hasArgs: boolean;
}

// ─── Adapter atoms (null before hydration) ──────────────────────────

export const slashCommandAdapterAtom = atom<SlashCommandAdapter | null>(null);
slashCommandAdapterAtom.debugLabel = "slashCommandAdapterAtom";

export const argCompletionAdapterAtom = atom<ArgCompletionAdapter | null>(null);
argCompletionAdapterAtom.debugLabel = "argCompletionAdapterAtom";
