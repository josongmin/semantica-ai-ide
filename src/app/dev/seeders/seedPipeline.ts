import type {
  DecisionTraceEntry,
  DriftGuardState,
  EvidenceBundle,
  ExplainableVerdict,
  FailClosedConstraints,
  InputGateResult,
  RiskHeatmapEntry,
  SideEffectBudget,
  StrategyState,
  TurnId,
  ValidationState,
} from "../../../shared/protocol";
import { postServerEvent } from "../devUtils";

/**
 * Seeds the full pipeline state for turn 1: input gate, fail-closed constraints,
 * strategy, validation, decision trace, evidence bundle, explainable verdict,
 * risk heatmap, side-effect budget, and drift guard.
 */
export function seedPipeline(t1: TurnId) {
  // ─── Pipeline: Input Gate ───────────────────────────────
  postServerEvent({
    t: "SET_INPUT_GATE_RESULT",
    turn_id: t1,
    result: {
      intent_type: "bug_fix",
      risk_level: "moderate",
      change_size: "medium",
      uncertainty: "low",
      context_signals: {
        has_repro: true,
        has_logs: true,
        has_patch_hints: false,
        pii_detected: false,
        security_sensitive: true,
      },
    } satisfies InputGateResult,
  });

  // ─── Pipeline: Fail-Closed Constraints ──────────────────
  postServerEvent({
    t: "SET_FAIL_CLOSED_CONSTRAINTS",
    turn_id: t1,
    constraints: {
      allowed_actions: ["read_file", "write_file", "run_test", "search"],
      required_gates: ["invariant_check", "risk_witness", "test_pass"],
      tool_allowlist: ["read_file", "write_file", "grep", "bash", "lint"],
      max_side_effects: 5,
      policy_version_digest: "pol_sha256_a1b2c3d4",
      ssot_digest: "ssot_sha256_e5f6g7h8",
    } satisfies FailClosedConstraints,
  });

  // ─── Pipeline: Strategy ────────────────────────────────
  postServerEvent({
    t: "SET_STRATEGY_STATE",
    turn_id: t1,
    state: {
      mode: "DEEP",
      strategy: "BEAM",
      budget: {
        time_budget_ms: 60000,
        solver_budget: 3,
        max_candidates: 8,
        max_depth: 4,
      },
      hypothesis_graph: [
        { id: "h1", hypothesis: "NullPointerException은 userService.getUser() 반환값 미검증이 원인", status: "confirmed", confidence: 0.92, evidence_ids: ["ev1", "ev2"] },
        { id: "h2", hypothesis: "Race condition으로 인한 동시 접근 문제", status: "refuted", confidence: 0.15, evidence_ids: ["ev3"] },
        { id: "h3", hypothesis: "입력 validation 누락으로 인한 잘못된 상태 전이", status: "open", confidence: 0.45, evidence_ids: [] },
      ],
      search_depth: 3,
      candidates_evaluated: 5,
      candidates_pruned: 2,
      current_best_score: 0.87,
    } satisfies StrategyState,
  });

  // ─── Pipeline: Validation Core ─────────────────────────
  postServerEvent({
    t: "SET_VALIDATION_STATE",
    turn_id: t1,
    state: {
      policy_check: "pass",
      invariants: [
        { id: "inv1", invariant: "모든 public API에 null check 존재", status: "pass", witness: "getUser() → null guard 추가됨" },
        { id: "inv2", invariant: "트랜잭션 경계 내 DB 호출", status: "pass" },
        { id: "inv3", invariant: "에러 핸들링 체인 무결성", status: "fail", witness: "catch 블록에서 원본 에러 context 손실" },
      ],
      risk_witnesses: [
        { id: "rw1", risk_type: "null_deref", severity: "moderate", description: "userService.getUser()의 null 반환 가능성", file_path: "src/services/UserController.ts", line: 42 },
        { id: "rw2", risk_type: "error_swallow", severity: "dangerous", description: "catch 블록이 원본 에러를 무시하고 generic error 반환", file_path: "src/middleware/errorHandler.ts", line: 78, witness_data: "catch(e) { return res.status(500).send('Error') }" },
      ],
      equivalences: [
        { id: "eq1", original_hash: "abc123", modified_hash: "def456", equivalent: true, witness: "모든 테스트 케이스에서 동일한 출력" },
      ],
      counter_examples: [
        { id: "ce1", description: "undefined user ID로 API 호출 시 500 에러", min_repro: "curl /api/users/undefined", patterns: ["null_input", "missing_validation"], source: "test_failure" },
      ],
      qapi_results: [
        { query_id: "q1", query_type: "relation_slice", status: "resolved", answer: "UserController → UserService → UserRepository", entities: ["UserController", "UserService", "UserRepository"] },
        { query_id: "q2", query_type: "impact_cone", status: "resolved", answer: "변경 영향 범위: 3 파일, 12 함수", entities: ["getUser", "validateUser", "findById"] },
        { query_id: "q3", query_type: "risk_witness", status: "resolved", answer: "null deref 위험 2건 식별", witness_id: "rw1" },
        { query_id: "q4", query_type: "invariant_check", status: "pending" },
      ],
      test_subset: ["user.controller.test.ts", "error-handler.test.ts", "user.service.test.ts"],
      runner_status: "pass",
      runner_summary: "42 passed, 0 failed (3.2s)",
      evidence_schema_valid: true,
    } satisfies ValidationState,
  });

  // ─── Pipeline: Decision Trace ──────────────────────────
  const traceEntries: DecisionTraceEntry[] = [
    { id: "dt1", timestamp_ms: Date.now() - 5000, stage: "S0", decision: "Intent: bug_fix (confidence 0.94)", reason: "에러 로그와 스택 트레이스 포함", alternatives_considered: 3 },
    { id: "dt2", timestamp_ms: Date.now() - 4500, stage: "S1", decision: "Strategy: BEAM (depth 4)", reason: "moderate risk + medium change size → deep search", alternatives_considered: 4 },
    { id: "dt3", timestamp_ms: Date.now() - 4000, stage: "S4", decision: "Candidate A 선택 (score 0.87)", reason: "null guard 추가 + 에러 context 보존", alternatives_considered: 5 },
    { id: "dt4", timestamp_ms: Date.now() - 3000, stage: "S4", decision: "Candidate C pruned (dominated)", reason: "A가 C의 모든 테스트를 통과하면서 추가 invariant도 충족", alternatives_considered: 0 },
    { id: "dt5", timestamp_ms: Date.now() - 2000, stage: "S5", decision: "Validation: PASS", reason: "42/42 테스트 통과, invariant 2/3 통과 (1 warning)", alternatives_considered: 0 },
  ];
  for (const entry of traceEntries) {
    postServerEvent({ t: "PUSH_DECISION_TRACE", turn_id: t1, entry });
  }

  // ─── Pipeline: Evidence Bundle ─────────────────────────
  postServerEvent({
    t: "SET_EVIDENCE_BUNDLE",
    turn_id: t1,
    bundle: {
      bundle_id: "bndl_2024_001",
      replay_key: "rk_sha256_x9y0z1w2",
      snapshot_hash: "snap_sha256_a1b2",
      env_digest: "env_sha256_c3d4",
      policy_digest: "pol_sha256_a1b2c3d4",
      ssot_digest: "ssot_sha256_e5f6g7h8",
      patch_digest: "patch_sha256_i9j0",
      runner_meta_digest: "rm_sha256_k1l2",
      gate_passed: true,
      created_at_ms: Date.now(),
      decision_trace: traceEntries,
      proof_refs: ["proof://invariant/null_guard_added", "proof://test/all_pass_42"],
    } satisfies EvidenceBundle,
  });

  // ─── Pipeline: Explainable Verdict ─────────────────────
  postServerEvent({
    t: "SET_EXPLAINABLE_VERDICT",
    turn_id: t1,
    verdict: {
      chosen_action: "null guard 추가 + 에러 context 보존 패치 적용",
      confidence: 0.87,
      reasons_for: [
        { factor: "모든 기존 테스트 통과", impact: "positive", weight: 0.35 },
        { factor: "NullPointerException 근본 원인 해결", impact: "positive", weight: 0.30, evidence_ref: "rw1" },
        { factor: "최소 변경 원칙 준수 (2 파일, +12 -3 lines)", impact: "positive", weight: 0.15 },
      ],
      reasons_against: [
        { factor: "에러 핸들링 체인 완전 수정 미완료 (inv3 fail)", impact: "negative", weight: 0.10 },
        { factor: "성능 영향 미측정 (null check 추가)", impact: "neutral", weight: 0.05 },
      ],
      alternatives_rejected: [
        { action: "Optional 타입 전면 도입", rejection_reason: "blast radius 과다 (15+ 파일 변경 필요)" },
        { action: "에러 핸들링 미들웨어 전체 리팩토링", rejection_reason: "change_size 예산 초과 + uncertainty 높음" },
      ],
    } satisfies ExplainableVerdict,
  });

  // ─── Pipeline: Risk Heatmap ────────────────────────────
  postServerEvent({
    t: "SET_RISK_HEATMAP",
    turn_id: t1,
    entries: [
      { file_path: "src/services/UserController.ts", line_start: 38, line_end: 52, risk_level: "moderate", risk_type: "null_deref", description: "getUser() null 반환 시 핸들링 필요" },
      { file_path: "src/services/UserController.ts", line_start: 95, line_end: 110, risk_level: "safe", risk_type: "validated", description: "입력 검증 완료된 영역" },
      { file_path: "src/middleware/errorHandler.ts", line_start: 70, line_end: 85, risk_level: "dangerous", risk_type: "error_swallow", description: "원본 에러 context 손실 위험" },
    ] satisfies RiskHeatmapEntry[],
  });

  // ─── Pipeline: Side-Effect Budget ──────────────────────
  postServerEvent({
    t: "SET_SIDE_EFFECT_BUDGET",
    turn_id: t1,
    budget: {
      max_side_effects: 5,
      used_side_effects: 3,
      allowed_actions: ["write_file", "run_test", "lint"],
      blocked_actions: ["git_push", "deploy", "delete_branch"],
      budget_status: "ok",
    } satisfies SideEffectBudget,
  });

  // ─── Pipeline: Drift Guard ─────────────────────────────
  postServerEvent({
    t: "SET_DRIFT_GUARD_STATE",
    turn_id: t1,
    state: {
      alerts: [
        { id: "da1", type: "gate_regression", severity: "warning", description: "invariant 통과율 95% → 67% 하락 (최근 3회 실행)", previous_digest: "pol_v2.1", current_digest: "pol_v2.2", requires_evidence: true, timestamp_ms: Date.now() - 60000 },
        { id: "da2", type: "ssot_drift", severity: "info", description: "Action Schema에 new_tool_call 추가됨", previous_digest: "ssot_v1.0", current_digest: "ssot_v1.1", requires_evidence: false, timestamp_ms: Date.now() - 30000 },
      ],
      policy_version: "v2.2",
      ssot_version: "v1.1",
      last_check_ms: Date.now() - 10000,
      gate_pass_rate: 0.85,
    } satisfies DriftGuardState,
  });
}
