import type { ReviewCommentId } from "../../../../shared/protocol";
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

export async function runReviewWorkflow(text: string, turnId: TurnId, userMsgId: MessageId, ctx: HandlerContext, persona: AgentPersona, signal: AbortSignal) {
  emitTurnStart(text, turnId, userMsgId, ctx, persona);
  await abortableSleep(300, signal);

  await emitThinking(turnId, `${persona.name} here. Let me carefully analyze the code for issues, anti-patterns, and potential improvements...`, "Reviewing code...", signal);
  await abortableSleep(200, signal);

  // Analysis phase with tool calls
  postServerEvent({ t: "UPDATE_TURN_PHASE", turn_id: turnId, phase: "analysis", entry: { status: "running", summary: "Scanning files..." } });
  const tc1 = await emitToolCall(turnId, "Read", "read", "src/components/Button.tsx", "Read 85 lines", signal, 300);
  const tc2 = await emitToolCall(turnId, "Read", "read", "src/utils/helpers.ts", "Read 120 lines", signal, 300);
  const filesRead = ["Button.tsx", "helpers.ts"];
  postServerEvent({
    t: "UPDATE_TURN_PHASE",
    turn_id: turnId,
    phase: "analysis",
    entry: { status: "success", collapsed: true, summary: `2 files: ${filesRead.join(", ")}`, tool_call_ids: [tc1, tc2] },
  });

  // Review comments
  const comments: { severity: "error" | "warning" | "suggestion"; message: string; line: number; file: string }[] = [
    { severity: "error", message: "Missing null check — `user.email` may be undefined when fetching from API", line: 42, file: "src/components/Button.tsx" },
    { severity: "warning", message: "Unused variable `tempData` — consider removing to reduce bundle size", line: 67, file: "src/components/Button.tsx" },
    { severity: "suggestion", message: "Consider extracting this logic into a custom hook `useButtonState`", line: 23, file: "src/components/Button.tsx" },
    { severity: "warning", message: "Magic number 5000 — extract to named constant `DEFAULT_TIMEOUT_MS`", line: 15, file: "src/utils/helpers.ts" },
    { severity: "suggestion", message: "This function could benefit from memoization with `useMemo`", line: 89, file: "src/utils/helpers.ts" },
  ];

  for (const c of comments) {
    await abortableSleep(300, signal);
    postServerEvent({
      t: "UPSERT_REVIEW_COMMENT",
      comment: {
        id: nextId("rc") as ReviewCommentId,
        file_path: c.file,
        line: c.line,
        text: c.message,
        message: c.message,
        severity: c.severity,
        status: "open",
        author: persona.name,
        created_at_ms: Date.now(),
      },
    });
  }

  // Batch review comments for the second file
  postServerEvent({
    t: "SET_REVIEW_COMMENTS",
    file_path: "src/utils/helpers.ts",
    comments: [
      { id: nextId("rc") as ReviewCommentId, file_path: "src/utils/helpers.ts", line: 15, text: "Magic number 5000 — extract to named constant", severity: "warning", status: "open", author: persona.name, created_at_ms: Date.now() },
      { id: nextId("rc") as ReviewCommentId, file_path: "src/utils/helpers.ts", line: 89, text: "Consider memoization with useMemo", severity: "suggestion", status: "open", author: persona.name, created_at_ms: Date.now() },
    ],
  });

  // Completion stats
  postServerEvent({
    t: "SET_COMPLETION_STATS",
    stats: { shown_today: 42, accepted_today: 35, acceptance_rate: 0.833 },
  });

  await emitSummary(
    turnId,
    `## Code Review Complete\n\nFound **5 issues**: 1 critical, 2 warnings, 2 suggestions.\n\n### Critical\n- Missing null check at \`Button.tsx:42\` — could cause runtime crash\n\n### Warnings\n- Unused variable at line 67\n- Magic number at \`helpers.ts:15\`\n\n### Suggestions\n- Extract button logic to custom hook\n- Add memoization for expensive computation\n\nPlease address the critical issue first. The warnings and suggestions can be handled in follow-up PRs.`,
    signal, 1500,
  );

  postServerEvents([
    { t: "PUSH_PROMPT_SUGGESTION", suggestion: { id: nextId("sug"), text: "Fix the critical null check issue", confidence: 0.9 } },
    { t: "PUSH_PROMPT_SUGGESTION", suggestion: { id: nextId("sug"), text: "Apply all suggested fixes", confidence: 0.7 } },
  ]);

  finalizeTurn(turnId, ctx);
}
