/**
 * Strip ANSI escape sequences from terminal output.
 * Handles SGR (colors/styles), cursor movement, erase, and OSC sequences.
 * No external dependencies — regex-only approach.
 */

// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1B(?:\[[0-9;]*[A-Za-z]|\][^\x07\x1B]*(?:\x07|\x1B\\)?|\[[0-9;]*m)/g;

/** Remove all ANSI escape sequences from the given string */
export function stripAnsi(input: string): string {
  return input.replace(ANSI_RE, "");
}
