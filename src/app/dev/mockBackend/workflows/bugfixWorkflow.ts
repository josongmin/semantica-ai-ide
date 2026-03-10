import type { FileChange } from "../../../../shared/protocol";
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

export async function runBugfixWorkflow(
  text: string,
  turnId: TurnId,
  userMsgId: MessageId,
  ctx: HandlerContext,
  persona: AgentPersona,
  signal: AbortSignal,
) {
  emitTurnStart(text, turnId, userMsgId, ctx, persona);
  await abortableSleep(300, signal);

  await emitThinking(
    turnId,
    `${persona.name} here. Let me systematically trace the root cause. Starting with error context and stack traces...`,
    "Diagnosing the issue...",
    signal,
  );

  // InputGateResult
  postServerEvent({
    t: "SET_INPUT_GATE_RESULT",
    turn_id: turnId,
    result: {
      intent_type: "bug_fix",
      risk_level: "moderate",
      change_size: "small",
      uncertainty: "medium",
      context_signals: {
        has_repro: true,
        has_logs: true,
        has_patch_hints: false,
        pii_detected: false,
        security_sensitive: false,
      },
    },
  });
  await abortableSleep(200, signal);

  // Analysis phase
  postServerEvent({
    t: "UPDATE_TURN_PHASE",
    turn_id: turnId,
    phase: "analysis",
    entry: { status: "running", summary: "Tracing the bug..." },
  });
  const tcGrep = await emitToolCall(
    turnId,
    "Bash",
    "terminal",
    "grep -r 'TypeError' src/",
    "Found 3 occurrences",
    signal,
    500,
  );

  // Diagnostics
  postServerEvent({
    t: "SET_DIAGNOSTICS",
    file_path: "src/utils/helpers.ts",
    diagnostics: [
      {
        id: nextId("diag"),
        file_path: "src/utils/helpers.ts",
        line: 28,
        severity: "error",
        source: "type_checker",
        message: "TypeError: Cannot read property 'length' of undefined",
      },
      {
        id: nextId("diag"),
        file_path: "src/utils/helpers.ts",
        line: 45,
        severity: "warning",
        source: "linter",
        message: "Possible null reference: 'items' may be undefined",
      },
    ],
  });

  // Terminal output
  postServerEvent({
    t: "APPEND_TERMINAL_OUTPUT",
    chunk: {
      tool_call_id: nextId("tc"),
      stream: "stderr",
      chunk:
        "TypeError: Cannot read property 'length' of undefined\n  at processItems (src/utils/helpers.ts:28:15)\n  at Object.<anonymous> (src/app.ts:42:5)\n",
      timestamp_ms: Date.now(),
    },
  });

  const tcRead = await emitToolCall(
    turnId,
    "Read",
    "read",
    "src/utils/helpers.ts",
    "Read 150 lines — found null reference at line 28",
    signal,
    400,
  );
  postServerEvent({
    t: "UPDATE_TURN_PHASE",
    turn_id: turnId,
    phase: "analysis",
    entry: {
      status: "success",
      collapsed: true,
      summary: "1 file: helpers.ts",
      tool_call_ids: [tcGrep, tcRead],
    },
  });

  // Classify the error
  postServerEvent({
    t: "CLASSIFY_ERROR",
    id: userMsgId,
    error: {
      category: "tool",
      code: "NULL_REF",
      message: "TypeError: Cannot read property 'length' of undefined",
      retry_strategy: "retry_after_fix",
      details:
        "processItems() at helpers.ts:28 — items array undefined when API returns empty body",
    },
  });

  // Tool output for the grep command
  postServerEvent({
    t: "SET_TOOL_OUTPUT",
    id: nextId("to"),
    output: {
      stdout:
        "src/utils/helpers.ts:28: items.length\nsrc/utils/helpers.ts:42: items.forEach\nsrc/services/api.ts:15: result.items",
      stderr: "",
      exit_code: 0,
    },
  });

  // Debug state
  postServerEvent({
    t: "SET_DEBUG_STATE",
    state: {
      phase: "resolved",
      hypotheses: [
        {
          id: nextId("hyp"),
          description: "Array 'items' is undefined when API returns empty response",
          status: "confirmed",
          confidence: 0.95,
        },
        {
          id: nextId("hyp"),
          description: "Race condition in data fetching",
          status: "refuted",
          confidence: 0.2,
        },
      ],
    },
  });
  await abortableSleep(200, signal);

  // Changes phase
  postServerEvent({
    t: "UPDATE_TURN_PHASE",
    turn_id: turnId,
    phase: "changes",
    entry: { status: "running", summary: "Applying fix..." },
  });

  await emitToolCall(
    turnId,
    "Edit",
    "write",
    "src/utils/helpers.ts",
    "Added null check for items array",
    signal,
    350,
    [
      "@@ -26,3 +26,4 @@",
      "-  const len = items.length;",
      "+  const items = response.data?.items ?? [];",
      "+  const len = items.length;",
    ].join("\n"),
  );

  const fileChange: FileChange = {
    file_path: "src/utils/helpers.ts",
    turn_id: turnId,
    status: "modified",
    insertions: 5,
    deletions: 2,
    approval_status: "pending",
    intent: "Add null check for items array",
  };
  postServerEvents([
    { t: "UPSERT_FILE_CHANGE", file_change: fileChange },
    {
      t: "PUSH_TIMELINE",
      event: {
        id: nextId("evt"),
        turn_id: turnId,
        type: "file_modified",
        timestamp_ms: Date.now(),
        summary: "Modified src/utils/helpers.ts",
      },
    },
  ]);
  await abortableSleep(300, signal);

  // Diff loaded for the changed file
  postServerEvent({
    t: "SET_DIFF_LOADED",
    id: userMsgId,
    diff_text:
      "--- a/src/utils/helpers.ts\n+++ b/src/utils/helpers.ts\n@@ -26,7 +26,9 @@\n-  const len = items.length;\n+  const items = response.data?.items ?? [];\n+  const len = items.length;\n",
  });

  postServerEvent({
    t: "UPDATE_TURN_PHASE",
    turn_id: turnId,
    phase: "changes",
    entry: { status: "success", summary: "1 file changed (+5, -2)" },
  });

  // Test results
  postServerEvent({
    t: "SET_TEST_RESULTS",
    results: {
      runner_status: "pass",
      total: 38,
      passed: 38,
      failed: 0,
      skipped: 1,
      duration_ms: 2800,
      cases: [
        {
          name: "processItems handles undefined",
          suite: "helpers",
          status: "pass",
          duration_ms: 8,
        },
        {
          name: "processItems handles empty array",
          suite: "helpers",
          status: "pass",
          duration_ms: 5,
        },
        {
          name: "processItems handles valid data",
          suite: "helpers",
          status: "pass",
          duration_ms: 12,
        },
      ],
      command: "vitest run helpers.test.ts",
      turn_id: turnId,
    },
  });

  await emitSummary(
    turnId,
    `## Bug Fix Applied\n\n**Root Cause:** \`processItems()\` at \`helpers.ts:28\` accessed \`.length\` on an undefined \`items\` array when the API returns an empty response body.\n\n**Fix:** Added null coalescing with fallback to empty array:\n\`\`\`ts\nconst items = response.data?.items ?? [];\n\`\`\`\n\n**Tests:** All 38 tests passing, including 3 new edge case tests.\n\nThe fix is minimal and backward-compatible. No other callers are affected.`,
    signal,
    1500,
  );

  postServerEvents([
    {
      t: "PUSH_NOTIFICATION",
      notification: {
        id: nextId("notif"),
        type: "agent_complete",
        urgency: "normal",
        title: "Bug Fixed",
        message: "Root cause identified and patched. All tests pass.",
        timestamp_ms: Date.now(),
        auto_dismiss_ms: 5000,
      },
    },
    {
      t: "PUSH_PROMPT_SUGGESTION",
      suggestion: { id: nextId("sug"), text: "Write more edge case tests", confidence: 0.8 },
    },
  ]);

  finalizeTurn(turnId, ctx);
}
