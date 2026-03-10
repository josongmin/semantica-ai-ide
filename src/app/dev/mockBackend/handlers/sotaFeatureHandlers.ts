/**
 * SOTA Feature Handlers
 *
 * Covers:
 * - Agent rules
 * - Smart context (auto context suggestions)
 * - Speculative edits
 * - Background agent jobs
 * - Action replay
 * - HITL user input
 * - Multi-agent debate
 * - Noop handlers (IDE-only messages)
 */
import type { AgentRule, ReplaySession, TurnId } from "../../../../shared/protocol";
import { nextId, postServerEvent } from "../MockBackendCore";
import type { Handler } from "./index";

// ── Registration ──────────────────────────────────────────────

export function registerSotaFeatureHandlers(registry: Map<string, Handler>): void {
  // ── SOTA: Agent Rules ───────────────────────────────────────

  registry.set("LOAD_AGENT_RULES", (_msg, ctx) => {
    ctx.sotaState.agentRules = [
      {
        id: "rule-1",
        title: "Use TypeScript strict mode",
        content: "Always enable strictNullChecks",
        source: "file" as const,
        file_path: ".cursorrules",
        status: "active" as const,
        violation_count: 0,
      },
      {
        id: "rule-2",
        title: "No console.log in production",
        content: "Remove all console.log statements",
        source: "user" as const,
        status: "active" as const,
        violation_count: 2,
      },
      {
        id: "rule-3",
        title: "Prefer named exports",
        content: "Use named exports over default exports",
        source: "team" as const,
        status: "active" as const,
        violation_count: 0,
      },
      {
        id: "rule-4",
        title: "Max function length 50 lines",
        content: "Keep functions under 50 lines",
        source: "auto_detected" as const,
        status: "disabled" as const,
        violation_count: 1,
      },
    ];
    postServerEvent({ t: "SET_AGENT_RULES", rules: ctx.sotaState.agentRules });
  });

  registry.set("SAVE_AGENT_RULE", (msg, ctx) => {
    const newRule: AgentRule = {
      id: nextId("rule"),
      title: msg.rule.title,
      content: msg.rule.content,
      source: msg.rule.source as "user",
      status: "active",
      violation_count: 0,
    };
    ctx.sotaState.agentRules = [...ctx.sotaState.agentRules, newRule];
    postServerEvent({ t: "SET_AGENT_RULES", rules: ctx.sotaState.agentRules });
  });

  registry.set("DELETE_AGENT_RULE", (msg, ctx) => {
    ctx.sotaState.agentRules = ctx.sotaState.agentRules.filter((r) => r.id !== msg.rule_id);
    postServerEvent({ t: "SET_AGENT_RULES", rules: ctx.sotaState.agentRules });
  });

  registry.set("TOGGLE_AGENT_RULE", (msg, ctx) => {
    ctx.sotaState.agentRules = ctx.sotaState.agentRules.map((r) =>
      r.id === msg.rule_id ? { ...r, status: msg.status as "active" | "disabled" } : r,
    );
    postServerEvent({ t: "SET_AGENT_RULES", rules: ctx.sotaState.agentRules });
  });

  // ── SOTA: Smart Context ─────────────────────────────────────

  registry.set("REQUEST_AUTO_CONTEXT", (_msg, ctx) => {
    postServerEvent({
      t: "SET_AUTO_CONTEXT",
      turn_id: "turn_1" as TurnId,
      state: { suggestions: [], total_token_cost: 0, budget_tokens: 8000, status: "analyzing" },
    });
    setTimeout(() => {
      ctx.sotaState.autoContext = {
        suggestions: [
          {
            id: "ctx-1",
            file_path: "src/shared/protocol/types.ts",
            relevance_score: 0.95,
            reason: "Defines core types",
            token_cost: 2400,
            accepted: true,
          },
          {
            id: "ctx-2",
            file_path: "src/features/streaming/model/dispatchServerEvent.ts",
            relevance_score: 0.82,
            reason: "Event dispatcher",
            token_cost: 1800,
            accepted: true,
          },
          {
            id: "ctx-3",
            file_path: "src/pages/chat/ChatPage.tsx",
            relevance_score: 0.65,
            reason: "Main page layout",
            token_cost: 900,
            accepted: false,
          },
        ],
        total_token_cost: 5100,
        budget_tokens: 8000,
        status: "ready" as const,
      };
      postServerEvent({
        t: "SET_AUTO_CONTEXT",
        turn_id: "turn_1" as TurnId,
        state: ctx.sotaState.autoContext,
      });
    }, 1500);
  });

  registry.set("ACCEPT_CONTEXT_SUGGESTION", (msg, ctx) => {
    if (ctx.sotaState.autoContext) {
      ctx.sotaState.autoContext = {
        ...ctx.sotaState.autoContext,
        suggestions: ctx.sotaState.autoContext.suggestions.map((s) =>
          s.id === msg.suggestion_id ? { ...s, accepted: true } : s,
        ),
      };
      postServerEvent({
        t: "SET_AUTO_CONTEXT",
        turn_id: "turn_1" as TurnId,
        state: ctx.sotaState.autoContext,
      });
    }
  });

  registry.set("REJECT_CONTEXT_SUGGESTION", (msg, ctx) => {
    if (ctx.sotaState.autoContext) {
      ctx.sotaState.autoContext = {
        ...ctx.sotaState.autoContext,
        suggestions: ctx.sotaState.autoContext.suggestions.map((s) =>
          s.id === msg.suggestion_id ? { ...s, accepted: false } : s,
        ),
      };
      postServerEvent({
        t: "SET_AUTO_CONTEXT",
        turn_id: "turn_1" as TurnId,
        state: ctx.sotaState.autoContext,
      });
    }
  });

  // ── SOTA: Speculative Edits ─────────────────────────────────

  registry.set("REQUEST_SPECULATIVE_EDIT", (_msg, ctx) => {
    postServerEvent({
      t: "SET_SPECULATIVE_EDITS",
      turn_id: "turn_1" as TurnId,
      state: { edits: [], status: "predicting" },
    });
    setTimeout(() => {
      ctx.sotaState.specEdits = {
        edits: [
          {
            id: "spec-1",
            file_path: "src/utils/helpers.ts",
            original_text: "function getData() {",
            proposed_text: "async function getData(): Promise<Data> {",
            line_start: 12,
            line_end: 12,
            confidence: 0.88,
            risk_level: "safe" as const,
            status: "pending" as const,
          },
          {
            id: "spec-2",
            file_path: "src/app/config.ts",
            original_text: "const timeout = 5000;",
            proposed_text: "const timeout = 10_000;",
            line_start: 7,
            line_end: 7,
            confidence: 0.72,
            risk_level: "moderate" as const,
            status: "pending" as const,
          },
        ],
        status: "ready" as const,
        model_id: "claude-sonnet-4-6",
      };
      postServerEvent({
        t: "SET_SPECULATIVE_EDITS",
        turn_id: "turn_1" as TurnId,
        state: ctx.sotaState.specEdits,
      });
    }, 2000);
  });

  registry.set("ACCEPT_SPECULATIVE_EDIT", (msg, ctx) => {
    if (ctx.sotaState.specEdits) {
      ctx.sotaState.specEdits = {
        ...ctx.sotaState.specEdits,
        edits: ctx.sotaState.specEdits.edits.map((e) =>
          e.id === msg.edit_id ? { ...e, status: "accepted" as const } : e,
        ),
      };
      postServerEvent({
        t: "SET_SPECULATIVE_EDITS",
        turn_id: "turn_1" as TurnId,
        state: ctx.sotaState.specEdits,
      });
    }
  });

  registry.set("REJECT_SPECULATIVE_EDIT", (msg, ctx) => {
    if (ctx.sotaState.specEdits) {
      ctx.sotaState.specEdits = {
        ...ctx.sotaState.specEdits,
        edits: ctx.sotaState.specEdits.edits.map((e) =>
          e.id === msg.edit_id ? { ...e, status: "rejected" as const } : e,
        ),
      };
      postServerEvent({
        t: "SET_SPECULATIVE_EDITS",
        turn_id: "turn_1" as TurnId,
        state: ctx.sotaState.specEdits,
      });
    }
  });

  // ── SOTA: Background Agent ──────────────────────────────────

  registry.set("LAUNCH_BACKGROUND_JOB", (msg) => {
    const jobId = nextId("job");
    postServerEvent({
      t: "UPSERT_BACKGROUND_JOB",
      job: {
        id: jobId,
        label: msg.label,
        phase: "initializing",
        progress: 0,
        agent_model: "claude-sonnet-4-6",
        created_at_ms: Date.now(),
        steps_completed: 0,
        steps_total: 5,
        files_changed: 0,
        cloud: msg.cloud,
      },
    });
    setTimeout(() => {
      postServerEvent({
        t: "UPSERT_BACKGROUND_JOB",
        job: {
          id: jobId,
          label: msg.label,
          phase: "running",
          progress: 40,
          agent_model: "claude-sonnet-4-6",
          created_at_ms: Date.now(),
          current_step: "Analyzing codebase...",
          steps_completed: 2,
          steps_total: 5,
          files_changed: 3,
          cloud: msg.cloud,
        },
      });
    }, 2000);
    setTimeout(() => {
      postServerEvent({
        t: "UPSERT_BACKGROUND_JOB",
        job: {
          id: jobId,
          label: msg.label,
          phase: "done",
          progress: 100,
          agent_model: "claude-sonnet-4-6",
          created_at_ms: Date.now() - 5000,
          completed_at_ms: Date.now(),
          steps_completed: 5,
          steps_total: 5,
          files_changed: 7,
          cloud: msg.cloud,
          result_summary: "Completed successfully. Modified 7 files across 3 modules.",
        },
      });
    }, 5000);
  });

  registry.set("CANCEL_BACKGROUND_JOB", (msg) => {
    postServerEvent({ t: "REMOVE_BACKGROUND_JOB", id: msg.job_id });
  });

  // ── SOTA: Action Replay ─────────────────────────────────────

  registry.set("START_REPLAY", (msg, ctx) => {
    const session: ReplaySession = {
      steps: [
        {
          id: "rs-1",
          index: 0,
          type: "user_input",
          summary: "User prompt",
          input_snapshot: "Fix the bug",
          files_affected: [],
          timestamp_ms: Date.now() - 30000,
          duration_ms: 0,
          can_branch: false,
        },
        {
          id: "rs-2",
          index: 1,
          type: "model_response",
          summary: "Analyzing codebase",
          files_affected: [],
          timestamp_ms: Date.now() - 28000,
          duration_ms: 2000,
          can_branch: true,
        },
        {
          id: "rs-3",
          index: 2,
          type: "tool_call",
          summary: "Read src/utils.ts",
          files_affected: ["src/utils.ts"],
          timestamp_ms: Date.now() - 25000,
          duration_ms: 500,
          can_branch: true,
        },
        {
          id: "rs-4",
          index: 3,
          type: "tool_call",
          summary: "Edit src/utils.ts",
          files_affected: ["src/utils.ts"],
          timestamp_ms: Date.now() - 22000,
          duration_ms: 1000,
          can_branch: true,
        },
        {
          id: "rs-5",
          index: 4,
          type: "checkpoint",
          summary: "Checkpoint created",
          files_affected: ["src/utils.ts"],
          timestamp_ms: Date.now() - 20000,
          duration_ms: 200,
          can_branch: true,
        },
      ],
      current_index: 0,
      total_steps: 5,
      source_turn_id: msg.turn_id,
      status: "paused",
      playback_speed: 1,
    };
    ctx.sotaState.replay = session;
    postServerEvent({ t: "SET_REPLAY_SESSION", session });
  });

  registry.set("REPLAY_STEP", (msg, ctx) => {
    const cur = ctx.sotaState.replay;
    if (!cur || cur.steps.length === 0) return;
    const delta = msg.direction === "forward" ? 1 : -1;
    const nextIdx = Math.max(0, Math.min(cur.current_index + delta, cur.total_steps - 1));
    ctx.sotaState.replay = { ...cur, current_index: nextIdx, status: "paused" as const };
    postServerEvent({ t: "SET_REPLAY_SESSION", session: ctx.sotaState.replay });
  });

  registry.set("REPLAY_BRANCH", (msg, ctx) => {
    const cur = ctx.sotaState.replay;
    if (!cur || msg.step_index < 0 || msg.step_index >= cur.total_steps) return;
    ctx.sotaState.replay = { ...cur, current_index: msg.step_index, status: "branching" as const };
    postServerEvent({ t: "SET_REPLAY_SESSION", session: ctx.sotaState.replay });
  });

  registry.set("STOP_REPLAY", (_msg, ctx) => {
    ctx.sotaState.replay = null;
    postServerEvent({
      t: "SET_REPLAY_SESSION",
      session: {
        steps: [],
        current_index: 0,
        total_steps: 0,
        source_turn_id: "",
        status: "idle",
        playback_speed: 1,
      },
    });
  });

  // ── HITL: User Input ────────────────────────────────────────

  registry.set("RESPOND_USER_INPUT", (msg) => {
    postServerEvent({
      t: "UPDATE_USER_INPUT",
      id: msg.request_id,
      status: "answered",
      answer: msg.answer,
    });
  });

  registry.set("SKIP_USER_INPUT", (msg) => {
    postServerEvent({
      t: "UPDATE_USER_INPUT",
      id: msg.request_id,
      status: "cancelled",
    });
  });

  // ── SOTA: Multi-Agent Debate ────────────────────────────────

  registry.set("START_DEBATE", (msg) => {
    postServerEvent({
      t: "SET_DEBATE_SESSION",
      turn_id: "turn_1" as TurnId,
      session: {
        id: nextId("debate"),
        prompt: msg.prompt,
        agents: msg.model_ids.map((modelId: string, i: number) => ({
          id: `agent-${i}`,
          model_id: modelId,
          label: `Agent ${i + 1} (${modelId})`,
          status: "working" as const,
          confidence: 0,
          files_changed: 0,
          tokens_used: 0,
          duration_ms: 0,
        })),
        status: "running",
        created_at_ms: Date.now(),
      },
    });
    setTimeout(() => {
      postServerEvent({
        t: "SET_DEBATE_SESSION",
        turn_id: "turn_1" as TurnId,
        session: {
          id: "debate-final",
          prompt: msg.prompt,
          agents: msg.model_ids.map((modelId: string, i: number) => ({
            id: `agent-${i}`,
            model_id: modelId,
            label: `Agent ${i + 1} (${modelId})`,
            status: "done" as const,
            approach_summary:
              i === 0
                ? "Refactored with composition pattern"
                : "Applied inheritance-based approach",
            confidence: i === 0 ? 0.87 : 0.72,
            files_changed: i === 0 ? 4 : 6,
            tokens_used: i === 0 ? 12400 : 15800,
            duration_ms: i === 0 ? 8000 : 11000,
          })),
          status: "decided",
          consensus: {
            winner_id: "agent-0",
            method: "auto_judge",
            scores: msg.model_ids.map((_: string, i: number) => ({
              agent_id: `agent-${i}`,
              score: i === 0 ? 8.5 : 7.2,
              reasoning:
                i === 0
                  ? "Cleaner design, fewer changes"
                  : "More comprehensive but higher complexity",
            })),
            merged: false,
          },
          created_at_ms: Date.now() - 12000,
        },
      });
    }, 4000);
  });

  const debateAckHandler: Handler = (msg) => {
    // eslint-disable-next-line no-console
    console.log(`[mockBackend] ack: ${msg.type}`);
  };
  registry.set("DEBATE_PICK_WINNER", debateAckHandler);
  registry.set("DEBATE_MERGE", debateAckHandler);

  // ── Noop handlers (IDE-only / no response needed) ───────────

  const noopHandler: Handler = (msg) => {
    // eslint-disable-next-line no-console
    console.log(`[mockBackend] ack: ${msg.type}`);
  };
  for (const type of [
    "OPEN_FILE",
    "OPEN_FILE_AT_LINE",
    "NAVIGATE_TO_SOURCE",
    "OPEN_SETTINGS",
    "SHOW_HELP",
    "SHOW_CONTEXT",
    "COPY_CONVERSATION",
    "UNDO",
    "REDO",
    "APPROVE_ALL",
    "PASTE_IMAGE",
    "OPEN_SUB_PANEL",
    "APPLY_CODE_BLOCK",
    "INSERT_CODE_BLOCK",
    "PREFETCH_SESSION",
    "OPEN_PREVIEW_EXTERNAL",
    "REFRESH_PREVIEW",
  ]) {
    registry.set(type, noopHandler);
  }
}
