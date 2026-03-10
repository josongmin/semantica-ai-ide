import type {
  DecisionTraceEntry,
  TurnId,
} from "../../../shared/protocol";
import { postServerEvent, sleep, STAGE_DELAY } from "../devUtils";

/** Reset pipeline state for a specific turn to widget-invisible defaults */
export function simReset(turnId: TurnId) {
  postServerEvent({ t: "SET_INPUT_GATE_RESULT", turn_id: turnId, result: { intent_type: "unknown", risk_level: "safe", change_size: "small", uncertainty: "low", context_signals: { has_repro: false, has_logs: false, has_patch_hints: false, pii_detected: false, security_sensitive: false } } });
  postServerEvent({ t: "SET_FAIL_CLOSED_CONSTRAINTS", turn_id: turnId, constraints: { allowed_actions: [], required_gates: [], tool_allowlist: [], max_side_effects: 0, policy_version_digest: "", ssot_digest: "" } });
  postServerEvent({ t: "SET_STRATEGY_STATE", turn_id: turnId, state: { mode: "FAST", strategy: "GREEDY", budget: { time_budget_ms: 0, solver_budget: 0, max_candidates: 0, max_depth: 0 }, hypothesis_graph: [], search_depth: 0, candidates_evaluated: 0, candidates_pruned: 0, current_best_score: 0 } });
  postServerEvent({ t: "SET_VALIDATION_STATE", turn_id: turnId, state: { policy_check: "pending", invariants: [], risk_witnesses: [], equivalences: [], counter_examples: [], qapi_results: [], test_subset: [], runner_status: "idle", evidence_schema_valid: false } });
  postServerEvent({ t: "SET_EVIDENCE_BUNDLE", turn_id: turnId, bundle: { bundle_id: "", replay_key: "", snapshot_hash: "", env_digest: "", policy_digest: "", ssot_digest: "", patch_digest: "", runner_meta_digest: "", gate_passed: false, created_at_ms: 0, decision_trace: [], proof_refs: [] } });
  postServerEvent({ t: "SET_EXPLAINABLE_VERDICT", turn_id: turnId, verdict: { chosen_action: "", confidence: 0, reasons_for: [], reasons_against: [], alternatives_rejected: [] } });
  postServerEvent({ t: "SET_RISK_HEATMAP", turn_id: turnId, entries: [] });
  postServerEvent({ t: "SET_SIDE_EFFECT_BUDGET", turn_id: turnId, budget: { max_side_effects: 0, used_side_effects: 0, allowed_actions: [], blocked_actions: [], budget_status: "ok" } });
  postServerEvent({ t: "SET_DRIFT_GUARD_STATE", turn_id: turnId, state: { alerts: [], policy_version: "", ssot_version: "", last_check_ms: 0, gate_pass_rate: 1.0 } });
  // eslint-disable-next-line no-console
  console.log("[sim] Pipeline state reset for turn", turnId);
}

/** Fire a single pipeline stage ServerEvent */
export function simStep(stage: "input_gate" | "fail_closed" | "strategy" | "validation" | "evidence" | "verdict" | "risk_heatmap" | "side_effect" | "drift_guard", variant: "pass" | "fail" = "pass", turnId: TurnId = "turn_console" as TurnId) {
  const now = Date.now();
  const stageMap: Record<string, () => void> = {
    input_gate: () => postServerEvent({
      t: "SET_INPUT_GATE_RESULT",
      turn_id: turnId,
      result: {
        intent_type: variant === "pass" ? "bug_fix" : "refactor",
        risk_level: variant === "pass" ? "moderate" : "dangerous",
        change_size: variant === "pass" ? "small" : "large",
        uncertainty: variant === "pass" ? "low" : "high",
        context_signals: { has_repro: variant === "pass", has_logs: true, has_patch_hints: false, pii_detected: variant === "fail", security_sensitive: variant === "fail" },
      },
    }),
    fail_closed: () => postServerEvent({
      t: "SET_FAIL_CLOSED_CONSTRAINTS",
      turn_id: turnId,
      constraints: {
        allowed_actions: variant === "pass" ? ["read_file", "write_file", "run_test"] : ["read_file"],
        required_gates: ["invariant_check", "test_pass"],
        tool_allowlist: variant === "pass" ? ["read_file", "write_file", "bash"] : ["read_file"],
        max_side_effects: variant === "pass" ? 5 : 1,
        policy_version_digest: "pol_sha256_sim_001",
        ssot_digest: "ssot_sha256_sim_001",
      },
    }),
    strategy: () => postServerEvent({
      t: "SET_STRATEGY_STATE",
      turn_id: turnId,
      state: {
        mode: variant === "pass" ? "DEEP" : "FAST",
        strategy: variant === "pass" ? "BEAM" : "GREEDY",
        budget: { time_budget_ms: variant === "pass" ? 60000 : 5000, solver_budget: variant === "pass" ? 3 : 1, max_candidates: variant === "pass" ? 8 : 2, max_depth: variant === "pass" ? 4 : 1 },
        hypothesis_graph: [
          { id: "h_sim_1", hypothesis: variant === "pass" ? "Root cause identified in null check" : "Unclear — no matching pattern", status: variant === "pass" ? "confirmed" : "open", confidence: variant === "pass" ? 0.91 : 0.25, evidence_ids: variant === "pass" ? ["ev_sim_1"] : [] },
        ],
        search_depth: variant === "pass" ? 3 : 0,
        candidates_evaluated: variant === "pass" ? 4 : 1,
        candidates_pruned: variant === "pass" ? 1 : 0,
        current_best_score: variant === "pass" ? 0.91 : 0.25,
      },
    }),
    validation: () => postServerEvent({
      t: "SET_VALIDATION_STATE",
      turn_id: turnId,
      state: {
        policy_check: variant === "pass" ? "pass" : "fail",
        invariants: [
          { id: "inv_sim_1", invariant: "Null safety check", status: variant === "pass" ? "pass" : "fail", witness: variant === "fail" ? "Missing null guard" : undefined },
          { id: "inv_sim_2", invariant: "Error chain integrity", status: "pass" },
        ],
        risk_witnesses: variant === "fail" ? [
          { id: "rw_sim_1", risk_type: "null_deref", severity: "dangerous", description: "Unguarded access", file_path: "src/handlers/main.ts", line: 15 },
        ] : [],
        equivalences: variant === "pass" ? [
          { id: "eq_sim_1", original_hash: "orig_001", modified_hash: "mod_001", equivalent: true, witness: "All outputs match" },
        ] : [],
        counter_examples: variant === "fail" ? [
          { id: "ce_sim_1", description: "Empty input causes crash", min_repro: "fn(null)", patterns: ["null_input"], source: "test_failure" as const },
        ] : [],
        qapi_results: [
          { query_id: "q_sim_1", query_type: "relation_slice", status: "resolved", answer: "A → B → C" },
          { query_id: "q_sim_2", query_type: "risk_witness", status: variant === "pass" ? "resolved" : "pending", answer: variant === "pass" ? "No critical risk" : undefined },
        ],
        test_subset: ["main.test.ts", "handler.test.ts"],
        runner_status: variant === "pass" ? "pass" : "fail",
        runner_summary: variant === "pass" ? "12 passed (1.2s)" : "10 passed, 2 failed (1.8s)",
        evidence_schema_valid: variant === "pass",
      },
    }),
    evidence: () => postServerEvent({
      t: "SET_EVIDENCE_BUNDLE",
      turn_id: turnId,
      bundle: {
        bundle_id: `bndl_sim_${now}`,
        replay_key: `rk_sim_${now}`,
        snapshot_hash: "snap_sim_001",
        env_digest: "env_sim_001",
        policy_digest: "pol_sha256_sim_001",
        ssot_digest: "ssot_sha256_sim_001",
        patch_digest: "patch_sim_001",
        runner_meta_digest: "rm_sim_001",
        gate_passed: variant === "pass",
        created_at_ms: now,
        decision_trace: [
          { id: "dt_sim_1", timestamp_ms: now - 2000, stage: "S0", decision: "Intent classified", reason: "Pattern match", alternatives_considered: 3 },
          { id: "dt_sim_2", timestamp_ms: now - 1000, stage: "S4", decision: variant === "pass" ? "Candidate A selected" : "No viable candidate", reason: variant === "pass" ? "Best score" : "All below threshold", alternatives_considered: variant === "pass" ? 4 : 2 },
        ],
        proof_refs: variant === "pass" ? ["proof://test/all_pass", "proof://invariant/null_guard"] : [],
      },
    }),
    verdict: () => postServerEvent({
      t: "SET_EXPLAINABLE_VERDICT",
      turn_id: turnId,
      verdict: {
        chosen_action: variant === "pass" ? "Apply null guard patch" : "BLOCKED — insufficient evidence",
        confidence: variant === "pass" ? 0.91 : 0.15,
        reasons_for: variant === "pass" ? [
          { factor: "All tests pass", impact: "positive", weight: 0.4 },
          { factor: "Root cause confirmed", impact: "positive", weight: 0.35, evidence_ref: "rw_sim_1" },
        ] : [],
        reasons_against: variant === "fail" ? [
          { factor: "Policy check failed", impact: "negative", weight: 0.5 },
          { factor: "Counter-example found", impact: "negative", weight: 0.3 },
        ] : [
          { factor: "One invariant warning", impact: "neutral", weight: 0.05 },
        ],
        alternatives_rejected: [
          { action: "Full refactor", rejection_reason: "Exceeds change budget" },
        ],
      },
    }),
    risk_heatmap: () => postServerEvent({
      t: "SET_RISK_HEATMAP",
      turn_id: turnId,
      entries: variant === "pass" ? [
        { file_path: "src/handlers/main.ts", line_start: 10, line_end: 20, risk_level: "safe", risk_type: "validated", description: "Null guard added" },
        { file_path: "src/handlers/main.ts", line_start: 30, line_end: 45, risk_level: "moderate", risk_type: "complexity", description: "High cyclomatic complexity" },
      ] : [
        { file_path: "src/handlers/main.ts", line_start: 10, line_end: 20, risk_level: "dangerous", risk_type: "null_deref", description: "Unguarded null access" },
        { file_path: "src/handlers/main.ts", line_start: 50, line_end: 65, risk_level: "dangerous", risk_type: "injection", description: "Unsanitized input" },
      ],
    }),
    side_effect: () => postServerEvent({
      t: "SET_SIDE_EFFECT_BUDGET",
      turn_id: turnId,
      budget: {
        max_side_effects: 5,
        used_side_effects: variant === "pass" ? 2 : 5,
        allowed_actions: variant === "pass" ? ["write_file", "run_test"] : ["read_file"],
        blocked_actions: variant === "pass" ? ["deploy"] : ["write_file", "deploy", "git_push"],
        budget_status: variant === "pass" ? "ok" : "exceeded",
      },
    }),
    drift_guard: () => postServerEvent({
      t: "SET_DRIFT_GUARD_STATE",
      turn_id: turnId,
      state: {
        alerts: variant === "fail" ? [
          { id: "da_sim_1", type: "policy_drift", severity: "critical", description: "Policy v2.3 requires evidence bundle for all writes", previous_digest: "pol_v2.2", current_digest: "pol_v2.3", requires_evidence: true, timestamp_ms: now },
          { id: "da_sim_2", type: "ssot_drift", severity: "warning", description: "SSOT schema updated — re-validation needed", previous_digest: "ssot_v1.0", current_digest: "ssot_v1.1", requires_evidence: false, timestamp_ms: now },
        ] : [
          { id: "da_sim_1", type: "ssot_drift", severity: "info", description: "Minor schema update detected", previous_digest: "ssot_v1.0", current_digest: "ssot_v1.1", requires_evidence: false, timestamp_ms: now },
        ],
        policy_version: "v2.3",
        ssot_version: "v1.1",
        last_check_ms: now,
        gate_pass_rate: variant === "pass" ? 0.95 : 0.45,
      },
    }),
  };
  stageMap[stage]?.();
  // eslint-disable-next-line no-console
  console.log(`[sim] Stage "${stage}" fired (${variant})`);
}

export const PIPELINE_STAGES: Parameters<typeof simStep>[0][] = [
  "input_gate", "fail_closed", "strategy", "validation",
  "evidence", "verdict", "risk_heatmap", "side_effect", "drift_guard",
];

/** Bugfix scenario: stages fire sequentially showing a successful bug fix pipeline */
export async function simBugfix(turnId: TurnId = "turn_console" as TurnId) {
  // eslint-disable-next-line no-console
  console.log("[sim]  Starting bugfix scenario...");
  simReset(turnId);
  await sleep(300);

  const stages: Parameters<typeof simStep>[0][] = [
    "input_gate", "fail_closed", "strategy", "validation",
    "evidence", "verdict", "risk_heatmap", "side_effect", "drift_guard",
  ];

  for (const stage of stages) {
    simStep(stage, "pass", turnId);
    // eslint-disable-next-line no-console
    console.log(`[sim]   PASS ${stage}`);
    await sleep(STAGE_DELAY);
  }
  // eslint-disable-next-line no-console
  console.log("[sim]  Bugfix scenario complete — all stages PASS");
}

/** Feature scenario: shows a deeper search with more candidates and hypotheses */
export async function simFeature(turnId: TurnId = "turn_console" as TurnId) {
  // eslint-disable-next-line no-console
  console.log("[sim]  Starting feature scenario...");
  simReset(turnId);
  await sleep(300);

  // Stage 0: Input Gate — feature request
  postServerEvent({
    t: "SET_INPUT_GATE_RESULT",
    turn_id: turnId,
    result: {
      intent_type: "feature",
      risk_level: "moderate",
      change_size: "large",
      uncertainty: "medium",
      context_signals: { has_repro: false, has_logs: false, has_patch_hints: true, pii_detected: false, security_sensitive: false },
    },
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS input_gate (feature, large)");
  await sleep(STAGE_DELAY);

  // Stage 1: Fail-Closed — broader allowlist for feature work
  postServerEvent({
    t: "SET_FAIL_CLOSED_CONSTRAINTS",
    turn_id: turnId,
    constraints: {
      allowed_actions: ["read_file", "write_file", "run_test", "create_file", "search"],
      required_gates: ["invariant_check", "test_pass", "equivalence_check"],
      tool_allowlist: ["read_file", "write_file", "bash", "grep", "create_file"],
      max_side_effects: 10,
      policy_version_digest: "pol_sha256_feat_001",
      ssot_digest: "ssot_sha256_feat_001",
    },
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS fail_closed (10 side-effects allowed)");
  await sleep(STAGE_DELAY);

  // Stage 2: Strategy — MCTS for complex feature
  postServerEvent({
    t: "SET_STRATEGY_STATE",
      turn_id: turnId,
    state: {
      mode: "AGENT",
      strategy: "MCTS",
      budget: { time_budget_ms: 120000, solver_budget: 5, max_candidates: 15, max_depth: 6 },
      hypothesis_graph: [
        { id: "h_f1", hypothesis: "Use adapter pattern for new data source", status: "confirmed", confidence: 0.88, evidence_ids: ["ev_f1"] },
        { id: "h_f2", hypothesis: "Extend existing service with new methods", status: "open", confidence: 0.72, evidence_ids: [] },
        { id: "h_f3", hypothesis: "Create new module with separate DI", status: "open", confidence: 0.65, evidence_ids: [] },
        { id: "h_f4", hypothesis: "Monkeypatch existing code", status: "refuted", confidence: 0.05, evidence_ids: ["ev_f2"] },
      ],
      search_depth: 5,
      candidates_evaluated: 12,
      candidates_pruned: 7,
      current_best_score: 0.88,
    },
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS strategy (MCTS, 12 candidates, depth 5)");
  await sleep(STAGE_DELAY);

  // Progressively increase search depth
  for (let depth = 5; depth <= 6; depth++) {
    await sleep(400);
    postServerEvent({
      t: "SET_STRATEGY_STATE",
        turn_id: turnId,
      state: {
        mode: "AGENT",
        strategy: "MCTS",
        budget: { time_budget_ms: 120000, solver_budget: 5, max_candidates: 15, max_depth: 6 },
        hypothesis_graph: [
          { id: "h_f1", hypothesis: "Use adapter pattern for new data source", status: "confirmed", confidence: 0.92, evidence_ids: ["ev_f1", "ev_f3"] },
          { id: "h_f2", hypothesis: "Extend existing service with new methods", status: depth === 6 ? "refuted" : "open", confidence: depth === 6 ? 0.30 : 0.72, evidence_ids: depth === 6 ? ["ev_f4"] : [] },
          { id: "h_f3", hypothesis: "Create new module with separate DI", status: "open", confidence: 0.65, evidence_ids: [] },
          { id: "h_f4", hypothesis: "Monkeypatch existing code", status: "refuted", confidence: 0.05, evidence_ids: ["ev_f2"] },
        ],
        search_depth: depth,
        candidates_evaluated: 12 + (depth - 5) * 3,
        candidates_pruned: 7 + (depth - 5) * 2,
        current_best_score: 0.88 + (depth - 5) * 0.04,
      },
    });
  }
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS strategy refined (depth 6, score 0.92)");
  await sleep(STAGE_DELAY);

  // Stage 3: Validation
  simStep("validation", "pass", turnId);
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS validation (pass)");
  await sleep(STAGE_DELAY);

  // Stage 4: Evidence + Decision Trace
  const now = Date.now();
  const featureTrace: DecisionTraceEntry[] = [
    { id: "dt_f1", timestamp_ms: now - 8000, stage: "S0", decision: "Intent: feature (confidence 0.89)", reason: "New capability request with API hints", alternatives_considered: 4 },
    { id: "dt_f2", timestamp_ms: now - 6000, stage: "S1", decision: "Strategy: MCTS (depth 6)", reason: "Large change + moderate uncertainty → exhaustive search", alternatives_considered: 3 },
    { id: "dt_f3", timestamp_ms: now - 4000, stage: "S4", decision: "Adapter pattern selected (0.92)", reason: "Minimal coupling + all tests pass + clean interface", alternatives_considered: 15 },
    { id: "dt_f4", timestamp_ms: now - 2000, stage: "S5", decision: "Validation: PASS", reason: "All 28 tests pass, 3/3 invariants hold", alternatives_considered: 0 },
  ];
  for (const entry of featureTrace) {
    postServerEvent({ t: "PUSH_DECISION_TRACE", turn_id: turnId, entry });
  }
  postServerEvent({
    t: "SET_EVIDENCE_BUNDLE",
      turn_id: turnId,
    bundle: {
      bundle_id: `bndl_feat_${now}`,
      replay_key: `rk_feat_${now}`,
      snapshot_hash: "snap_feat_001",
      env_digest: "env_feat_001",
      policy_digest: "pol_sha256_feat_001",
      ssot_digest: "ssot_sha256_feat_001",
      patch_digest: "patch_feat_001",
      runner_meta_digest: "rm_feat_001",
      gate_passed: true,
      created_at_ms: now,
      decision_trace: featureTrace,
      proof_refs: ["proof://test/all_28_pass", "proof://invariant/adapter_clean"],
    },
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS evidence bundle sealed");
  await sleep(STAGE_DELAY);

  // Stage 5: Verdict
  postServerEvent({
    t: "SET_EXPLAINABLE_VERDICT",
      turn_id: turnId,
    verdict: {
      chosen_action: "Implement adapter pattern with new DataSourceAdapter interface",
      confidence: 0.92,
      reasons_for: [
        { factor: "All 28 tests pass", impact: "positive", weight: 0.35 },
        { factor: "Clean adapter interface minimizes coupling", impact: "positive", weight: 0.30 },
        { factor: "MCTS confirmed optimal across 15 candidates", impact: "positive", weight: 0.20 },
      ],
      reasons_against: [
        { factor: "Adds new abstraction layer (complexity)", impact: "neutral", weight: 0.08 },
      ],
      alternatives_rejected: [
        { action: "Extend existing service directly", rejection_reason: "High coupling, violates single responsibility" },
        { action: "Create separate module with DI", rejection_reason: "Over-engineered for current scope" },
        { action: "Monkeypatch existing code", rejection_reason: "Refuted — breaks 3 invariants" },
      ],
    },
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS verdict (confidence 0.92)");
  await sleep(STAGE_DELAY);

  // Stage 6: Risk heatmap + side effects + drift
  simStep("risk_heatmap", "pass", turnId);
  simStep("side_effect", "pass", turnId);
  simStep("drift_guard", "pass", turnId);
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS risk_heatmap + side_effect + drift_guard");
  // eslint-disable-next-line no-console
  console.log("[sim]  Feature scenario complete — adapter pattern selected");
}

/** Dangerous scenario: pipeline blocks execution due to critical risk + policy failure */
export async function simDangerous(turnId: TurnId = "turn_console" as TurnId) {
  // eslint-disable-next-line no-console
  console.log("[sim]  Starting dangerous/blocked scenario...");
  simReset(turnId);
  await sleep(300);

  // Stage 0: Input Gate — critical risk detected
  postServerEvent({
    t: "SET_INPUT_GATE_RESULT",
      turn_id: turnId,
    result: {
      intent_type: "refactor",
      risk_level: "dangerous",
      change_size: "large",
      uncertainty: "high",
      context_signals: { has_repro: false, has_logs: false, has_patch_hints: false, pii_detected: true, security_sensitive: true },
    },
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   [WARN] input_gate (DANGEROUS risk, PII detected)");
  await sleep(STAGE_DELAY);

  // Stage 1: Fail-Closed — heavily restricted
  postServerEvent({
    t: "SET_FAIL_CLOSED_CONSTRAINTS",
      turn_id: turnId,
    constraints: {
      allowed_actions: ["read_file"],
      required_gates: ["invariant_check", "test_pass", "risk_witness", "pii_scan", "security_review"],
      tool_allowlist: ["read_file"],
      max_side_effects: 0,
      policy_version_digest: "pol_sha256_danger_001",
      ssot_digest: "ssot_sha256_danger_001",
    },
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   [WARN] fail_closed (read-only, 0 side-effects)");
  await sleep(STAGE_DELAY);

  // Stage 2: Strategy — forced to FAST/GREEDY due to restrictions
  postServerEvent({
    t: "SET_STRATEGY_STATE",
      turn_id: turnId,
    state: {
      mode: "FAST",
      strategy: "GREEDY",
      budget: { time_budget_ms: 5000, solver_budget: 1, max_candidates: 2, max_depth: 1 },
      hypothesis_graph: [
        { id: "h_d1", hypothesis: "Large-scale DB schema migration", status: "open", confidence: 0.3, evidence_ids: [] },
        { id: "h_d2", hypothesis: "PII exposure in logging pipeline", status: "confirmed", confidence: 0.85, evidence_ids: ["ev_d1"] },
      ],
      search_depth: 1,
      candidates_evaluated: 2,
      candidates_pruned: 2,
      current_best_score: 0.3,
    },
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   [WARN] strategy (FAST/GREEDY, all candidates below threshold)");
  await sleep(STAGE_DELAY);

  // Stage 3: Validation — FAIL
  postServerEvent({
    t: "SET_VALIDATION_STATE",
      turn_id: turnId,
    state: {
      policy_check: "fail",
      invariants: [
        { id: "inv_d1", invariant: "No PII in logs", status: "fail", witness: "User email found in debug output" },
        { id: "inv_d2", invariant: "DB migration reversibility", status: "fail", witness: "DROP TABLE has no rollback" },
        { id: "inv_d3", invariant: "Test coverage ≥ 80%", status: "fail", witness: "Coverage: 42%" },
      ],
      risk_witnesses: [
        // eslint-disable-next-line no-template-curly-in-string -- intentional: mock code snippet with template literal syntax
        { id: "rw_d1", risk_type: "pii_leak", severity: "dangerous", description: "PII (email) exposed in error logs", file_path: "src/logging/logger.ts", line: 23, witness_data: "console.error(`Failed for user ${user.email}`)" },
        { id: "rw_d2", risk_type: "data_loss", severity: "dangerous", description: "Irreversible schema migration", file_path: "migrations/003_drop_legacy.sql", line: 1, witness_data: "DROP TABLE IF EXISTS legacy_users" },
      ],
      equivalences: [],
      counter_examples: [
        { id: "ce_d1", description: "Migration rollback impossible after execution", min_repro: "run migration → attempt rollback", patterns: ["irreversible", "data_loss"], source: "invariant_violation" as const },
        { id: "ce_d2", description: "PII visible in production logs", min_repro: "trigger error with real user", patterns: ["pii_leak", "gdpr_violation"], source: "symbolic" as const },
      ],
      qapi_results: [
        { query_id: "q_d1", query_type: "risk_witness", status: "resolved", answer: "2 critical risks found", witness_id: "rw_d1" },
        { query_id: "q_d2", query_type: "invariant_check", status: "resolved", answer: "0/3 invariants pass" },
      ],
      test_subset: ["logger.test.ts", "migration.test.ts"],
      runner_status: "fail",
      runner_summary: "5 passed, 8 failed (2.1s)",
      evidence_schema_valid: false,
    },
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   FAIL validation (FAIL — 0/3 invariants, 2 critical risks)");
  await sleep(STAGE_DELAY);

  // Stage 4: Evidence — gate NOT passed
  const now = Date.now();
  const dangerTrace: DecisionTraceEntry[] = [
    { id: "dt_d1", timestamp_ms: now - 3000, stage: "S0", decision: "Intent: refactor (critical risk)", reason: "PII + irreversible schema change", alternatives_considered: 2 },
    { id: "dt_d2", timestamp_ms: now - 2000, stage: "S1", decision: "Fail-closed: read-only mode", reason: "Critical risk → 0 side-effects budget", alternatives_considered: 0 },
    { id: "dt_d3", timestamp_ms: now - 1000, stage: "S5", decision: "BLOCKED — validation failed", reason: "0/3 invariants, 2 critical risks, evidence invalid", alternatives_considered: 0 },
  ];
  for (const entry of dangerTrace) {
    postServerEvent({ t: "PUSH_DECISION_TRACE", turn_id: turnId, entry });
  }
  postServerEvent({
    t: "SET_EVIDENCE_BUNDLE",
      turn_id: turnId,
    bundle: {
      bundle_id: `bndl_danger_${now}`,
      replay_key: `rk_danger_${now}`,
      snapshot_hash: "snap_danger_001",
      env_digest: "env_danger_001",
      policy_digest: "pol_sha256_danger_001",
      ssot_digest: "ssot_sha256_danger_001",
      patch_digest: "",
      runner_meta_digest: "",
      gate_passed: false,
      created_at_ms: now,
      decision_trace: dangerTrace,
      proof_refs: [],
    },
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   FAIL evidence (gate NOT passed)");
  await sleep(STAGE_DELAY);

  // Stage 5: Verdict — BLOCKED
  postServerEvent({
    t: "SET_EXPLAINABLE_VERDICT",
      turn_id: turnId,
    verdict: {
      chosen_action: " BLOCKED — Cannot proceed. Critical policy violations detected.",
      confidence: 0.0,
      reasons_for: [],
      reasons_against: [
        { factor: "PII leak in logging (GDPR violation)", impact: "negative", weight: 0.40 },
        { factor: "Irreversible DB migration (no rollback)", impact: "negative", weight: 0.35 },
        { factor: "Test coverage 42% (requires ≥80%)", impact: "negative", weight: 0.15 },
        { factor: "All invariants failed", impact: "negative", weight: 0.10 },
      ],
      alternatives_rejected: [
        { action: "Proceed with migration", rejection_reason: "Irreversible data loss — no rollback possible" },
        { action: "Partial patch (logging only)", rejection_reason: "Does not address migration risk" },
      ],
    },
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   FAIL verdict (BLOCKED, confidence 0.0)");
  await sleep(STAGE_DELAY);

  // Stage 6: Risk heatmap shows danger
  postServerEvent({
    t: "SET_RISK_HEATMAP",
      turn_id: turnId,
    entries: [
      { file_path: "src/logging/logger.ts", line_start: 20, line_end: 30, risk_level: "dangerous", risk_type: "pii_leak", description: "User email exposed in error output" },
      { file_path: "migrations/003_drop_legacy.sql", line_start: 1, line_end: 5, risk_level: "dangerous", risk_type: "data_loss", description: "Irreversible DROP TABLE" },
      { file_path: "src/db/schema.ts", line_start: 50, line_end: 70, risk_level: "dangerous", risk_type: "breaking_change", description: "Schema change affects 12 downstream tables" },
    ],
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   FAIL risk_heatmap (3 critical/dangerous zones)");

  // Side-effect budget exhausted
  postServerEvent({
    t: "SET_SIDE_EFFECT_BUDGET",
      turn_id: turnId,
    budget: {
      max_side_effects: 0,
      used_side_effects: 0,
      allowed_actions: [],
      blocked_actions: ["write_file", "run_test", "deploy", "git_push", "create_file"],
      budget_status: "exceeded",
    },
  });

  // Drift guard — critical alerts
  postServerEvent({
    t: "SET_DRIFT_GUARD_STATE",
      turn_id: turnId,
    state: {
      alerts: [
        { id: "da_d1", type: "policy_drift", severity: "critical", description: "PII detected — policy requires data masking", previous_digest: "pol_v2.2", current_digest: "pol_v2.3", requires_evidence: true, timestamp_ms: now },
        { id: "da_d2", type: "gate_regression", severity: "critical", description: "Gate pass rate dropped to 0%", previous_digest: "gate_v1.0", current_digest: "gate_v1.1", requires_evidence: true, timestamp_ms: now },
      ],
      policy_version: "v2.3",
      ssot_version: "v1.1",
      last_check_ms: now,
      gate_pass_rate: 0.0,
    },
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   FAIL drift_guard (0% gate pass rate, 2 critical alerts)");
  // eslint-disable-next-line no-console
  console.log("[sim]  Dangerous scenario complete — pipeline BLOCKED execution");
}

/** Print a help menu to the console */
export function simHelp() {
  // eslint-disable-next-line no-console
  console.log(`
┌──────────────────────────────────────────────────┐
│  __dev.sim — Pipeline Scenario Simulator         │
├──────────────────────────────────────────────────┤
│                                                  │
│  Scenarios (async, fires ServerEvents with delays):    │
│    __dev.sim.bugfix()      Successful bugfix   │
│    __dev.sim.feature()     Feature with MCTS   │
│    __dev.sim.dangerous()   Blocked by policy   │
│                                                  │
│  Utilities:                                      │
│    __dev.sim.reset()      Clear pipeline state   │
│    __dev.sim.step(stage, variant)                │
│      stage: "input_gate" | "fail_closed" |       │
│             "strategy" | "validation" |          │
│             "evidence" | "verdict" |             │
│             "risk_heatmap" | "side_effect" |     │
│             "drift_guard"                        │
│      variant: "pass" | "fail" (default: "pass")  │
│                                                  │
│    __dev.sim.help()       Show this menu         │
│                                                  │
│  Example:                                        │
│    __dev.sim.step("validation", "fail")          │
│    __dev.sim.bugfix()                            │
│                                                  │
│  Also available:                                 │
│    __dev.seedAll()        Seed all features      │
│    __dev.streamTurn()     Simulate a full turn   │
│    __dev.simulateAgents() Simulate agent tasks   │
└──────────────────────────────────────────────────┘
  `);
}
