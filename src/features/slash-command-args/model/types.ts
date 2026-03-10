/** Argument definition for a slash command */
export interface CommandArgDef {
  readonly name: string;
  readonly description: string;
  readonly required?: boolean;
  /** Static suggestions for this argument */
  readonly suggestions?: readonly string[];
  /** Placeholder text shown in the input */
  readonly placeholder?: string;
}

/** Argument completion match */
export interface ArgSuggestion {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
}

/** Extended command with argument definitions */
export interface CommandWithArgs {
  readonly commandId: string;
  readonly args: readonly CommandArgDef[];
}
