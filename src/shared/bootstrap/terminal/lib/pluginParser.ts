/**
 * Plugin Parser — TOML-based custom output parser configuration
 *
 * Enables users to define custom terminal output parsers via TOML config
 * files placed in `.semantica/parsers/*.toml`. Each config specifies
 * command patterns to match and regex-based rules that produce
 * ParsedTerminalEvents from raw output lines.
 *
 * RFC-TERMINAL-013 §9 — User Plugin Parsers
 */

import type {
  DiagnosticEvent,
  FileLinkEvent,
  ParsedEventKind,
  ParsedTerminalEvent,
  TestResultEvent,
} from "../model/types";

// ─── Types ──────────────────────────────────────────────────

/** Severity mapping from regex capture to normalized severity */
export type SeverityMap = Readonly<Record<string, "error" | "warning" | "info">>;

/** A single rule within a plugin parser config */
export interface PluginParserRule {
  /** Which ParsedEventKind this rule produces */
  readonly kind: ParsedEventKind;
  /** Regex pattern (may use named capture groups) */
  readonly pattern: string;
  /** Optional severity mapping for diagnostic rules */
  readonly severity_map?: SeverityMap | undefined;
}

/** Top-level plugin parser configuration (mirrors TOML schema) */
export interface PluginParserConfig {
  readonly name: string;
  readonly version: string;
  /** Command substrings that activate this parser */
  readonly command_match: readonly string[];
  /** Optional file extension scope */
  readonly file_extensions?: readonly string[] | undefined;
  /** Ordered list of rules to apply */
  readonly rules: readonly PluginParserRule[];
}

// ─── Event ID Generator ─────────────────────────────────────

let pluginEventCounter = 0;

/** Generate a unique event ID for plugin-produced events */
function nextPluginEventId(): string {
  return `plugin-evt-${++pluginEventCounter}`;
}

/** Reset the event counter (useful for tests) */
export function resetPluginEventCounter(): void {
  pluginEventCounter = 0;
}

// ─── Minimal TOML Parser ────────────────────────────────────

/** Parsed TOML value types we support */
type TomlValue = string | number | boolean | readonly TomlValue[] | TomlTable;
interface TomlTable {
  readonly [key: string]: TomlValue;
}

/** Safe bracket access — satisfies noPropertyAccessFromIndexSignature */
function tget(table: TomlTable, key: string): TomlValue | undefined {
  return table[key];
}

/** Safe bracket access for regex named groups */
function gget(groups: Record<string, string>, key: string): string | undefined {
  return groups[key];
}

/**
 * Minimal TOML parser supporting the subset needed by parser configs:
 * - `[section]` headers
 * - `[[array]]` table arrays
 * - `key = "value"` string assignments (double-quoted, with basic escapes)
 * - `key = 123` number assignments
 * - `key = true/false` boolean assignments
 * - `key = ["a", "b"]` inline arrays
 * - `key = { a = "b", c = "d" }` inline tables
 * - `#` line comments
 *
 * Does NOT support: multi-line strings, date/time, dotted keys, etc.
 */
export function parseToml(content: string): TomlTable {
  const root: Record<string, TomlValue> = {};
  let currentSection: Record<string, TomlValue> = root;

  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] ?? "";
    const line = stripComment(raw).trim();

    if (line === "") continue;

    // ── [[array]] table header ──
    const arrayMatch = /^\[\[([^\]]+)\]\]$/.exec(line);
    if (arrayMatch) {
      const key = (arrayMatch[1] ?? "").trim();

      if (!Object.prototype.hasOwnProperty.call(root, key)) {
        root[key] = [];
      }

      const arr = root[key];
      if (!Array.isArray(arr)) {
        throw new SyntaxError(`TOML: expected array for [[${key}]] at line ${i + 1}`);
      }

      const entry: Record<string, TomlValue> = {};
      (arr as TomlValue[]).push(entry);
      currentSection = entry;
      continue;
    }

    // ── [section] header ──
    const sectionMatch = /^\[([^\]]+)\]$/.exec(line);
    if (sectionMatch) {
      const key = (sectionMatch[1] ?? "").trim();

      if (!Object.prototype.hasOwnProperty.call(root, key)) {
        root[key] = {};
      }

      const section = root[key];
      if (typeof section !== "object" || Array.isArray(section)) {
        throw new SyntaxError(`TOML: expected table for [${key}] at line ${i + 1}`);
      }

      currentSection = section as Record<string, TomlValue>;
      continue;
    }

    // ── key = value ──
    const kvMatch = /^([A-Za-z_][A-Za-z0-9_-]*)\s*=\s*(.+)$/.exec(line);
    if (kvMatch) {
      const key = kvMatch[1] ?? "";
      const valueStr = (kvMatch[2] ?? "").trim();
      currentSection[key] = parseTomlValue(valueStr, i + 1);
      continue;
    }

    throw new SyntaxError(`TOML: unrecognized syntax at line ${i + 1}: ${line}`);
  }

  return root;
}

/** Strip inline comments (outside of strings) */
function stripComment(line: string): string {
  let inString = false;
  let escape = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === "\\") {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (ch === "#" && !inString) {
      return line.slice(0, i);
    }
  }

  return line;
}

/** Parse a single TOML value from its string representation */
function parseTomlValue(str: string, lineNum: number): TomlValue {
  // Boolean
  if (str === "true") return true;
  if (str === "false") return false;

  // String (double-quoted)
  if (str.startsWith('"')) {
    return parseTomlString(str, lineNum);
  }

  // Single-quoted string (literal)
  if (str.startsWith("'")) {
    const end = str.lastIndexOf("'");
    if (end <= 0) {
      throw new SyntaxError(`TOML: unterminated string at line ${lineNum}`);
    }
    return str.slice(1, end);
  }

  // Inline array
  if (str.startsWith("[")) {
    return parseTomlInlineArray(str, lineNum);
  }

  // Inline table
  if (str.startsWith("{")) {
    return parseTomlInlineTable(str, lineNum);
  }

  // Number
  const num = Number(str);
  if (!Number.isNaN(num) && str !== "") {
    return num;
  }

  throw new SyntaxError(`TOML: unrecognized value at line ${lineNum}: ${str}`);
}

/** Parse a double-quoted TOML string with basic escape support */
function parseTomlString(str: string, lineNum: number): string {
  if (!str.startsWith('"')) {
    throw new SyntaxError(`TOML: expected string at line ${lineNum}`);
  }

  let result = "";
  let i = 1; // skip opening quote
  let closed = false;

  while (i < str.length) {
    const ch = str[i];

    if (ch === "\\") {
      i++;
      const esc = str[i];
      switch (esc) {
        case "n": result += "\n"; break;
        case "t": result += "\t"; break;
        case "r": result += "\r"; break;
        case "\\": result += "\\"; break;
        case '"': result += '"'; break;
        case undefined: result += "\\"; break;
        default: result += `\\${esc}`; break;
      }
      i++;
      continue;
    }

    if (ch === '"') {
      closed = true;
      break;
    }

    result += ch ?? "";
    i++;
  }

  if (!closed) {
    throw new SyntaxError(`TOML: unterminated string at line ${lineNum}`);
  }

  return result;
}

/** Parse a TOML inline array like `["a", "b", 3]` */
function parseTomlInlineArray(str: string, lineNum: number): readonly TomlValue[] {
  if (!str.startsWith("[") || !str.endsWith("]")) {
    throw new SyntaxError(`TOML: malformed inline array at line ${lineNum}`);
  }

  const inner = str.slice(1, -1).trim();
  if (inner === "") return [];

  const items = splitTomlValues(inner);
  return items.map((item) => parseTomlValue(item.trim(), lineNum));
}

/** Parse a TOML inline table like `{ a = "b", c = "d" }` */
function parseTomlInlineTable(str: string, lineNum: number): TomlTable {
  if (!str.startsWith("{") || !str.endsWith("}")) {
    throw new SyntaxError(`TOML: malformed inline table at line ${lineNum}`);
  }

  const inner = str.slice(1, -1).trim();
  if (inner === "") return {};

  const result: Record<string, TomlValue> = {};
  const pairs = splitTomlValues(inner);

  for (const pair of pairs) {
    const eqIdx = pair.indexOf("=");
    if (eqIdx < 0) {
      throw new SyntaxError(`TOML: expected key=value in inline table at line ${lineNum}`);
    }

    const key = pair.slice(0, eqIdx).trim();
    const value = pair.slice(eqIdx + 1).trim();
    result[key] = parseTomlValue(value, lineNum);
  }

  return result;
}

/** Split comma-separated TOML values, respecting strings and nesting */
function splitTomlValues(str: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  let inString = false;
  let escape = false;

  for (const ch of str) {
    if (escape) {
      current += ch;
      escape = false;
      continue;
    }

    if (ch === "\\") {
      current += ch;
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      current += ch;
      continue;
    }

    if (!inString) {
      if (ch === "[" || ch === "{") {
        depth++;
        current += ch;
        continue;
      }
      if (ch === "]" || ch === "}") {
        depth--;
        current += ch;
        continue;
      }
      if (ch === "," && depth === 0) {
        parts.push(current);
        current = "";
        continue;
      }
    }

    current += ch;
  }

  if (current.trim() !== "") {
    parts.push(current);
  }

  return parts;
}

// ─── Config Loader ──────────────────────────────────────────

/**
 * Parse and validate a TOML string into a PluginParserConfig.
 * Throws if required fields are missing or malformed.
 */
export function loadPluginConfig(tomlContent: string): PluginParserConfig {
  const doc = parseToml(tomlContent);

  // Extract [parser] section
  const parser = tget(doc, "parser");
  if (parser === undefined || typeof parser !== "object" || Array.isArray(parser)) {
    throw new Error("Plugin config missing [parser] section");
  }

  const parserTable = parser as TomlTable;

  const name = tget(parserTable, "name");
  if (typeof name !== "string" || name === "") {
    throw new Error("Plugin config: parser.name must be a non-empty string");
  }

  const version = tget(parserTable, "version");
  if (typeof version !== "string" && typeof version !== "number") {
    throw new Error("Plugin config: parser.version is required");
  }

  const commandMatch = tget(parserTable, "command_match");
  if (!Array.isArray(commandMatch) || commandMatch.length === 0) {
    throw new Error("Plugin config: parser.command_match must be a non-empty array of strings");
  }
  for (const cm of commandMatch) {
    if (typeof cm !== "string") {
      throw new Error("Plugin config: parser.command_match entries must be strings");
    }
  }

  const fileExtensions = tget(parserTable, "file_extensions");
  if (fileExtensions !== undefined) {
    if (!Array.isArray(fileExtensions)) {
      throw new Error("Plugin config: parser.file_extensions must be an array of strings");
    }
    for (const ext of fileExtensions) {
      if (typeof ext !== "string") {
        throw new Error("Plugin config: parser.file_extensions entries must be strings");
      }
    }
  }

  // Extract [[rules]] array
  const rawRulesVal = tget(doc, "rules");
  if (rawRulesVal === undefined || !Array.isArray(rawRulesVal)) {
    throw new Error("Plugin config: must contain at least one [[rules]] entry");
  }
  const rawRules = rawRulesVal as readonly TomlValue[];

  const rules: PluginParserRule[] = [];

  for (let i = 0; i < rawRules.length; i++) {
    const raw: TomlValue | undefined = rawRules[i];
    if (typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error(`Plugin config: rules[${i}] must be a table`);
    }

    const ruleTable = raw as TomlTable;

    const kind = tget(ruleTable, "kind");
    if (typeof kind !== "string") {
      throw new Error(`Plugin config: rules[${i}].kind is required`);
    }

    const pattern = tget(ruleTable, "pattern");
    if (typeof pattern !== "string") {
      throw new Error(`Plugin config: rules[${i}].pattern is required`);
    }

    // Validate regex compiles
    try {
      new RegExp(normalizePattern(pattern));
    } catch (err) {
      throw new Error(
        `Plugin config: rules[${i}].pattern is invalid regex: ${(err as Error).message}`,
        { cause: err },
      );
    }

    const severityMap = tget(ruleTable, "severity_map");
    let parsedSeverityMap: SeverityMap | undefined;

    if (severityMap !== undefined) {
      if (typeof severityMap !== "object" || Array.isArray(severityMap)) {
        throw new Error(`Plugin config: rules[${i}].severity_map must be an inline table`);
      }
      const map: Record<string, "error" | "warning" | "info"> = {};
      for (const [k, v] of Object.entries(severityMap as TomlTable)) {
        if (typeof v !== "string") {
          throw new Error(`Plugin config: rules[${i}].severity_map values must be strings`);
        }
        map[k] = v as "error" | "warning" | "info";
      }
      parsedSeverityMap = map;
    }

    const rule: PluginParserRule = parsedSeverityMap !== undefined
      ? { kind: kind as ParsedEventKind, pattern, severity_map: parsedSeverityMap }
      : { kind: kind as ParsedEventKind, pattern };

    rules.push(rule);
  }

  if (rules.length === 0) {
    throw new Error("Plugin config: must contain at least one [[rules]] entry");
  }

  const config: PluginParserConfig = fileExtensions !== undefined
    ? {
        name,
        version: String(version),
        command_match: commandMatch as readonly string[],
        file_extensions: fileExtensions as readonly string[],
        rules,
      }
    : {
        name,
        version: String(version),
        command_match: commandMatch as readonly string[],
        rules,
      };

  return config;
}

// ─── Pattern Matching ───────────────────────────────────────

/**
 * Normalize a regex pattern, converting Python-style `(?P<name>...)` named
 * groups to the JS-compatible `(?<name>...)` syntax.
 */
function normalizePattern(pattern: string): string {
  return pattern.replace(/\(\?P</g, "(?<");
}

/**
 * Attempt to match a single output line against a plugin rule.
 * Returns a ParsedTerminalEvent if the line matches, or null otherwise.
 */
export function matchPluginRule(
  line: string,
  rule: PluginParserRule,
  context: { readonly commandId: string; readonly sessionId: string },
): ParsedTerminalEvent | null {
  const regex = new RegExp(normalizePattern(rule.pattern));
  const match = regex.exec(line);

  if (!match) return null;

  const groups = match.groups ?? {};
  const base = {
    eventId: nextPluginEventId(),
    commandId: context.commandId,
    sessionId: context.sessionId,
    kind: rule.kind,
    timestamp: Date.now(),
  } as const;

  switch (rule.kind) {
    case "diagnostic":
      return {
        ...base,
        data: buildDiagnosticData(match, groups, rule),
      };

    case "test-result":
      return {
        ...base,
        data: buildTestResultData(match, groups),
      };

    case "file-link":
      return {
        ...base,
        data: buildFileLinkData(match, groups, line),
      };

    case "progress":
    case "summary":
    case "url":
    case "port-binding":
    case "task-lifecycle":
      // For other kinds, produce a generic summary event with the full match
      return {
        ...base,
        data: { text: match[0] },
      };
  }
}

/** Build DiagnosticEvent data from regex match */
function buildDiagnosticData(
  match: RegExpExecArray,
  groups: Record<string, string>,
  rule: PluginParserRule,
): DiagnosticEvent {
  const rawSeverity = gget(groups, "sev") ?? gget(groups, "severity") ?? match[3] ?? "error";
  const severity = rule.severity_map?.[rawSeverity] ?? normalizeSeverity(rawSeverity);
  const columnStr = gget(groups, "column");

  const base: DiagnosticEvent = {
    severity,
    file: gget(groups, "file") ?? match[1] ?? "unknown",
    line: Number.isNaN(parseInt(gget(groups, "line") ?? match[2] ?? "0", 10)) ? 0 : parseInt(gget(groups, "line") ?? match[2] ?? "0", 10),
    message: gget(groups, "msg") ?? gget(groups, "message") ?? match[match.length - 1] ?? "",
    source: "plugin",
  };

  if (columnStr !== undefined) {
    return { ...base, column: parseInt(columnStr, 10) };
  }

  return base;
}

/** Build TestResultEvent data from regex match */
function buildTestResultData(
  match: RegExpExecArray,
  groups: Record<string, string>,
): TestResultEvent {
  const rawStatus = gget(groups, "status") ?? match[1] ?? "";
  const messageStr = gget(groups, "msg") ?? gget(groups, "message");

  const base: TestResultEvent = {
    testName: gget(groups, "name") ?? gget(groups, "test") ?? match[2] ?? match[0],
    status: normalizeTestStatus(rawStatus),
  };

  if (messageStr !== undefined) {
    return { ...base, message: messageStr };
  }

  return base;
}

/** Build FileLinkEvent data from regex match */
function buildFileLinkData(
  match: RegExpExecArray,
  groups: Record<string, string>,
  line: string,
): FileLinkEvent {
  const columnStr = gget(groups, "column");

  const base: FileLinkEvent = {
    file: gget(groups, "file") ?? match[1] ?? "",
    line: Number.isNaN(parseInt(gget(groups, "line") ?? match[2] ?? "0", 10)) ? 0 : parseInt(gget(groups, "line") ?? match[2] ?? "0", 10),
    text: line,
  };

  if (columnStr !== undefined) {
    return { ...base, column: parseInt(columnStr, 10) };
  }

  return base;
}

/** Normalize a severity string to one of the allowed values */
function normalizeSeverity(raw: string): "error" | "warning" | "info" {
  const lower = raw.toLowerCase();
  if (lower === "error" || lower === "err" || lower === "fatal") return "error";
  if (lower === "warning" || lower === "warn") return "warning";
  return "info";
}

/** Normalize a test status string to one of the allowed values */
function normalizeTestStatus(raw: string): "pass" | "fail" | "skip" {
  const lower = raw.toLowerCase();
  if (lower === "pass" || lower === "passed" || lower === "ok") return "pass";
  if (lower === "fail" || lower === "failed" || lower === "error") return "fail";
  return "skip";
}

// ─── Plugin Runner ──────────────────────────────────────────

/**
 * Run all loaded plugin parsers against a single output line.
 *
 * Only plugins whose `command_match` patterns appear in the active
 * command string are executed. Returns all events produced (may be
 * empty if no rule matches).
 */
export function runPluginParsers(
  line: string,
  plugins: readonly PluginParserConfig[],
  context: {
    readonly commandId: string;
    readonly sessionId: string;
    readonly command?: string | undefined;
  },
): ParsedTerminalEvent[] {
  const events: ParsedTerminalEvent[] = [];
  const cmd = context.command;

  for (const plugin of plugins) {
    // Check if this plugin should run for the current command
    if (cmd !== undefined) {
      const matches = plugin.command_match.some((pattern) => cmd.includes(pattern));
      if (!matches) continue;
    }

    // Try each rule in order — first match wins per plugin
    for (const rule of plugin.rules) {
      const event = matchPluginRule(line, rule, context);
      if (event) {
        events.push(event);
        break; // One match per plugin per line
      }
    }
  }

  return events;
}
