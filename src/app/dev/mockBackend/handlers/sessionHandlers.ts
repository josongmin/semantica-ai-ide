/**
 * Session Management Handlers
 *
 * Covers: NEW_SESSION, LOAD_SESSION_LIST, RESUME_SESSION, CLEAR_CONVERSATION,
 *         DELETE_SESSION, FORK_SESSION
 */
import type { MessageId, SessionId, TurnId } from "../../../../shared/protocol";
import {
  nextId,
  postServerEvent,
  postServerEvents,
} from "../MockBackendCore";
import { createMockSessionState } from "../MockSessionState";
import { MODEL_LABELS } from "./handlerConstants";
import type { Handler, HandlerContext } from "./index";

// ── Internal helpers ──────────────────────────────────────────

function handleNewSession(ctx: HandlerContext) {
  postServerEvent({ t: "RESET_STORES" });
  const newState = createMockSessionState();
  ctx.setState(newState);
  postServerEvents([
    {
      t: "SET_SESSION_META",
      meta: {
        session_id: newState.sessionId,
        model_id: newState.activeModel,
        model_label: MODEL_LABELS[newState.activeModel] ?? newState.activeModel,
        approval_mode: newState.approvalMode,
        status: "idle",
        cost_usd: 0,
        tokens_in: 0,
        tokens_out: 0,
      },
    },
    { t: "SET_CURRENT_PAGE", page: "chat" },
    {
      t: "SET_AVAILABLE_MODELS",
      models: [
        { id: "claude-opus-4-6", label: "Claude Opus 4.6", provider: "anthropic", supports_thinking: true },
        { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "anthropic", supports_thinking: true },
        { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "anthropic", supports_thinking: false },
      ],
    },
  ]);
}

function handleLoadSessionList() {
  const sessions = [
    {
      session_id: nextId("session") as SessionId,
      title: "\uD504\uB85C\uC81D\uD2B8 \uAD6C\uC870 \uBD84\uC11D",
      model_label: "Claude Opus 4.6",
      status: "completed" as const,
      created_at_ms: Date.now() - 3_600_000,
      cost_usd: 0.0234,
      turn_count: 5,
      last_message_preview: "\uD504\uB85C\uC81D\uD2B8 \uAD6C\uC870\uB97C \uBD84\uC11D\uD574\uB4DC\uB838\uC2B5\uB2C8\uB2E4...",
    },
    {
      session_id: nextId("session") as SessionId,
      title: "\uBC84\uADF8 \uC218\uC815 \u2014 useCallback \uC758\uC874\uC131",
      model_label: "Claude Sonnet 4.6",
      status: "completed" as const,
      created_at_ms: Date.now() - 7_200_000,
      cost_usd: 0.0156,
      turn_count: 3,
      last_message_preview: "stale closure \uBB38\uC81C\uB97C \uC218\uC815\uD588\uC2B5\uB2C8\uB2E4...",
    },
    {
      session_id: nextId("session") as SessionId,
      title: "\uD14C\uC2A4\uD2B8 \uCEE4\uBC84\uB9AC\uC9C0 \uAC1C\uC120",
      model_label: "Claude Opus 4.6",
      status: "completed" as const,
      created_at_ms: Date.now() - 86_400_000,
      cost_usd: 0.0312,
      turn_count: 8,
      last_message_preview: "\uD14C\uC2A4\uD2B8 \uCEE4\uBC84\uB9AC\uC9C0\uB97C 87%\uC5D0\uC11C 94%\uB85C...",
    },
  ];
  postServerEvent({ t: "SET_SESSION_LIST", sessions });
  postServerEvent({ t: "SET_CURRENT_PAGE", page: "sessions" });
}

function handleResumeSession(sessionId: SessionId, ctx: HandlerContext) {
  const newState = createMockSessionState();
  newState.sessionId = sessionId;
  ctx.setState(newState);

  const turnId = nextId("turn") as TurnId;
  const msgId = nextId("msg") as MessageId;
  const now = Date.now();

  postServerEvents([
    {
      t: "SET_SESSION_META",
      meta: {
        session_id: sessionId,
        model_id: newState.activeModel,
        model_label: MODEL_LABELS[newState.activeModel] ?? newState.activeModel,
        approval_mode: newState.approvalMode,
        status: "idle",
        cost_usd: 0.0127,
        tokens_in: 2340,
        tokens_out: 892,
      },
    },
    { t: "SET_CURRENT_PAGE", page: "chat" },
    {
      t: "UPSERT_MESSAGE",
      msg: {
        id: msgId,
        turn_id: turnId,
        role: "assistant",
        created_at_ms: now - 30_000,
        text: "\uC774\uC804 \uC138\uC158\uC744 \uBCF5\uC6D0\uD588\uC2B5\uB2C8\uB2E4. \uC774\uC5B4\uC11C \uC791\uC5C5\uD558\uC2DC\uBA74 \uB429\uB2C8\uB2E4.",
        status: "final",
      },
    },
    {
      t: "UPSERT_TURN",
      turn: {
        id: turnId,
        phases: [
          {
            phase: "summary",
            message_ids: [msgId],
            tool_call_ids: [],
            summary: "Session restored",
            collapsed: false,
            status: "success",
          },
        ],
        status: "success",
        created_at_ms: now - 30_000,
      },
    },
  ]);
}

function handleForkSession(sourceTurnId: TurnId, ctx: HandlerContext) {
  const newSessionId = nextId("session") as SessionId;
  postServerEvent({
    t: "FORK_SESSION",
    source_session_id: ctx.state.sessionId,
    source_turn_id: sourceTurnId,
    new_session_id: newSessionId,
  });
  // eslint-disable-next-line no-console
  console.log(`[mockBackend] Forked from turn ${sourceTurnId} \u2192 session ${newSessionId}`);
}

// ── Registration ──────────────────────────────────────────────

export function registerSessionHandlers(registry: Map<string, Handler>): void {
  registry.set("NEW_SESSION", (_msg, ctx) => {
    handleNewSession(ctx);
  });

  registry.set("LOAD_SESSION_LIST", () => {
    handleLoadSessionList();
  });

  registry.set("RESUME_SESSION", (msg, ctx) => {
    handleResumeSession(msg.session_id as SessionId, ctx);
  });

  registry.set("CLEAR_CONVERSATION", (_msg, ctx) => {
    postServerEvent({ t: "RESET_STORES" });
    ctx.setState(createMockSessionState());
  });

  registry.set("DELETE_SESSION", () => {
    handleLoadSessionList();
  });

  registry.set("FORK_SESSION", (msg, ctx) => {
    handleForkSession(msg.source_turn_id as TurnId, ctx);
  });
}
