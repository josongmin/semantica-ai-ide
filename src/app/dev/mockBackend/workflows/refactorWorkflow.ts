import type { FileChange, ReviewCommentId } from "../../../../shared/protocol";
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
  requestThreeWayDiffResolution,
  type TurnId,
} from "./types";

export async function runRefactorWorkflow(
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
    `${persona.name} here. Analyzing patterns and finding opportunities for elegant abstractions...`,
    "Analyzing code structure...",
    signal,
  );
  await abortableSleep(200, signal);

  // Speculative edits
  postServerEvent({
    t: "SET_SPECULATIVE_EDITS",
    turn_id: "turn_1" as TurnId,
    state: { edits: [], status: "predicting" },
  });
  await abortableSleep(800, signal);
  postServerEvent({
    t: "SET_SPECULATIVE_EDITS",
    turn_id: "turn_1" as TurnId,
    state: {
      edits: [
        {
          id: "spec-r1",
          file_path: "src/utils/helpers.ts",
          original_text: "function processData(a, b, c) {",
          proposed_text: "function processData({ input, config, options }: ProcessParams) {",
          line_start: 12,
          line_end: 12,
          confidence: 0.92,
          risk_level: "safe",
          status: "pending",
        },
        {
          id: "spec-r2",
          file_path: "src/utils/helpers.ts",
          original_text: "if (x) { if (y) { if (z) {",
          proposed_text: "if (!x || !y || !z) return;\n",
          line_start: 30,
          line_end: 32,
          confidence: 0.88,
          risk_level: "safe",
          status: "pending",
        },
        {
          id: "spec-r3",
          file_path: "src/components/Form.tsx",
          original_text: "const [a, setA] = useState();\nconst [b, setB] = useState();",
          proposed_text: "const { a, b, updateForm } = useFormState();",
          line_start: 8,
          line_end: 9,
          confidence: 0.75,
          risk_level: "moderate",
          status: "pending",
        },
      ],
      status: "ready",
      model_id: "claude-sonnet-4-6",
    },
  });

  // Analysis
  postServerEvent({
    t: "UPDATE_TURN_PHASE",
    turn_id: turnId,
    phase: "analysis",
    entry: { status: "running", summary: "Scanning for patterns..." },
  });
  const tcGlob = await emitToolCall(
    turnId,
    "Glob",
    "search",
    "src/**/*.ts",
    "Found 45 TypeScript files",
    signal,
    300,
  );
  const tcGrepRef = await emitToolCall(
    turnId,
    "Grep",
    "search",
    "function.*\\(.*,.*,.*,",
    "Found 8 functions with 3+ params",
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
      summary: "Pattern scan: src/**/*.ts + 8 functions",
      tool_call_ids: [tcGlob, tcGrepRef],
    },
  });

  // Plan
  postServerEvent({
    t: "UPSERT_PLAN_CHECKLIST",
    turn_id: turnId,
    items: [
      { id: "p1", label: "Extract named parameters pattern", status: "completed" },
      { id: "p2", label: "Flatten nested conditionals", status: "completed" },
      { id: "p3", label: "Extract custom hook from Form", status: "in_progress" },
      { id: "p4", label: "Run type-check and tests", status: "pending" },
    ],
  });
  await abortableSleep(200, signal);

  // Update plan items as we go
  postServerEvent({ t: "UPDATE_PLAN_ITEM", turn_id: turnId, item_id: "p3", status: "completed" });
  postServerEvent({ t: "UPDATE_PLAN_ITEM", turn_id: turnId, item_id: "p4", status: "in_progress" });

  // Symbol mentions discovered during analysis
  postServerEvent({
    t: "SET_SYMBOL_MENTIONS",
    symbols: [
      {
        name: "processData",
        kind: "function",
        file_path: "src/utils/helpers.ts",
        line: 12,
        turn_id: turnId as string,
      },
      {
        name: "Form",
        kind: "class",
        file_path: "src/components/Form.tsx",
        line: 5,
        turn_id: turnId as string,
      },
      {
        name: "useFormState",
        kind: "function",
        file_path: "src/hooks/useFormState.ts",
        line: 1,
        turn_id: turnId as string,
      },
      {
        name: "ProcessParams",
        kind: "type",
        file_path: "src/utils/helpers.ts",
        line: 3,
        turn_id: turnId as string,
      },
    ],
  });

  // File changes with inline diffs
  postServerEvent({
    t: "UPDATE_TURN_PHASE",
    turn_id: turnId,
    phase: "changes",
    entry: { status: "running", summary: "Applying refactors..." },
  });

  await emitToolCall(
    turnId,
    "Edit",
    "write",
    "src/utils/helpers.ts",
    "Named params + guard clauses",
    signal,
    350,
    [
      "@@ -12,5 +12,4 @@",
      "-function processData(a, b, c) {",
      "-  if (x) { if (y) { if (z) {",
      "-    doStuff();",
      "-  }}}",
      "+function processData({ input, config, options }: ProcessParams) {",
      "+  if (!x || !y || !z) return;",
      "+  doStuff();",
      " }",
    ].join("\n"),
  );

  await emitToolCall(
    turnId,
    "Edit",
    "write",
    "src/components/Form.tsx",
    "Extract useFormState hook",
    signal,
    300,
    [
      "@@ -8,4 +8,2 @@",
      "-const [a, setA] = useState();",
      "-const [b, setB] = useState();",
      "-const [c, setC] = useState();",
      "+const { a, b, c, updateForm } = useFormState();",
    ].join("\n"),
  );

  await emitToolCall(
    turnId,
    "Write",
    "write",
    "src/hooks/useFormState.ts",
    "45 lines written",
    signal,
    250,
  );

  const changes: FileChange[] = [
    {
      file_path: "src/utils/helpers.ts",
      turn_id: turnId,
      status: "modified",
      insertions: 15,
      deletions: 22,
      approval_status: "pending",
      intent: "Named params + guard clauses",
    },
    {
      file_path: "src/components/Form.tsx",
      turn_id: turnId,
      status: "modified",
      insertions: 8,
      deletions: 12,
      approval_status: "pending",
      intent: "Extract useFormState hook",
    },
    {
      file_path: "src/hooks/useFormState.ts",
      turn_id: turnId,
      status: "added",
      insertions: 25,
      deletions: 0,
      approval_status: "pending",
      intent: "New custom hook",
    },
  ];
  for (const fc of changes) {
    postServerEvent({ t: "UPSERT_FILE_CHANGE", file_change: fc });
    await abortableSleep(200, signal);
  }

  // Three-way diff HITL — blocks workflow until user resolves the conflict
  const diffId = nextId("diff3");
  const resolution = await requestThreeWayDiffResolution(
    diffId,
    turnId,
    {
      file_path: "src/utils/helpers.ts",
      base_content:
        "function processData(a, b, c) {\n  if (x) { if (y) { if (z) {\n    doStuff();\n  }}}\n}",
      agent_content:
        "function processData({ input, config, options }: ProcessParams) {\n  if (!x || !y || !z) return;\n  doStuff();\n}",
      current_content:
        "function processData(a, b, c) {\n  if (x) { if (y) { if (z) {\n    doStuff();\n    logResult(); // added by user\n  }}}\n}",
      conflicts: [{ start_line: 2, end_line: 4 }],
    },
    signal,
    ctx,
  );
  // eslint-disable-next-line no-console
  console.log(`[refactorWorkflow] Three-way diff resolved: ${resolution}`);

  // Patch simulation
  postServerEvent({
    t: "SET_PATCH_SIMULATION",
    turn_id: "turn_1" as TurnId,
    file_path: "src/utils/helpers.ts",
    conflict_risk: "medium",
    conflict_details:
      "Line 4: user added logResult() call that conflicts with guard clause refactor",
    affected_files: [
      "src/utils/helpers.ts",
      "src/components/Form.tsx",
      "src/hooks/useFormState.ts",
    ],
  });
  await abortableSleep(200, signal);

  postServerEvent({
    t: "UPDATE_TURN_PHASE",
    turn_id: turnId,
    phase: "changes",
    entry: { status: "success", summary: "3 files changed (+48, -34)" },
  });
  postServerEvent({ t: "UPDATE_PLAN_ITEM", turn_id: turnId, item_id: "p4", status: "completed" });

  // Self-review
  postServerEvent({
    t: "UPSERT_REVIEW_COMMENT",
    comment: {
      id: nextId("rc") as ReviewCommentId,
      file_path: "src/hooks/useFormState.ts",
      line: 1,
      text: "New hook extracted — verify integration with existing form tests",
      message: "New hook extracted — verify integration with existing form tests",
      severity: "info",
      status: "open",
      author: persona.name,
      created_at_ms: Date.now(),
    },
  });

  await emitSummary(
    turnId,
    `## Refactoring Complete\n\n**3 improvements applied:**\n\n1. **Named Parameters** — Converted positional args to destructured objects for clarity\n2. **Guard Clauses** — Flattened 3-level nested conditionals into early returns\n3. **Custom Hook** — Extracted \`useFormState\` from Form component (SRP)\n\n**Impact:** -34 lines removed, +48 lines added. Net reduction in complexity. All existing tests pass.`,
    signal,
    1500,
  );

  finalizeTurn(turnId, ctx);
}
