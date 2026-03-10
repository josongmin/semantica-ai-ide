/**
 * Cargo/Rust Output Parser — RFC-TERMINAL-013 §FE-Fallback
 *
 * Frontend-side fallback parser for Cargo and Rust compiler output.
 * Mirrors the Tauri backend Cargo parser for use in:
 *   - Browser dev mode (no Tauri backend)
 *   - VSCode webview (raw text output)
 *   - Frontend-only installations
 */

import type {
  DiagnosticEvent,
  FileLinkEvent,
  ParsedTerminalEvent,
  ProgressEvent,
  SummaryEvent,
  TaskLifecycleEvent,
  TestResultEvent,
} from "../../model/types";

// ─── ANSI Strip ─────────────────────────────────────────────
// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1b\[[0-9;]*[a-zA-Z]/g;
function stripAnsi(line: string): string {
  return line.replace(ANSI_RE, "");
}

// ─── Compiled Regexes (module-level, allocated once) ────────

/** error[E0308]: mismatched types  /  warning: unused variable */
const RE_DIAGNOSTIC_HEADER = /^(error|warning)(\[E\d+\])?: (.+)$/;

/** --> src/main.rs:42:5 */
const RE_LOCATION = /^\s*-->\s+([^:]+):(\d+):(\d+)$/;

/** test tests::test_add ... ok */
const RE_TEST_RESULT = /^test\s+(\S+)\s+\.\.\.\s+(ok|FAILED|ignored)$/;

/** test result: ok. 5 passed; 1 failed; 0 ignored; ... */
const RE_TEST_SUMMARY = /^test result: (ok|FAILED)\.\s+(\d+) passed;\s+(\d+) failed;\s+(\d+) ignored;/;

/** Compiling my-crate v0.1.0 (/path/to/crate) */
const RE_PROGRESS = /^\s+(Compiling|Downloading|Building|Checking|Running|Finished)\s+(.+)$/;

// ─── Event ID Counter ───────────────────────────────────────
let eventCounter = 0;
function nextEventId(): string {
  return `fe_cargo_${++eventCounter}`;
}

// ─── Test Status Mapping ────────────────────────────────────
const CARGO_TEST_STATUS_MAP: Record<string, TestResultEvent["status"]> = {
  ok: "pass",
  FAILED: "fail",
  ignored: "skip",
};

// ─── Helpers ────────────────────────────────────────────────

function makeEvent(
  kind: ParsedTerminalEvent["kind"],
  data: ParsedTerminalEvent["data"],
  context: { readonly commandId: string; readonly sessionId: string },
): ParsedTerminalEvent {
  return {
    eventId: nextEventId(),
    commandId: context.commandId,
    sessionId: context.sessionId,
    kind,
    timestamp: Date.now(),
    data,
  };
}

// ─── Single-Line Parser ─────────────────────────────────────

/**
 * Parse a single line of Cargo/rustc output.
 * Returns a `ParsedTerminalEvent` if the line matches a known pattern, or `null`.
 */
export function parseCargoLine(
  rawLine: string,
  context: { readonly commandId: string; readonly sessionId: string },
): ParsedTerminalEvent | null {
  const line = stripAnsi(rawLine);

  // 1. Diagnostic header: error[E0308]: mismatched types
  const diagMatch = RE_DIAGNOSTIC_HEADER.exec(line);
  if (diagMatch) {
    const severity = (diagMatch[1] ?? "error") as DiagnosticEvent["severity"];
    const message = diagMatch[3] ?? "";
    const data: DiagnosticEvent = {
      severity,
      file: "",
      line: 0,
      message,
      source: "rustc",
    };
    return makeEvent("diagnostic", data, context);
  }

  // 2. Location line:  --> src/main.rs:42:5
  const locMatch = RE_LOCATION.exec(line);
  if (locMatch) {
    const data: FileLinkEvent = {
      file: locMatch[1] ?? "",
      line: parseInt(locMatch[2] ?? "0", 10),
      column: parseInt(locMatch[3] ?? "0", 10),
      text: line.trim(),
    };
    return makeEvent("file-link", data, context);
  }

  // 3. Test result: test tests::test_add ... ok
  const testMatch = RE_TEST_RESULT.exec(line);
  if (testMatch) {
    const data: TestResultEvent = {
      testName: testMatch[1] ?? "",
      status: CARGO_TEST_STATUS_MAP[testMatch[2] ?? ""] ?? "skip",
    };
    return makeEvent("test-result", data, context);
  }

  // 4. Test summary: test result: ok. 5 passed; 1 failed; 0 ignored;
  const summaryMatch = RE_TEST_SUMMARY.exec(line);
  if (summaryMatch) {
    const passed = parseInt(summaryMatch[2] ?? "0", 10);
    const failed = parseInt(summaryMatch[3] ?? "0", 10);
    const skipped = parseInt(summaryMatch[4] ?? "0", 10);
    const data: SummaryEvent = {
      text: line,
      counts: {
        passed,
        failed,
        skipped,
        total: passed + failed + skipped,
      },
    };
    return makeEvent("summary", data, context);
  }

  // 5. Progress / task lifecycle: Compiling my-crate v0.1.0
  const progressMatch = RE_PROGRESS.exec(line);
  if (progressMatch) {
    const verb = progressMatch[1] ?? "";
    const label = progressMatch[2] ?? "";

    // "Finished" emits a task-lifecycle event; others emit progress
    if (verb === "Finished") {
      const data: TaskLifecycleEvent = {
        taskType: "build",
        phase: "ready",
        label,
      };
      return makeEvent("task-lifecycle", data, context);
    }

    const data: ProgressEvent = {
      current: 0,
      label: `${verb} ${label}`,
    };
    return makeEvent("progress", data, context);
  }

  return null;
}

// ─── Multi-Line Block Parser ────────────────────────────────

/**
 * Parse a block of Cargo/rustc output lines with multi-line context awareness.
 * Correlates diagnostic headers with their `-->` location lines to produce
 * enriched `DiagnosticEvent`s that include file/line/column information.
 */
export function parseCargoBlock(
  lines: string[],
  context: { readonly commandId: string; readonly sessionId: string },
): ParsedTerminalEvent[] {
  const events: ParsedTerminalEvent[] = [];
  let pendingDiagnostic: {
    severity: DiagnosticEvent["severity"];
    message: string;
  } | null = null;

  for (const rawLine of lines) {
    const line = stripAnsi(rawLine);

    // Check for diagnostic header
    const diagMatch = RE_DIAGNOSTIC_HEADER.exec(line);
    if (diagMatch) {
      // Flush any previous pending diagnostic without a location
      if (pendingDiagnostic) {
        const data: DiagnosticEvent = {
          severity: pendingDiagnostic.severity,
          file: "",
          line: 0,
          message: pendingDiagnostic.message,
          source: "rustc",
        };
        events.push(makeEvent("diagnostic", data, context));
      }
      pendingDiagnostic = {
        severity: (diagMatch[1] ?? "error") as DiagnosticEvent["severity"],
        message: diagMatch[3] ?? "",
      };
      continue;
    }

    // Check for location line — attach to pending diagnostic if available
    const locMatch = RE_LOCATION.exec(line);
    if (locMatch) {
      const file = locMatch[1] ?? "";
      const lineNum = parseInt(locMatch[2] ?? "0", 10);
      const column = parseInt(locMatch[3] ?? "0", 10);

      if (pendingDiagnostic) {
        // Enrich the diagnostic with location data
        const data: DiagnosticEvent = {
          severity: pendingDiagnostic.severity,
          file,
          line: lineNum,
          column,
          message: pendingDiagnostic.message,
          source: "rustc",
        };
        events.push(makeEvent("diagnostic", data, context));
        pendingDiagnostic = null;
      } else {
        // Standalone file link
        const data: FileLinkEvent = {
          file,
          line: lineNum,
          column,
          text: line.trim(),
        };
        events.push(makeEvent("file-link", data, context));
      }
      continue;
    }

    // Non-diagnostic/location lines — flush pending diagnostic, parse normally
    if (pendingDiagnostic) {
      const data: DiagnosticEvent = {
        severity: pendingDiagnostic.severity,
        file: "",
        line: 0,
        message: pendingDiagnostic.message,
        source: "rustc",
      };
      events.push(makeEvent("diagnostic", data, context));
      pendingDiagnostic = null;
    }

    // Try remaining patterns
    const testMatch = RE_TEST_RESULT.exec(line);
    if (testMatch) {
      const data: TestResultEvent = {
        testName: testMatch[1] ?? "",
        status: CARGO_TEST_STATUS_MAP[testMatch[2] ?? ""] ?? "skip",
      };
      events.push(makeEvent("test-result", data, context));
      continue;
    }

    const summaryMatch = RE_TEST_SUMMARY.exec(line);
    if (summaryMatch) {
      const passed = parseInt(summaryMatch[2] ?? "0", 10);
      const failed = parseInt(summaryMatch[3] ?? "0", 10);
      const skipped = parseInt(summaryMatch[4] ?? "0", 10);
      const data: SummaryEvent = {
        text: line,
        counts: {
          passed,
          failed,
          skipped,
          total: passed + failed + skipped,
        },
      };
      events.push(makeEvent("summary", data, context));
      continue;
    }

    const progressMatch = RE_PROGRESS.exec(line);
    if (progressMatch) {
      const verb = progressMatch[1] ?? "";
      const label = progressMatch[2] ?? "";

      if (verb === "Finished") {
        const data: TaskLifecycleEvent = {
          taskType: "build",
          phase: "ready",
          label,
        };
        events.push(makeEvent("task-lifecycle", data, context));
      } else {
        const data: ProgressEvent = {
          current: 0,
          label: `${verb} ${label}`,
        };
        events.push(makeEvent("progress", data, context));
      }
      continue;
    }
  }

  // Flush any trailing pending diagnostic
  if (pendingDiagnostic) {
    const data: DiagnosticEvent = {
      severity: pendingDiagnostic.severity,
      file: "",
      line: 0,
      message: pendingDiagnostic.message,
      source: "rustc",
    };
    events.push(makeEvent("diagnostic", data, context));
  }

  return events;
}
