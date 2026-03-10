import {
  abortableSleep,
  type AgentPersona,
  emitSummary,
  emitThinking,
  emitToolCall,
  emitTurnStart,
  finalizeTurn,
  type HandlerContext,
  type MessageId,
  nextId,
  postServerEvent,
  postServerEvents,
  type TurnId,
} from "./types";

export async function runTestWorkflow(text: string, turnId: TurnId, userMsgId: MessageId, ctx: HandlerContext, persona: AgentPersona, signal: AbortSignal) {
  emitTurnStart(text, turnId, userMsgId, ctx, persona);
  await abortableSleep(300, signal);

  await emitThinking(turnId, `${persona.name} here. Let me identify untested paths and edge cases...`, "Analyzing test coverage...", signal);
  await abortableSleep(200, signal);

  // Analysis: run tests
  postServerEvent({ t: "UPDATE_TURN_PHASE", turn_id: turnId, phase: "analysis", entry: { status: "running", summary: "Running test suite..." } });

  // Progress tracking for test run
  postServerEvent({ t: "SET_PROGRESS", key: "test-run", value: 0, max: 100, label: "Running test suite..." });
  await abortableSleep(200, signal);
  postServerEvent({ t: "SET_PROGRESS", key: "test-run", value: 35, max: 100, label: "Running helpers.test.ts..." });
  await abortableSleep(200, signal);
  postServerEvent({ t: "SET_PROGRESS", key: "test-run", value: 70, max: 100, label: "Running Button.test.tsx..." });
  await abortableSleep(200, signal);
  postServerEvent({ t: "SET_PROGRESS", key: "test-run", value: 100, max: 100, label: "Complete" });

  const tcVitest = await emitToolCall(turnId, "Bash", "terminal", "vitest run --coverage", "Tests completed with coverage report", signal, 800);

  // Terminal output
  postServerEvent({
    t: "APPEND_TERMINAL_OUTPUT",
    chunk: { tool_call_id: nextId("tc"), stream: "stdout", chunk: "$ vitest run --coverage\n\n PASS src/utils/helpers.test.ts (12 tests) 45ms\n PASS src/components/Button.test.tsx (8 tests) 120ms\n FAIL src/services/api.test.ts (2 tests) 200ms\n   FAIL handles timeout correctly\n   PASS handles success response\n [-] src/hooks/useAuth.test.ts (3 tests) skipped\n\nTest Files  3 passed | 1 failed | 1 skipped\nTests       22 passed | 1 failed | 3 skipped\nCoverage    67.3% statements | 58.2% branches\n", timestamp_ms: Date.now() },
  });

  postServerEvent({
    t: "UPDATE_TURN_PHASE",
    turn_id: turnId,
    phase: "analysis",
    entry: { status: "success", collapsed: true, summary: "vitest run --coverage", tool_call_ids: [tcVitest] },
  });

  // Test results
  postServerEvent({
    t: "SET_TEST_RESULTS",
    results: {
      runner_status: "fail", total: 26, passed: 22, failed: 1, skipped: 3, duration_ms: 365,
      cases: [
        { name: "processItems handles undefined", suite: "helpers", status: "pass", duration_ms: 8 },
        { name: "Button renders correctly", suite: "Button", status: "pass", duration_ms: 15 },
        { name: "handles timeout correctly", suite: "api", status: "fail", duration_ms: 200, error_message: "Expected: 'timeout', Received: undefined", file_path: "src/services/api.test.ts", line: 45 },
        { name: "useAuth skipped", suite: "useAuth", status: "skip" },
      ],
      command: "vitest run --coverage", turn_id: turnId,
    },
  });

  // Diagnostics for the failing test
  postServerEvent({
    t: "SET_DIAGNOSTICS",
    file_path: "src/services/api.test.ts",
    diagnostics: [
      { id: nextId("diag"), file_path: "src/services/api.test.ts", line: 45, severity: "error", source: "custom", code: "TEST_FAIL", message: "Expected: 'timeout', Received: undefined — timeout handler not returning error type" },
    ],
  });

  // Write fix for failing test
  postServerEvent({ t: "UPDATE_TURN_PHASE", turn_id: turnId, phase: "changes", entry: { status: "running", summary: "Fixing failing test..." } });
  postServerEvent({
    t: "UPSERT_FILE_CHANGE",
    file_change: { file_path: "src/services/api.ts", turn_id: turnId, status: "modified", insertions: 3, deletions: 1, approval_status: "pending", intent: "Fix timeout error type" },
  });
  await abortableSleep(300, signal);
  postServerEvent({ t: "UPDATE_TURN_PHASE", turn_id: turnId, phase: "changes", entry: { status: "success", summary: "1 file fixed" } });

  await emitSummary(
    turnId,
    `## Test Report\n\n| Metric | Value |\n|--------|-------|\n| Total | 26 tests |\n| Passed | 22 [PASS] |\n| Failed | 1 [FAIL] |\n| Skipped | 3 [-] |\n| Coverage | 67.3% statements |\n\n**Failing test:** \`api.test.ts:45\` — timeout handler not returning proper error type. Fixed by adding explicit error return.\n\n**Skipped:** \`useAuth\` tests need mock provider setup.\n\n**Coverage gaps:** Branch coverage at 58.2% — missing edge cases in \`helpers.ts\` conditional branches.`,
    signal, 1500,
  );

  postServerEvents([
    { t: "PUSH_PROMPT_SUGGESTION", suggestion: { id: nextId("sug"), text: "Increase branch coverage for helpers.ts", confidence: 0.85 } },
    { t: "PUSH_PROMPT_SUGGESTION", suggestion: { id: nextId("sug"), text: "Set up useAuth test mocks", confidence: 0.7 } },
  ]);

  finalizeTurn(turnId, ctx);
}
