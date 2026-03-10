/**
 * Python Output Parser — RFC-TERMINAL-013 §FE-Fallback
 *
 * Frontend-side fallback parser for Python, pytest, mypy, and pylint output.
 * Mirrors the Tauri backend Python parser for use in:
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
  TestResultEvent,
} from "../../model/types";

// ─── ANSI Strip ─────────────────────────────────────────────
// eslint-disable-next-line no-control-regex
const ANSI_RE = /\x1b\[[0-9;]*[a-zA-Z]/g;
function stripAnsi(line: string): string {
  return line.replace(ANSI_RE, "");
}

// ─── Compiled Regexes (module-level, allocated once) ────────

/** File "foo.py", line 42, in bar */
const RE_TRACEBACK_FILE = /^\s*File "([^"]+)", line (\d+)(?:, in (\S+))?$/;

/** ValueError: invalid literal for int() ... */
const RE_EXCEPTION = /^(\w+Error|\w+Exception|KeyboardInterrupt|SystemExit|StopIteration|GeneratorExit):\s*(.*)$/;

/** PASSED tests/test_foo.py::test_bar */
const RE_PYTEST_RESULT = /^(PASSED|FAILED|SKIPPED|ERROR|XFAIL|XPASS)\s+(\S+)$/;

/** ====== 3 passed, 1 failed in 2.50s ====== */
const RE_PYTEST_SUMMARY = /^={3,}\s+(.*?)\s+in\s+[\d.]+s\s+={3,}$/;

/** FAILED tests/test_foo.py::test_bar - AssertionError: assert 1 == 2 */
const RE_PYTEST_SHORT_FAILURE = /^FAILED\s+(\S+)\s+-\s+(.+)$/;

/** foo.py:42: error: Incompatible types (mypy) */
const RE_MYPY = /^([^:]+):(\d+):\s+(error|warning|note):\s+(.+)$/;

/** foo.py:42:5: E0001: msg (pylint) */
const RE_PYLINT = /^([^:]+):(\d+):(\d+):\s+([EWCRF]\d+):\s+(.+)$/;

/** Downloading package-1.0.tar.gz (123 kB) / Installing collected packages: ... */
const RE_PIP_PROGRESS = /^\s*(Downloading|Installing|Collecting|Building|Unpacking)\s+(.+)$/;

/** Count extractors for pytest summary line */
const RE_COUNT_PASSED = /(\d+)\s+passed/;
const RE_COUNT_FAILED = /(\d+)\s+failed/;
const RE_COUNT_SKIPPED = /(\d+)\s+skipped/;
const RE_COUNT_ERROR = /(\d+)\s+error/;

// ─── Event ID Counter ───────────────────────────────────────
let eventCounter = 0;
function nextEventId(): string {
  return `fe_python_${++eventCounter}`;
}

// ─── Pytest Status Mapping ──────────────────────────────────
const PYTEST_STATUS_MAP: Record<string, TestResultEvent["status"]> = {
  PASSED: "pass",
  FAILED: "fail",
  SKIPPED: "skip",
  ERROR: "fail",
  XFAIL: "skip",
  XPASS: "pass",
};

// ─── Mypy Severity Mapping ─────────────────────────────────
const MYPY_SEVERITY_MAP: Record<string, DiagnosticEvent["severity"]> = {
  error: "error",
  warning: "warning",
  note: "info",
};

// ─── Pylint Severity Mapping (by code prefix) ──────────────
function pylintSeverity(code: string): DiagnosticEvent["severity"] {
  const prefix = code.charAt(0);
  switch (prefix) {
    case "E":
    case "F":
      return "error";
    case "W":
      return "warning";
    default:
      return "info";
  }
}

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
 * Parse a single line of Python/pytest/mypy/pylint output.
 * Returns a `ParsedTerminalEvent` if the line matches a known pattern, or `null`.
 */
export function parsePythonLine(
  rawLine: string,
  context: { readonly commandId: string; readonly sessionId: string },
): ParsedTerminalEvent | null {
  const line = stripAnsi(rawLine);

  // 1. Traceback file reference: File "foo.py", line 42, in bar
  const traceMatch = RE_TRACEBACK_FILE.exec(line);
  if (traceMatch) {
    const data: FileLinkEvent = {
      file: traceMatch[1] ?? "",
      line: parseInt(traceMatch[2] ?? "0", 10),
      text: line.trim(),
    };
    return makeEvent("file-link", data, context);
  }

  // 2. Exception line: ValueError: invalid literal ...
  const excMatch = RE_EXCEPTION.exec(line);
  if (excMatch) {
    const data: DiagnosticEvent = {
      severity: "error",
      file: "",
      line: 0,
      message: `${excMatch[1] ?? ""}: ${excMatch[2] ?? ""}`.trim(),
      source: "python",
    };
    return makeEvent("diagnostic", data, context);
  }

  // 3. Pytest short failure: FAILED tests/test_foo.py::test_bar - AssertionError
  //    (Check before general pytest result to capture the message)
  const shortFailMatch = RE_PYTEST_SHORT_FAILURE.exec(line);
  if (shortFailMatch) {
    const data: TestResultEvent = {
      testName: shortFailMatch[1] ?? "",
      status: "fail",
      ...(shortFailMatch[2] !== undefined ? { message: shortFailMatch[2] } : {}),
    };
    return makeEvent("test-result", data, context);
  }

  // 4. Pytest result: PASSED tests/test_foo.py::test_bar
  const pytestMatch = RE_PYTEST_RESULT.exec(line);
  if (pytestMatch) {
    const data: TestResultEvent = {
      testName: pytestMatch[2] ?? "",
      status: PYTEST_STATUS_MAP[pytestMatch[1] ?? ""] ?? "skip",
    };
    return makeEvent("test-result", data, context);
  }

  // 5. Pytest summary: ====== 3 passed, 1 failed in 2.50s ======
  const summaryMatch = RE_PYTEST_SUMMARY.exec(line);
  if (summaryMatch) {
    const middle = summaryMatch[1] ?? "";
    const passed = parseInt(RE_COUNT_PASSED.exec(middle)?.[1] ?? "0", 10);
    const failed = parseInt(RE_COUNT_FAILED.exec(middle)?.[1] ?? "0", 10);
    const skipped = parseInt(RE_COUNT_SKIPPED.exec(middle)?.[1] ?? "0", 10);
    const errors = parseInt(RE_COUNT_ERROR.exec(middle)?.[1] ?? "0", 10);
    const data: SummaryEvent = {
      text: line,
      counts: {
        passed,
        failed: failed + errors,
        skipped,
        total: passed + failed + skipped + errors,
      },
    };
    return makeEvent("summary", data, context);
  }

  // 6. Pylint diagnostic: foo.py:42:5: E0001: msg
  //    (Check before mypy — pylint has column and code)
  const pylintMatch = RE_PYLINT.exec(line);
  if (pylintMatch) {
    const data: DiagnosticEvent = {
      severity: pylintSeverity(pylintMatch[4] ?? ""),
      file: pylintMatch[1] ?? "",
      line: parseInt(pylintMatch[2] ?? "0", 10),
      column: parseInt(pylintMatch[3] ?? "0", 10),
      message: `${pylintMatch[4] ?? ""}: ${pylintMatch[5] ?? ""}`,
      source: "pylint",
    };
    return makeEvent("diagnostic", data, context);
  }

  // 7. Mypy diagnostic: foo.py:42: error: Incompatible types
  const mypyMatch = RE_MYPY.exec(line);
  if (mypyMatch) {
    const data: DiagnosticEvent = {
      severity: MYPY_SEVERITY_MAP[mypyMatch[3] ?? ""] ?? "info",
      file: mypyMatch[1] ?? "",
      line: parseInt(mypyMatch[2] ?? "0", 10),
      message: mypyMatch[4] ?? "",
      source: "mypy",
    };
    return makeEvent("diagnostic", data, context);
  }

  // 8. Pip progress: Downloading package-1.0.tar.gz (123 kB)
  const pipMatch = RE_PIP_PROGRESS.exec(line);
  if (pipMatch) {
    const data: ProgressEvent = {
      current: 0,
      label: `${pipMatch[1] ?? ""} ${pipMatch[2] ?? ""}`,
    };
    return makeEvent("progress", data, context);
  }

  return null;
}

// ─── Multi-Line Block Parser ────────────────────────────────

/**
 * Parse a block of Python output lines with multi-line context awareness.
 * Correlates traceback `File` lines with subsequent exception lines to produce
 * enriched `DiagnosticEvent`s that include file/line information.
 */
export function parsePythonBlock(
  lines: string[],
  context: { readonly commandId: string; readonly sessionId: string },
): ParsedTerminalEvent[] {
  const events: ParsedTerminalEvent[] = [];
  let pendingFileLink: { file: string; line: number } | null = null;

  for (const rawLine of lines) {
    const line = stripAnsi(rawLine);

    // Traceback file reference — hold as context for the next exception
    const traceMatch = RE_TRACEBACK_FILE.exec(line);
    if (traceMatch) {
      // Emit the file-link event regardless
      const data: FileLinkEvent = {
        file: traceMatch[1] ?? "",
        line: parseInt(traceMatch[2] ?? "0", 10),
        text: line.trim(),
      };
      events.push(makeEvent("file-link", data, context));

      // Remember for correlation with the upcoming exception
      pendingFileLink = {
        file: traceMatch[1] ?? "",
        line: parseInt(traceMatch[2] ?? "0", 10),
      };
      continue;
    }

    // Exception line — enrich with pending file location if available
    const excMatch = RE_EXCEPTION.exec(line);
    if (excMatch) {
      const data: DiagnosticEvent = {
        severity: "error",
        file: pendingFileLink?.file ?? "",
        line: pendingFileLink?.line ?? 0,
        message: `${excMatch[1] ?? ""}: ${excMatch[2] ?? ""}`.trim(),
        source: "python",
      };
      events.push(makeEvent("diagnostic", data, context));
      pendingFileLink = null;
      continue;
    }

    // Non-traceback line clears pending file context
    pendingFileLink = null;

    // Pytest short failure (check before general pytest result)
    const shortFailMatch = RE_PYTEST_SHORT_FAILURE.exec(line);
    if (shortFailMatch) {
      const data: TestResultEvent = {
        testName: shortFailMatch[1] ?? "",
        status: "fail",
        ...(shortFailMatch[2] !== undefined ? { message: shortFailMatch[2] } : {}),
      };
      events.push(makeEvent("test-result", data, context));
      continue;
    }

    // Pytest result
    const pytestMatch = RE_PYTEST_RESULT.exec(line);
    if (pytestMatch) {
      const data: TestResultEvent = {
        testName: pytestMatch[2] ?? "",
        status: PYTEST_STATUS_MAP[pytestMatch[1] ?? ""] ?? "skip",
      };
      events.push(makeEvent("test-result", data, context));
      continue;
    }

    // Pytest summary
    const summaryMatch = RE_PYTEST_SUMMARY.exec(line);
    if (summaryMatch) {
      const middle = summaryMatch[1] ?? "";
      const passed = parseInt(RE_COUNT_PASSED.exec(middle)?.[1] ?? "0", 10);
      const failed = parseInt(RE_COUNT_FAILED.exec(middle)?.[1] ?? "0", 10);
      const skipped = parseInt(RE_COUNT_SKIPPED.exec(middle)?.[1] ?? "0", 10);
      const errors = parseInt(RE_COUNT_ERROR.exec(middle)?.[1] ?? "0", 10);
      const data: SummaryEvent = {
        text: line,
        counts: {
          passed,
          failed: failed + errors,
          skipped,
          total: passed + failed + skipped + errors,
        },
      };
      events.push(makeEvent("summary", data, context));
      continue;
    }

    // Pylint diagnostic
    const pylintMatch = RE_PYLINT.exec(line);
    if (pylintMatch) {
      const data: DiagnosticEvent = {
        severity: pylintSeverity(pylintMatch[4] ?? ""),
        file: pylintMatch[1] ?? "",
        line: parseInt(pylintMatch[2] ?? "0", 10),
        column: parseInt(pylintMatch[3] ?? "0", 10),
        message: `${pylintMatch[4] ?? ""}: ${pylintMatch[5] ?? ""}`,
        source: "pylint",
      };
      events.push(makeEvent("diagnostic", data, context));
      continue;
    }

    // Mypy diagnostic
    const mypyMatch = RE_MYPY.exec(line);
    if (mypyMatch) {
      const data: DiagnosticEvent = {
        severity: MYPY_SEVERITY_MAP[mypyMatch[3] ?? ""] ?? "info",
        file: mypyMatch[1] ?? "",
        line: parseInt(mypyMatch[2] ?? "0", 10),
        message: mypyMatch[4] ?? "",
        source: "mypy",
      };
      events.push(makeEvent("diagnostic", data, context));
      continue;
    }

    // Pip progress
    const pipMatch = RE_PIP_PROGRESS.exec(line);
    if (pipMatch) {
      const data: ProgressEvent = {
        current: 0,
        label: `${pipMatch[1] ?? ""} ${pipMatch[2] ?? ""}`,
      };
      events.push(makeEvent("progress", data, context));
      continue;
    }
  }

  return events;
}
