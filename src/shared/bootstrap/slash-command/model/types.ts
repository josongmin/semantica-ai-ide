import type { PageId } from "~shared/lib";

/** Command execution behavior */
export type CommandAction =
  | { readonly type: "execute" }
  | { readonly type: "send_message"; readonly text: string }
  | { readonly type: "navigate"; readonly page: PageId }
  | { readonly type: "open_sub_panel"; readonly panelId: string };

/** Semantic category for grouping */
export type CommandCategory = "session" | "tools" | "navigation" | "features" | "settings";

/** Single slash command definition */
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

/** Fuzzy match result with score and match indices */
export interface CommandMatch {
  readonly command: SlashCommandDef;
  readonly score: number;
  /** Character indices into command.label that matched the query */
  readonly matchIndices: readonly number[];
}

/** Category display metadata */
export interface CategoryMeta {
  readonly label: string;
  readonly order: number;
}

/** Grouped commands for rendering */
export interface CommandGroup {
  readonly category: CommandCategory;
  readonly label: string;
  readonly items: readonly CommandMatch[];
}
