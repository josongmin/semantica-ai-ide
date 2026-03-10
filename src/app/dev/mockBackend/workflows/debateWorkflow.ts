import type { AgentInstanceId, TurnId as TurnIdType } from "../../../../shared/protocol";
import {
  abortableSleep,
  type AgentPersona,
  emitSummary,
  emitThinking,
  emitTurnStart,
  finalizeTurn,
  type HandlerContext,
  type MessageId,
  nextId,
  postServerEvent,
  postServerEvents,
  type TurnId,
} from "./types";

export async function runDebateWorkflow(text: string, turnId: TurnId, userMsgId: MessageId, ctx: HandlerContext, persona: AgentPersona, signal: AbortSignal) {
  emitTurnStart(text, turnId, userMsgId, ctx, persona);
  await abortableSleep(300, signal);

  await emitThinking(turnId, `${persona.name} here. Setting up a fair multi-agent debate. Both sides will present their arguments...`, "Preparing debate...", signal, 600);

  // Three model state
  postServerEvent({
    t: "SET_THREE_MODEL_STATE",
    state: {
      planner: { model: "claude-opus-4-6", status: "active", output: "Evaluating both approaches for testability, complexity, and maintainability..." },
      coder: { model: "claude-sonnet-4-6", status: "idle", output: "" },
      critic: { model: "claude-haiku-4-5", status: "idle", output: "" },
    },
  });

  // Mission control agents
  const agentAlphaId = nextId("agent") as AgentInstanceId;
  const agentBetaId = nextId("agent") as AgentInstanceId;
  postServerEvent({
    t: "SET_MISSION_CONTROL_AGENTS",
    agents: [
      { id: agentAlphaId, name: "Agent Alpha", status: "running", current_task: "Implementing composition approach", progress_pct: 0, risk_level: "safe" },
      { id: agentBetaId, name: "Agent Beta", status: "running", current_task: "Implementing inheritance approach", progress_pct: 0, risk_level: "moderate" },
    ],
  });

  // Model routing decisions
  postServerEvent({
    t: "SET_MODEL_ROUTES",
    routes: [
      { task_type: "planning", model: "claude-opus-4-6", reason: "Complex architectural decisions require highest capability", timestamp_ms: Date.now() },
      { task_type: "implementation", model: "claude-sonnet-4-6", reason: "Balanced speed and quality for code generation", timestamp_ms: Date.now() },
      { task_type: "judging", model: "claude-opus-4-6", reason: "Fair evaluation requires deep reasoning", timestamp_ms: Date.now() },
    ],
  });

  // Boomerang tasks delegated to agents
  postServerEvent({
    t: "SET_BOOMERANG_TASKS",
    tasks: [
      { id: "boom-1", parent_turn_id: turnId, label: "Implement composition approach", status: "running", agent_id: agentAlphaId as string },
      { id: "boom-2", parent_turn_id: turnId, label: "Implement inheritance approach", status: "running", agent_id: agentBetaId as string },
      { id: "boom-3", parent_turn_id: turnId, label: "Judge and compare results", status: "pending" },
    ],
  });

  // Debate setup
  const debateId = nextId("debate");
  postServerEvent({
    t: "SET_DEBATE_SESSION", turn_id: "turn_1" as TurnIdType,
    session: {
      id: debateId, prompt: text,
      agents: [
        { id: "agent-0", model_id: "claude-opus-4-6", label: "Agent Alpha (Opus)", status: "working", confidence: 0, files_changed: 0, tokens_used: 0, duration_ms: 0 },
        { id: "agent-1", model_id: "claude-sonnet-4-6", label: "Agent Beta (Sonnet)", status: "working", confidence: 0, files_changed: 0, tokens_used: 0, duration_ms: 0 },
      ],
      status: "running", created_at_ms: Date.now(),
    },
  });
  await abortableSleep(1500, signal);

  // Agent Alpha finishes
  postServerEvent({
    t: "SET_DEBATE_SESSION", turn_id: "turn_1" as TurnIdType,
    session: {
      id: debateId, prompt: text,
      agents: [
        { id: "agent-0", model_id: "claude-opus-4-6", label: "Agent Alpha (Opus)", status: "done", approach_summary: "Composition-based approach: Extract shared behavior into composable utilities. Favors flexibility and testability.", confidence: 0.87, files_changed: 4, tokens_used: 12400, duration_ms: 8000 },
        { id: "agent-1", model_id: "claude-sonnet-4-6", label: "Agent Beta (Sonnet)", status: "working", confidence: 0, files_changed: 0, tokens_used: 0, duration_ms: 0 },
      ],
      status: "running", created_at_ms: Date.now() - 1500,
    },
  });
  await abortableSleep(1000, signal);

  // Agent Beta finishes
  postServerEvent({
    t: "SET_DEBATE_SESSION", turn_id: "turn_1" as TurnIdType,
    session: {
      id: debateId, prompt: text,
      agents: [
        { id: "agent-0", model_id: "claude-opus-4-6", label: "Agent Alpha (Opus)", status: "done", approach_summary: "Composition-based approach: Extract shared behavior into composable utilities. Favors flexibility and testability.", confidence: 0.87, files_changed: 4, tokens_used: 12400, duration_ms: 8000 },
        { id: "agent-1", model_id: "claude-sonnet-4-6", label: "Agent Beta (Sonnet)", status: "done", approach_summary: "Inheritance-based approach: Create abstract base class with template method pattern. Favors code reuse and consistency.", confidence: 0.72, files_changed: 6, tokens_used: 15800, duration_ms: 11000 },
      ],
      status: "judging", created_at_ms: Date.now() - 2500,
    },
  });
  await abortableSleep(1000, signal);

  // Verdict
  postServerEvent({
    t: "SET_DEBATE_SESSION", turn_id: "turn_1" as TurnIdType,
    session: {
      id: debateId, prompt: text,
      agents: [
        { id: "agent-0", model_id: "claude-opus-4-6", label: "Agent Alpha (Opus)", status: "done", approach_summary: "Composition-based approach: Extract shared behavior into composable utilities. Favors flexibility and testability.", confidence: 0.87, files_changed: 4, tokens_used: 12400, duration_ms: 8000 },
        { id: "agent-1", model_id: "claude-sonnet-4-6", label: "Agent Beta (Sonnet)", status: "done", approach_summary: "Inheritance-based approach: Create abstract base class with template method pattern. Favors code reuse and consistency.", confidence: 0.72, files_changed: 6, tokens_used: 15800, duration_ms: 11000 },
      ],
      status: "decided",
      consensus: {
        winner_id: "agent-0",
        method: "auto_judge",
        scores: [
          { agent_id: "agent-0", score: 8.5, reasoning: "Cleaner design, fewer file changes, better testability. Composition aligns with React patterns." },
          { agent_id: "agent-1", score: 7.2, reasoning: "Solid approach but higher complexity and more files touched. Inheritance is less idiomatic in React." },
        ],
        merged: false,
      },
      created_at_ms: Date.now() - 3500,
    },
  });

  // Agent messages exchanged during debate
  postServerEvent({
    t: "SET_AGENT_MESSAGES",
    messages: [
      { id: nextId("amsg"), from_agent: "Alpha", to_agent: "Moderator", content: "Composition approach complete. 4 files changed with full test coverage.", timestamp_ms: Date.now() - 2000, message_type: "response" },
      { id: nextId("amsg"), from_agent: "Beta", to_agent: "Moderator", content: "Inheritance approach complete. Created abstract base with 2 concrete implementations.", timestamp_ms: Date.now() - 1500, message_type: "response" },
      { id: nextId("amsg"), from_agent: "Moderator", to_agent: "Alpha", content: "Scores tallied. Composition wins on simplicity and React idiom alignment.", timestamp_ms: Date.now() - 500, message_type: "broadcast" },
    ],
  });

  // Update boomerang tasks to completed
  postServerEvent({
    t: "SET_BOOMERANG_TASKS",
    tasks: [
      { id: "boom-1", parent_turn_id: turnId, label: "Implement composition approach", status: "success", agent_id: agentAlphaId as string, result_summary: "4 files, 12.4k tokens" },
      { id: "boom-2", parent_turn_id: turnId, label: "Implement inheritance approach", status: "success", agent_id: agentBetaId as string, result_summary: "6 files, 15.8k tokens" },
      { id: "boom-3", parent_turn_id: turnId, label: "Judge and compare results", status: "success", result_summary: "Alpha wins 8.5 vs 7.2" },
    ],
  });

  // Remove losing agent instance
  postServerEvent({ t: "REMOVE_AGENT_INSTANCE", id: agentBetaId });

  await emitSummary(
    turnId,
    `## Debate Result\n\n### 🏆 Winner: Agent Alpha (Composition)\n**Score: 8.5 vs 7.2**\n\n| Criteria | Alpha (Composition) | Beta (Inheritance) |\n|----------|:---:|:---:|\n| Design | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |\n| Files Changed | 4 | 6 |\n| Complexity | Low | Medium |\n| Testability | High | Medium |\n\n**Judge's Reasoning:** Alpha's composition approach is cleaner, touches fewer files, and aligns better with React's functional paradigm. Beta's inheritance approach is valid but adds unnecessary complexity for this use case.\n\nWould you like to apply Alpha's changes or explore a merged approach?`,
    signal, 1800,
  );

  postServerEvents([
    { t: "PUSH_PROMPT_SUGGESTION", suggestion: { id: nextId("sug"), text: "Apply Agent Alpha's changes", confidence: 0.9 } },
    { t: "PUSH_PROMPT_SUGGESTION", suggestion: { id: nextId("sug"), text: "Merge both approaches", confidence: 0.6 } },
  ]);

  finalizeTurn(turnId, ctx);
}
