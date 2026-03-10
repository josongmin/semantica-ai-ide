/**
 * Shared types and helpers for mock workflow implementations.
 */
import type {
  AgentRole,
  MessageId,
  TimelineEvent,
  ToolCall,
  ToolCategory,
  TurnId,
} from "../../../../shared/protocol";
import type { HandlerContext } from "../handlers/index";
import {
  abortableSleep,
  nextId,
  postServerEvent,
  postServerEvents,
  streamText,
} from "../MockBackendCore";
import { addCost } from "../MockSessionState";

// ── Types ────────────────────────────────────────────────────

export type WorkflowId =
  | "review" | "bugfix" | "refactor" | "test" | "explain"
  | "auto-context" | "background" | "replay" | "debate" | "rules"
  | "security" | "cicd" | "speculate" | "search" | "plan"
  | "onboarding" | "general";

export interface AgentPersona {
  name: string;
  tone: string;
  role: AgentRole;
  greeting: string;
}

export interface AnalysisResult {
  workflow: WorkflowId;
  keywords: string[];
  confidence: number;
  persona: AgentPersona;
}

export type WorkflowFn = (
  text: string,
  turnId: TurnId,
  userMsgId: MessageId,
  ctx: HandlerContext,
  persona: AgentPersona,
  signal: AbortSignal,
) => Promise<void>;

// ── Shared Helpers ───────────────────────────────────────────

const MODEL_LABELS: Record<string, string> = {
  "claude-opus-4-6": "Claude Opus 4.6",
  "claude-sonnet-4-6": "Claude Sonnet 4.6",
  "claude-haiku-4-5": "Claude Haiku 4.5",
};

/** Set up turn boilerplate: session meta, user message, turn */
export function emitTurnStart(
  text: string,
  turnId: TurnId,
  userMsgId: MessageId,
  ctx: HandlerContext,
  persona: AgentPersona,
) {
  const now = Date.now();
  postServerEvents([
    {
      t: "SET_SESSION_META",
      meta: {
        status: "running",
        model_label: MODEL_LABELS[ctx.state.activeModel] ?? ctx.state.activeModel,
      },
    },
    {
      t: "UPSERT_MESSAGE",
      msg: {
        id: userMsgId,
        turn_id: turnId,
        role: "user",
        created_at_ms: now,
        text,
        status: "final",
      },
    },
    {
      t: "UPSERT_TURN",
      turn: {
        id: turnId,
        phases: [
          {
            phase: "user_message",
            message_ids: [userMsgId],
            tool_call_ids: [],
            summary: text.slice(0, 80),
            collapsed: false,
            status: "success",
          },
        ],
        status: "running",
        created_at_ms: now,
        agent_name: persona.name,
        agent_role: persona.role,
      },
    },
  ]);
}

/** Emit thinking phase */
export async function emitThinking(
  turnId: TurnId,
  thinkingText: string,
  summary: string,
  signal: AbortSignal,
  durationMs = 800,
) {
  const msgId = nextId("msg") as MessageId;
  postServerEvents([
    {
      t: "UPSERT_MESSAGE",
      msg: { id: msgId, turn_id: turnId, role: "assistant", created_at_ms: Date.now(), text: "", status: "streaming" },
    },
    {
      t: "UPDATE_TURN_PHASE",
      turn_id: turnId,
      phase: "thinking",
      entry: { status: "running", summary, message_ids: [msgId] },
    },
  ]);
  await streamText(msgId, thinkingText, durationMs, signal);
  postServerEvents([
    { t: "SET_MESSAGE_STATUS", id: msgId, status: "final" },
    { t: "UPDATE_TURN_PHASE", turn_id: turnId, phase: "thinking", entry: { status: "success", collapsed: true, summary: "" } },
  ]);
}

/** Emit summary (final response) phase */
export async function emitSummary(
  turnId: TurnId,
  text: string,
  signal: AbortSignal,
  durationMs = 1200,
): Promise<MessageId> {
  const msgId = nextId("msg") as MessageId;
  postServerEvents([
    {
      t: "UPSERT_MESSAGE",
      msg: { id: msgId, turn_id: turnId, role: "assistant", created_at_ms: Date.now(), text: "", status: "streaming" },
    },
    {
      t: "UPDATE_TURN_PHASE",
      turn_id: turnId,
      phase: "summary",
      entry: { status: "running", message_ids: [msgId] },
    },
  ]);
  await streamText(msgId, text, durationMs, signal);
  postServerEvents([
    { t: "SET_MESSAGE_STATUS", id: msgId, status: "final" },
    { t: "UPDATE_TURN_PHASE", turn_id: turnId, phase: "summary", entry: { status: "success" } },
  ]);
  return msgId;
}

/** Emit a mock tool call with timing */
export async function emitToolCall(
  turnId: TurnId,
  toolName: string,
  category: ToolCategory,
  argsSummary: string,
  resultSummary: string,
  signal: AbortSignal,
  durationMs = 400,
  /** Optional unified diff text for edit/write tool calls */
  diffText?: string,
) {
  const tcId = nextId("tc");
  const toolCall: ToolCall = {
    id: tcId, turn_id: turnId, tool_name: toolName,
    category, args_summary: argsSummary, status: "running", duration_ms: 0,
  };
  postServerEvents([
    { t: "UPSERT_TOOL_CALL", tool_call: toolCall },
    { t: "PUSH_TIMELINE", event: { id: nextId("evt"), turn_id: turnId, type: "tool_call_start", timestamp_ms: Date.now(), summary: `${toolName}: ${argsSummary}` } as TimelineEvent },
  ]);
  await abortableSleep(durationMs, signal);
  postServerEvents([
    { t: "UPDATE_TOOL_CALL_STATUS", id: tcId, status: "success", result_summary: resultSummary, duration_ms: durationMs, ...(diffText ? { diff_text: diffText } : {}) },
    { t: "PUSH_TIMELINE", event: { id: nextId("evt"), turn_id: turnId, type: "tool_call_end", timestamp_ms: Date.now(), summary: `${toolName} completed (${durationMs}ms)` } as TimelineEvent },
  ]);
  return tcId;
}

/** Finalize turn with metrics */
export function finalizeTurn(turnId: TurnId, ctx: HandlerContext) {
  const cost = 0.005 + Math.random() * 0.02;
  const tokIn = 800 + Math.floor(Math.random() * 2000);
  const tokOut = 300 + Math.floor(Math.random() * 1000);
  addCost(ctx.state, cost, tokIn, tokOut);

  postServerEvents([
    { t: "UPSERT_TURN", turn: { id: turnId, phases: [], status: "success", created_at_ms: Date.now() } },
    { t: "SET_SESSION_META", meta: { status: "idle", cost_usd: ctx.state.costUsd, tokens_in: ctx.state.tokensIn, tokens_out: ctx.state.tokensOut } },
    { t: "UPDATE_TURN_METRICS", turn_id: turnId, ttft_ms: 120 + Math.floor(Math.random() * 200), latency_ms: 2000 + Math.floor(Math.random() * 3000), estimated_cost_usd: cost, token_usage: { input_tokens: tokIn, output_tokens: tokOut } },
    { t: "ADD_CHECKPOINT", checkpoint: { id: nextId("cp"), turn_id: turnId, label: `Turn ${ctx.state.turnCounter}`, timestamp_ms: Date.now() } },
  ]);
  ctx.state.turnIds.push(turnId);
}

export function finalizeCancelledTurn(turnId: TurnId) {
  postServerEvents([
    { t: "UPSERT_TURN", turn: { id: turnId, phases: [], status: "error", created_at_ms: Date.now() } },
    { t: "SET_SESSION_META", meta: { status: "idle" } },
  ]);
}

/** Block workflow until user resolves a three-way diff conflict */
export function requestThreeWayDiffResolution(
  id: string,
  turnId: TurnId,
  data: {
    file_path: string;
    base_content: string;
    agent_content: string;
    current_content: string;
    conflicts: readonly { start_line: number; end_line: number }[];
  },
  signal: AbortSignal,
  ctx: HandlerContext,
): Promise<string> {
  postServerEvent({
    t: "SET_THREE_WAY_DIFF",
    data: { id, turn_id: turnId, status: "pending", ...data },
  });

  return new Promise<string>((resolve) => {
    if (ctx.pendingDiffResolve) ctx.pendingDiffResolve("accept_agent");
    ctx.setPendingDiffResolve(resolve);

    const timeout = setTimeout(() => {
      if (ctx.pendingDiffResolve === resolve) {
        ctx.setPendingDiffResolve(null);
        resolve("accept_agent");
      }
    }, 60_000);

    signal.addEventListener("abort", () => {
      clearTimeout(timeout);
      if (ctx.pendingDiffResolve === resolve) {
        ctx.setPendingDiffResolve(null);
        resolve("accept_agent");
      }
    }, { once: true });
  });
}

// Re-export utilities that workflows need
export type { FileChange, MessageId, TurnId } from "../../../../shared/protocol";
export type { HandlerContext } from "../handlers/index";
export { abortableSleep, nextAgentId, nextId, nextMsgId, nextSessionId, nextTurnId, postServerEvent, postServerEvents, sleep } from "../MockBackendCore";
