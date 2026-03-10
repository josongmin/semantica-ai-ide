/**
 * FE Parser Registry — RFC-TERMINAL-013 §FE-Fallback
 *
 * Barrel export and unified parser runner for frontend-side
 * fallback output parsing. Used when the Tauri backend is not
 * available (browser dev mode, VSCode webview, FE-only installs).
 */

import type { ParsedTerminalEvent } from "../../model/types";
import { parseCargoBlock, parseCargoLine } from "./cargoParser";
import { parsePythonBlock, parsePythonLine } from "./pythonParser";

export { parseCargoBlock, parseCargoLine } from "./cargoParser";
export { parsePythonBlock, parsePythonLine } from "./pythonParser";

// ─── Parser Context ─────────────────────────────────────────

/** Context required by all FE-side fallback parsers. */
export interface FEParserContext {
  readonly commandId: string;
  readonly sessionId: string;
}

// ─── Parser Detection ───────────────────────────────────────

/** Known parser types for FE fallback. */
export type FEParserKind = "cargo" | "python" | "generic";

/** Cargo-family command prefixes. */
const CARGO_COMMANDS = ["cargo", "rustc", "clippy-driver"];

/** Python-family command prefixes. */
const PYTHON_COMMANDS = ["python", "python3", "pytest", "py.test", "mypy", "pylint", "pip", "pip3"];

/**
 * Detect which parser to use based on the command string.
 * Returns `null` if no specialized parser matches (generic output).
 */
export function detectParser(command: string): FEParserKind | null {
  // Normalize: trim, take the first token (the binary name),
  // and strip any path prefix (e.g., /usr/bin/python3 -> python3)
  const trimmed = command.trim();
  const firstToken = trimmed.split(/\s+/)[0] ?? "";
  const binary = firstToken.split("/").pop()?.split("\\").pop() ?? "";

  if (CARGO_COMMANDS.some((cmd) => binary === cmd || binary.startsWith(`${cmd}.`))) {
    return "cargo";
  }

  if (PYTHON_COMMANDS.some((cmd) => binary === cmd || binary.startsWith(`${cmd}.`))) {
    return "python";
  }

  // Also detect by subcommand patterns: "cargo build", "python -m pytest"
  if (/^cargo\s/.test(trimmed)) return "cargo";
  if (/^python[23]?\s/.test(trimmed)) return "python";
  if (/^py\.test\s/.test(trimmed) || /^pytest\s/.test(trimmed)) return "python";
  if (/^mypy\s/.test(trimmed) || /^pylint\s/.test(trimmed)) return "python";
  if (/^pip[23]?\s/.test(trimmed)) return "python";

  return null;
}

// ─── Unified Line Parser ────────────────────────────────────

/**
 * Run the appropriate FE parser on a single output line.
 * Returns `null` if no parser matches or the line is not recognized.
 */
export function parseLine(
  line: string,
  command: string,
  context: FEParserContext,
): ParsedTerminalEvent | null {
  const parser = detectParser(command);
  switch (parser) {
    case "cargo":
      return parseCargoLine(line, context);
    case "python":
      return parsePythonLine(line, context);
    case null:
    case "generic":
      return null;
  }
}

// ─── Unified Block Parser ───────────────────────────────────

/**
 * Run the appropriate FE block parser on multi-line output.
 * Returns an empty array if no parser matches.
 */
export function parseBlock(
  lines: string[],
  command: string,
  context: FEParserContext,
): ParsedTerminalEvent[] {
  const parser = detectParser(command);
  switch (parser) {
    case "cargo":
      return parseCargoBlock(lines, context);
    case "python":
      return parsePythonBlock(lines, context);
    case null:
    case "generic":
      return [];
  }
}
