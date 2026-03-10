/**
 * Block Export Utilities — RFC-TERMINAL-004 §10
 *
 * Converts terminal blocks to various export formats.
 */

import type {
  DiagnosticEvent,
  ParsedTerminalEvent,
  SummaryEvent,
  TerminalCommand,
  TestResultEvent,
} from "../model/types";

// ─── Copy Command ────────────────────────────────────────

export function copyCommandText(command: TerminalCommand): string {
  return command.command;
}

// ─── Copy as Markdown ────────────────────────────────────

export function blockToMarkdown(
  command: TerminalCommand,
  parsedEvents: ParsedTerminalEvent[],
  outputPreview?: string,
): string {
  const lines: string[] = [];

  // Header
  lines.push("```terminal");
  lines.push(`$ ${command.command}`);

  // Output preview
  if (outputPreview) {
    lines.push(outputPreview);
  }

  lines.push("```");

  // Status
  let statusText: string;
  if (command.status === "failed") statusText = `Failed (exit ${command.exitCode ?? "?"})`;
  else if (command.status === "succeeded") statusText = "Success";
  else statusText = command.status;

  const durationText = command.duration !== undefined
    ? ` · ${formatDuration(command.duration)}`
    : "";

  // Summary from parsed events
  const summary = extractSummary(command.commandId, parsedEvents);
  const summaryText = summary ? ` · ${summary}` : "";

  lines.push(`**Status:** ${statusText}${durationText}${summaryText}`);

  return lines.join("\n");
}

// ─── Summary Extraction ──────────────────────────────────

function extractSummary(
  commandId: string,
  parsedEvents: ParsedTerminalEvent[],
): string | null {
  const events = parsedEvents.filter((e) => e.commandId === commandId);

  let errors = 0;
  let warnings = 0;
  let testsPassed = 0;
  let testsFailed = 0;
  let testsSkipped = 0;

  for (const event of events) {
    switch (event.kind) {
      case "diagnostic": {
        const d = event.data as DiagnosticEvent;
        if (d.severity === "error") errors++;
        else if (d.severity === "warning") warnings++;
        break;
      }
      case "test-result": {
        const t = event.data as TestResultEvent;
        if (t.status === "pass") testsPassed++;
        else if (t.status === "fail") testsFailed++;
        else testsSkipped++;
        break;
      }
      case "summary": {
        const s = event.data as SummaryEvent;
        return s.text;
      }
      case "progress":
      case "url":
      case "file-link":
      case "port-binding":
      case "task-lifecycle":
        // Not relevant for summary extraction
        break;
    }
  }

  const parts: string[] = [];
  if (errors > 0) parts.push(`${errors} error${errors !== 1 ? "s" : ""}`);
  if (warnings > 0) parts.push(`${warnings} warning${warnings !== 1 ? "s" : ""}`);
  if (testsFailed > 0) parts.push(`${testsFailed} failed`);
  if (testsPassed > 0) parts.push(`${testsPassed} passed`);
  if (testsSkipped > 0) parts.push(`${testsSkipped} skipped`);

  return parts.length > 0 ? parts.join(" · ") : null;
}

// ─── Helpers ─────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function buildSummaryText(
  commandId: string,
  parsedEvents: ParsedTerminalEvent[],
): string | null {
  return extractSummary(commandId, parsedEvents);
}

// ─── Phase C: Enhanced Exports ────────────────────────────

/**
 * Export a command block as rich Markdown (shell header, command, exit code,
 * duration, then parsed events such as errors and test results).
 */
export function exportBlockAsMarkdown(
  command: TerminalCommand,
  parsedEvents: ParsedTerminalEvent[],
): string {
  const lines: string[] = [];
  const events = parsedEvents.filter((e) => e.commandId === command.commandId);

  // Shell code block with command
  lines.push("```shell");
  lines.push(`$ ${command.command}`);
  lines.push("```");
  lines.push("");

  // Exit code & duration
  const exitText = command.exitCode !== undefined ? `Exit code: ${command.exitCode}` : "Exit code: N/A";
  const durationText = command.duration !== undefined ? `Duration: ${formatDuration(command.duration)}` : "Duration: N/A";
  lines.push(`| ${exitText} | ${durationText} | Status: ${command.status} |`);
  lines.push("");

  // Diagnostics
  const diagnostics = events
    .filter((e) => e.kind === "diagnostic")
    .map((e) => e.data as DiagnosticEvent);
  if (diagnostics.length > 0) {
    lines.push("### Diagnostics");
    lines.push("");
    for (const d of diagnostics) {
      let icon: string;
      if (d.severity === "error") icon = "x";
      else if (d.severity === "warning") icon = "!";
      else icon = "i";
      const loc = d.column !== undefined ? `${d.file}:${d.line}:${d.column}` : `${d.file}:${d.line}`;
      lines.push(`- [${icon}] \`${loc}\` — ${d.message}${d.source !== undefined ? ` (${d.source})` : ""}`);
    }
    lines.push("");
  }

  // Test results
  const tests = events
    .filter((e) => e.kind === "test-result")
    .map((e) => e.data as TestResultEvent);
  if (tests.length > 0) {
    lines.push("### Test Results");
    lines.push("");
    for (const t of tests) {
      let testIcon: string;
      if (t.status === "pass") testIcon = "v";
      else if (t.status === "fail") testIcon = "x";
      else testIcon = "-";
      const dur = t.duration !== undefined ? ` (${formatDuration(t.duration)})` : "";
      lines.push(`- [${testIcon}] ${t.testName}${dur}${t.message !== undefined ? ` — ${t.message}` : ""}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}

/**
 * Export a command block as structured JSON with command metadata,
 * diagnostics, and test results.
 */
export function exportBlockAsJSON(
  command: TerminalCommand,
  parsedEvents: ParsedTerminalEvent[],
): string {
  const events = parsedEvents.filter((e) => e.commandId === command.commandId);

  const diagnostics = events
    .filter((e) => e.kind === "diagnostic")
    .map((e) => {
      const d = e.data as DiagnosticEvent;
      return {
        severity: d.severity,
        file: d.file,
        line: d.line,
        column: d.column,
        message: d.message,
        source: d.source,
      };
    });

  const testResults = events
    .filter((e) => e.kind === "test-result")
    .map((e) => {
      const t = e.data as TestResultEvent;
      return {
        testName: t.testName,
        status: t.status,
        duration: t.duration,
        message: t.message,
      };
    });

  const payload = {
    command: command.command,
    status: command.status,
    exitCode: command.exitCode ?? null,
    duration: command.duration ?? null,
    cwd: command.cwd,
    startedAt: command.startedAt,
    completedAt: command.completedAt ?? null,
    diagnostics: diagnostics.length > 0 ? diagnostics : undefined,
    testResults: testResults.length > 0 ? testResults : undefined,
  };

  return JSON.stringify(payload, null, 2);
}
