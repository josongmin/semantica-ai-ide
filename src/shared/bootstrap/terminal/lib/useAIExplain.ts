/**
 * useAIExplain — RFC-TERMINAL-016 §2.3
 *
 * Hook that handles the Explain flow:
 * 1. User clicks "Explain" on a failed block
 * 2. Gather: command, diagnostics, output preview
 * 3. Send to AI (mock for now)
 * 4. Update terminalExplainAtom with result
 *
 * Mock responses are contextual based on error patterns.
 * Will be replaced with real LLM call.
 */

import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { terminalExplainAtom } from "../model/aiAtoms";
import { activeTerminalSessionIdAtom, terminalParsedEventMapAtom } from "../model/atoms";
import type {
  DiagnosticEvent,
  ParsedTerminalEvent,
  SummaryEvent,
  TerminalCommand,
  TestResultEvent,
} from "../model/types";

// ─── Mock AI Backend ──────────────────────────────────────

interface ExplainResult {
  readonly explanation: string;
  readonly suggestedFix?: string;
  readonly canAutoFix: boolean;
}

function extractDiagnostics(events: ParsedTerminalEvent[]): DiagnosticEvent[] {
  return events
    .filter((e) => e.kind === "diagnostic")
    .map((e) => e.data as DiagnosticEvent);
}

function extractTestResults(events: ParsedTerminalEvent[]): TestResultEvent[] {
  return events
    .filter((e) => e.kind === "test-result")
    .map((e) => e.data as TestResultEvent);
}

function extractSummary(events: ParsedTerminalEvent[]): SummaryEvent | undefined {
  const summaryEvent = events.find((e) => e.kind === "summary");
  return summaryEvent ? (summaryEvent.data as SummaryEvent) : undefined;
}

function mockExplain(
  command: TerminalCommand,
  diagnostics: DiagnosticEvent[],
  testResults: TestResultEvent[],
  summary: SummaryEvent | undefined,
): ExplainResult {
  const cmd = command.command.toLowerCase();

  // TypeScript errors
  const tsErrors = diagnostics.filter(
    (d) => d.severity === "error" && (d.source === "tsc" || d.file.endsWith(".ts") || d.file.endsWith(".tsx")),
  );
  const firstTsError = tsErrors[0];
  if (firstTsError) {
    const result: ExplainResult = {
      explanation:
        `TypeScript compilation failed with ${tsErrors.length} error${tsErrors.length > 1 ? "s" : ""}.\n\n` +
        `Primary error in ${firstTsError.file}:${firstTsError.line}:\n` +
        `${firstTsError.message}\n\n` +
        `This typically indicates a type mismatch — the value being assigned or passed doesn't match the expected type signature. ` +
        `Check the type definitions at the referenced location.`,
      canAutoFix: false,
    };
    if (tsErrors.length === 1) {
      return { ...result, suggestedFix: `code --goto ${firstTsError.file}:${firstTsError.line}:${firstTsError.column ?? 1}` };
    }
    return result;
  }

  // Test failures
  const failedTests = testResults.filter((t) => t.status === "fail");
  const firstFailed = failedTests[0];
  if (firstFailed) {
    const summaryText = summary?.counts
      ? `\n\nSummary: ${summary.counts.passed ?? 0} passed, ${summary.counts.failed ?? 0} failed${
        summary.counts.skipped !== undefined && summary.counts.skipped !== 0 ? `, ${summary.counts.skipped} skipped` : ""
        } out of ${summary.counts.total ?? "?"} total.`
      : "";
    const result: ExplainResult = {
      explanation:
        `${failedTests.length} test${failedTests.length > 1 ? "s" : ""} failed.\n\n` +
        `"${firstFailed.testName}" — ${firstFailed.message ?? "assertion did not hold"}.\n\n` +
        `The test expected a specific value or behavior that the code didn't produce. ` +
        `Review the test assertion and the function under test to identify the mismatch.${
        summaryText}`,
      canAutoFix: true,
    };
    if (failedTests.length <= 3) {
      return { ...result, suggestedFix: `pnpm test -- --testNamePattern="${firstFailed.testName}"` };
    }
    return result;
  }

  // Build errors (generic diagnostics)
  const buildErrors = diagnostics.filter((d) => d.severity === "error");
  const firstBuildError = buildErrors[0];
  if (firstBuildError && /build|compile|bundle/.test(cmd)) {
    return {
      explanation:
        `Build failed with ${buildErrors.length} error${buildErrors.length > 1 ? "s" : ""}.\n\n` +
        `${firstBuildError.message}\n\n` +
        `This may indicate a missing dependency, incorrect import path, or configuration issue. ` +
        `Check that all referenced modules are installed and paths resolve correctly.`,
      suggestedFix: "pnpm install",
      canAutoFix: true,
    };
  }

  // Lint errors
  if (/lint|eslint/.test(cmd) && diagnostics.length > 0) {
    const errorCount = diagnostics.filter((d) => d.severity === "error").length;
    const warnCount = diagnostics.filter((d) => d.severity === "warning").length;
    return {
      explanation:
        `Linter reported ${errorCount} error${errorCount !== 1 ? "s" : ""} and ${warnCount} warning${warnCount !== 1 ? "s" : ""}.\n\n` +
        `The most common issues are unused variables, missing imports, and formatting violations. ` +
        `Many can be auto-fixed with the --fix flag.`,
      suggestedFix: `${command.command} --fix`,
      canAutoFix: true,
    };
  }

  // Install failures
  if (/install|add/.test(cmd)) {
    return {
      explanation:
        `Package installation failed with exit code ${command.exitCode ?? "unknown"}.\n\n` +
        `Common causes include network issues, incompatible peer dependencies, or a corrupted lockfile. ` +
        `Try clearing the cache and reinstalling.`,
      suggestedFix: "rm -rf node_modules && pnpm install",
      canAutoFix: true,
    };
  }

  // Default explanation
  return {
    explanation:
      `Command "${command.command}" failed with exit code ${command.exitCode ?? "unknown"}.\n\n` +
      `The process exited with a non-zero status, indicating an error. ` +
      `Review the output above for specific error messages or stack traces that indicate what went wrong.`,
    canAutoFix: false,
  };
}

// ─── Hook ────────────────────────────────────────────────

/**
 * Provides the `requestExplain(command)` callback that triggers
 * the AI explain flow and populates `terminalExplainAtom`.
 */
export function useAIExplain() {
  const setExplain = useSetAtom(terminalExplainAtom);
  const sessionId = useAtomValue(activeTerminalSessionIdAtom);
  const parsedEventMap = useAtomValue(terminalParsedEventMapAtom);

  const requestExplain = useCallback(
    (command: TerminalCommand) => {
      // Set loading state immediately
      setExplain({
        commandId: command.commandId,
        loading: true,
        result: null,
      });

      // Gather parsed events for this command
      const allEvents = sessionId ? (parsedEventMap.get(sessionId) ?? []) : [];
      const commandEvents = allEvents.filter((e) => e.commandId === command.commandId);

      const diagnostics = extractDiagnostics(commandEvents);
      const testResults = extractTestResults(commandEvents);
      const summary = extractSummary(commandEvents);

      // Simulate async AI call (150ms latency)
      setTimeout(() => {
        const result = mockExplain(command, diagnostics, testResults, summary);
        setExplain({
          commandId: command.commandId,
          loading: false,
          result,
        });
      }, 150);
    },
    [setExplain, sessionId, parsedEventMap],
  );

  return { requestExplain };
}
