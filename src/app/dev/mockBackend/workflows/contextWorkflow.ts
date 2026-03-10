import {
  abortableSleep,
  type AgentPersona,
  emitSummary,
  emitThinking,
  emitTurnStart,
  finalizeTurn,
  type HandlerContext,
  type MessageId,
  postServerEvent,
  type TurnId,
} from "./types";

export async function runAutoContextWorkflow(
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
    `${persona.name} here. Analyzing dependency graph and semantic relevance to find the most useful context...`,
    "Analyzing context...",
    signal,
  );

  // Auto context: analyzing
  postServerEvent({
    t: "SET_AUTO_CONTEXT",
    turn_id: "turn_1" as TurnId,
    state: { suggestions: [], total_token_cost: 0, budget_tokens: 8000, status: "analyzing" },
  });
  await abortableSleep(1200, signal);

  // Auto context: ready
  const autoCtx = {
    suggestions: [
      {
        id: "ctx-1",
        file_path: "src/shared/protocol/types.ts",
        relevance_score: 0.95,
        reason: "Core type definitions — direct match for query",
        token_cost: 2400,
        accepted: true,
        snippet: "export type ServerEvent = ...",
      },
      {
        id: "ctx-2",
        file_path: "src/features/streaming/model/dispatchServerEvent.ts",
        relevance_score: 0.88,
        reason: "Event dispatcher — routes all ServerEvents",
        token_cost: 1800,
        accepted: true,
      },
      {
        id: "ctx-3",
        file_path: "src/app/dev/mockBackend/handlers/streamingHandlers.ts",
        relevance_score: 0.82,
        reason: "Mock backend — generates test events",
        token_cost: 3200,
        accepted: true,
      },
      {
        id: "ctx-4",
        file_path: "tests/integration/events.test.ts",
        relevance_score: 0.65,
        reason: "Integration tests — verifies event flow",
        token_cost: 900,
        accepted: false,
      },
    ],
    total_token_cost: 7400,
    budget_tokens: 8000,
    status: "ready" as const,
  };
  ctx.sotaState.autoContext = autoCtx;
  postServerEvent({ t: "SET_AUTO_CONTEXT", turn_id: "turn_1" as TurnId, state: autoCtx });

  await emitSummary(
    turnId,
    `## Context Analysis Complete\n\nFound **4 relevant files** (3 auto-included, 1 optional):\n\n| File | Relevance | Tokens | Status |\n|------|-----------|--------|--------|\n| \`types.ts\` | 95% | 2,400 | [PASS] Included |\n| \`dispatchServerEvent.ts\` | 88% | 1,800 | [PASS] Included |\n| \`streamingHandlers.ts\` | 82% | 3,200 | [PASS] Included |\n| \`events.test.ts\` | 65% | 900 | ⬜ Optional |\n\n**Token budget:** 7,400 / 8,000 used (92.5%)\n\nThe top 3 files provide complete coverage of the event system. The test file is optional but useful for understanding expected behavior.`,
    signal,
    1500,
  );

  finalizeTurn(turnId, ctx);
}
