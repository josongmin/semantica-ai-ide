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

export async function runPlanWorkflow(text: string, turnId: TurnId, userMsgId: MessageId, ctx: HandlerContext, persona: AgentPersona, signal: AbortSignal) {
  emitTurnStart(text, turnId, userMsgId, ctx, persona);
  await abortableSleep(300, signal);

  await emitThinking(turnId, `${persona.name} here. Designing a comprehensive strategy with clear milestones and risk assessment...`, "Creating plan...", signal, 800);

  // Architect state
  postServerEvent({
    t: "SET_ARCHITECT_STATE",
    state: { active_role: "planner", model_name: "claude-opus-4-6", task_description: "Strategic planning for modular implementation" },
  });

  // Gantt chart of planning phases
  const planBaseMs = Date.now();
  postServerEvent({
    t: "SET_GANTT_ENTRIES",
    entries: [
      { id: "pg1", tool_name: "audit_scan", start_ms: planBaseMs, end_ms: planBaseMs + 5000, status: "success", tool_type: "search" },
      { id: "pg2", tool_name: "design_modules", start_ms: planBaseMs + 2000, end_ms: planBaseMs + 8000, status: "success", tool_type: "other" },
      { id: "pg3", tool_name: "implement_core", start_ms: planBaseMs + 8000, end_ms: planBaseMs + 20000, status: "running", tool_type: "write" },
      { id: "pg4", tool_name: "migrate_deps", start_ms: planBaseMs + 20000, end_ms: planBaseMs + 30000, status: "running", tool_type: "write" },
    ],
  });

  // Strategy state
  postServerEvent({
    t: "SET_STRATEGY_STATE",
    turn_id: turnId,
    state: {
      mode: "DEEP", strategy: "BEAM",
      budget: { time_budget_ms: 60000, solver_budget: 5, max_candidates: 8, max_depth: 4 },
      hypothesis_graph: [
        { id: "h1", hypothesis: "Modular approach with incremental delivery", confidence: 0.85, status: "confirmed", evidence_ids: [] },
        { id: "h2", hypothesis: "Big-bang rewrite for clean architecture", confidence: 0.45, status: "refuted", evidence_ids: [] },
      ],
      search_depth: 3, candidates_evaluated: 8, candidates_pruned: 5, current_best_score: 0.85,
    },
  });

  // Plan checklist
  postServerEvent({ t: "UPSERT_PLAN_CHECKLIST", turn_id: turnId, items: [
    { id: "plan-1", label: "Phase 1: Audit existing code and identify dependencies", status: "completed" },
    { id: "plan-2", label: "Phase 2: Design new module boundaries", status: "completed" },
    { id: "plan-3", label: "Phase 3: Implement core changes with tests", status: "in_progress" },
    { id: "plan-4", label: "Phase 4: Migration of dependent modules", status: "pending" },
    { id: "plan-5", label: "Phase 5: Integration testing and deployment", status: "pending" },
  ] });

  // Update plan items in real-time
  await abortableSleep(300, signal);
  postServerEvent({ t: "UPDATE_PLAN_ITEM", turn_id: turnId, item_id: "plan-3", status: "completed" });
  postServerEvent({ t: "UPDATE_PLAN_ITEM", turn_id: turnId, item_id: "plan-4", status: "in_progress" });

  // Switch architect role to coder for implementation
  postServerEvent({
    t: "SET_ARCHITECT_STATE",
    state: { active_role: "coder", model_name: "claude-sonnet-4-6", task_description: "Implementing Phase 3 core changes" },
  });

  // Evidence bundle
  postServerEvent({
    t: "SET_EVIDENCE_BUNDLE",
    turn_id: turnId,
    bundle: {
      bundle_id: nextId("eb"), replay_key: `replay-${turnId}`, snapshot_hash: `snap-${Date.now()}`,
      env_digest: "sha256:mock-env", policy_digest: "sha256:policy-v1", ssot_digest: "sha256:ssot-v1",
      patch_digest: `sha256:plan-${turnId}`, runner_meta_digest: "sha256:runner-v1",
      gate_passed: true, created_at_ms: Date.now(), decision_trace: [], proof_refs: [],
    },
  });

  await emitSummary(
    turnId,
    `## Strategic Plan\n\n### 5-Phase Implementation Plan\n\n| Phase | Description | Status | Risk |\n|:-----:|-------------|:------:|:----:|\n| 1 | Audit existing code | [PASS] Done | Low |\n| 2 | Design module boundaries | [PASS] Done | Low |\n| 3 | Implement core changes |  Active | Medium |\n| 4 | Migrate dependent modules | ⬜ Pending | Medium |\n| 5 | Integration test + deploy | ⬜ Pending | High |\n\n### Strategy: Modular Incremental (BEAM search)\n- **8 approaches evaluated**, 5 pruned\n- **Best candidate:** Modular approach (85% confidence)\n- **Rejected:** Big-bang rewrite (too risky, 45% confidence)\n\n### Key Decisions\n1. Incremental over big-bang → lower risk, reversible\n2. New module boundaries align with team ownership\n3. Phase 3 is the critical path — all changes are additive\n\nShall I proceed with Phase 3?`,
    signal, 2000,
  );

  postServerEvents([
    { t: "PUSH_PROMPT_SUGGESTION", suggestion: { id: nextId("sug"), text: "Proceed with Phase 3", confidence: 0.9 } },
    { t: "PUSH_PROMPT_SUGGESTION", suggestion: { id: nextId("sug"), text: "Show me the dependency graph", confidence: 0.7 } },
  ]);

  finalizeTurn(turnId, ctx);
}
