import {
  abortableSleep,
  type AgentPersona,
  emitSummary,
  emitTurnStart,
  finalizeTurn,
  type HandlerContext,
  type MessageId,
  nextId,
  postServerEvent,
  postServerEvents,
  type TurnId,
} from "./types";

export async function runOnboardingWorkflow(text: string, turnId: TurnId, userMsgId: MessageId, ctx: HandlerContext, persona: AgentPersona, signal: AbortSignal) {
  emitTurnStart(text, turnId, userMsgId, ctx, persona);
  await abortableSleep(300, signal);

  await emitSummary(
    turnId,
    `## Welcome to Semantica!\n\nI'm your AI coding agent. Here's what I can do:\n\n###  Core Capabilities\n- **Code Review** — "review this code"\n- **Bug Fix** — "fix the login bug"\n- **Refactor** — "refactor the auth module"\n- **Tests** — "run tests with coverage"\n- **Explain** — "explain how routing works"\n\n###  Advanced Features\n- **Security Scan** — "scan for vulnerabilities"\n- **Multi-Agent Debate** — "compare JWT vs session auth"\n- **Background Jobs** — "run analysis in background"\n- **Action Replay** — "replay last turn step by step"\n- **Speculative Edits** — "predict what I need next"\n- **CI/CD** — "deploy to preview"\n\n###  Quick Start\nJust type what you need in natural language. I'll figure out the right workflow.\n\nTry: "review the auth module for security issues"`,
    signal, 1500,
  );

  // Usage stats
  postServerEvent({
    t: "SET_USAGE_STATS",
    stats: {
      total_sessions: 127,
      total_cost_usd: 45.82,
      total_tokens: 2840000,
      per_model: [
        { model: "claude-opus-4-6", tokens: 1200000, cost_usd: 28.50 },
        { model: "claude-sonnet-4-6", tokens: 1400000, cost_usd: 14.82 },
        { model: "claude-haiku-4-5", tokens: 240000, cost_usd: 2.50 },
      ],
    },
  });

  // Session summary
  postServerEvent({
    t: "UPDATE_SESSION_SUMMARY",
    summary: "Welcome session started. User greeted and shown available capabilities.",
    stats: { turns_count: 1, files_modified: 0, files_created: 0, files_deleted: 0, tool_calls_count: 0, errors_count: 0 },
  });

  // Cancel any pending user input (clean slate)
  postServerEvent({ t: "CANCEL_USER_INPUT", id: nextId("cui") });

  postServerEvents([
    { t: "PUSH_PROMPT_SUGGESTION", suggestion: { id: nextId("sug"), text: "Review the auth module", confidence: 0.8 } },
    { t: "PUSH_PROMPT_SUGGESTION", suggestion: { id: nextId("sug"), text: "Explain the project architecture", confidence: 0.7 } },
    { t: "PUSH_PROMPT_SUGGESTION", suggestion: { id: nextId("sug"), text: "Find the main entry point", confidence: 0.6 } },
  ]);

  finalizeTurn(turnId, ctx);
}
