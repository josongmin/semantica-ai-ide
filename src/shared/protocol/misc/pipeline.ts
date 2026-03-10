/**
 * Pipeline Architecture Types
 *
 * Input Gate, Fail-Closed Constraints, Strategy, Validation,
 * Evidence & Trace, Verdict, Risk Heatmap, Side-Effect Budget,
 * Drift Guard, and the composite TurnPipeline.
 */

import type { RiskLevel } from "../tool";

// ─── Pipeline: Input Gate (Stage 0) ─────────────────────────
export type IntentType =
  | "bug_fix"
  | "feature"
  | "refactor"
  | "question"
  | "test"
  | "docs"
  | "config"
  | "unknown";

export type ChangeSize = "trivial" | "small" | "medium" | "large" | "epic";
export type UncertaintyLevel = "low" | "medium" | "high";

export interface InputGateResult {
  readonly intent_type: IntentType;
  readonly risk_level: RiskLevel;
  readonly change_size: ChangeSize;
  readonly uncertainty: UncertaintyLevel;
  readonly context_signals: {
    readonly has_repro: boolean;
    readonly has_logs: boolean;
    readonly has_patch_hints: boolean;
    readonly pii_detected: boolean;
    readonly security_sensitive: boolean;
  };
}

// ─── Pipeline: Fail-Closed Constraints (Stage 0-1) ──────────
export interface FailClosedConstraints {
  readonly allowed_actions: readonly string[];
  readonly required_gates: readonly string[];
  readonly tool_allowlist: readonly string[];
  readonly max_side_effects: number;
  readonly policy_version_digest: string;
  readonly ssot_digest: string;
}

// ─── Pipeline: Strategy (Stage 1) ───────────────────────────
export type StrategyType = "GREEDY" | "BoN" | "BEAM" | "MCTS";
export type PipelineMode = "FAST" | "DEEP" | "AGENT";

export interface BudgetAllocation {
  readonly time_budget_ms: number;
  readonly solver_budget: number;
  readonly max_candidates: number;
  readonly max_depth: number;
}

export interface HypothesisNode {
  readonly id: string;
  readonly hypothesis: string;
  readonly status: "open" | "confirmed" | "refuted";
  readonly confidence: number;
  readonly evidence_ids: readonly string[];
}

export interface StrategyState {
  readonly mode: PipelineMode;
  readonly strategy: StrategyType;
  readonly budget: BudgetAllocation;
  readonly hypothesis_graph: readonly HypothesisNode[];
  readonly search_depth: number;
  readonly candidates_evaluated: number;
  readonly candidates_pruned: number;
  readonly current_best_score: number;
}

// ─── Pipeline: Validation Core (Stage 5) ────────────────────
export type ValidationGateStatus = "pending" | "pass" | "fail" | "skip";

export interface InvariantResult {
  readonly id: string;
  readonly invariant: string;
  readonly status: ValidationGateStatus;
  readonly witness?: string;
  readonly proof_ref?: string;
}

export interface RiskWitness {
  readonly id: string;
  readonly risk_type: string;
  readonly severity: RiskLevel;
  readonly description: string;
  readonly file_path?: string;
  readonly line?: number;
  readonly witness_data?: string;
}

export interface EquivalenceResult {
  readonly id: string;
  readonly original_hash: string;
  readonly modified_hash: string;
  readonly equivalent: boolean;
  readonly witness?: string;
  readonly proof_ref?: string;
}

export interface CounterExample {
  readonly id: string;
  readonly description: string;
  readonly min_repro: string;
  readonly patterns: readonly string[];
  readonly source: "test_failure" | "symbolic" | "invariant_violation";
}

export type QAPIQueryType =
  | "relation_slice"
  | "impact_cone"
  | "invariant_check"
  | "risk_witness"
  | "equivalence";

export interface QAPIResult {
  readonly query_id: string;
  readonly query_type: QAPIQueryType;
  readonly status: "pending" | "resolved" | "error";
  readonly answer?: string;
  readonly witness_id?: string;
  readonly entities?: readonly string[];
  readonly edges?: readonly { readonly from: string; readonly to: string; readonly relation: string }[];
}

export interface ValidationState {
  readonly policy_check: ValidationGateStatus;
  readonly invariants: readonly InvariantResult[];
  readonly risk_witnesses: readonly RiskWitness[];
  readonly equivalences: readonly EquivalenceResult[];
  readonly counter_examples: readonly CounterExample[];
  readonly qapi_results: readonly QAPIResult[];
  readonly test_subset: readonly string[];
  readonly runner_status: "idle" | "running" | "pass" | "fail";
  readonly runner_summary?: string;
  readonly evidence_schema_valid: boolean;
}

// ─── Pipeline: Evidence & Trace (Stage 6) ───────────────────
export interface DecisionTraceEntry {
  readonly id: string;
  readonly timestamp_ms: number;
  readonly stage: string;
  readonly decision: string;
  readonly reason: string;
  readonly alternatives_considered: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface EvidenceBundle {
  readonly bundle_id: string;
  readonly replay_key: string;
  readonly snapshot_hash: string;
  readonly env_digest: string;
  readonly policy_digest: string;
  readonly ssot_digest: string;
  readonly patch_digest: string;
  readonly runner_meta_digest: string;
  readonly gate_passed: boolean;
  readonly created_at_ms: number;
  readonly decision_trace: readonly DecisionTraceEntry[];
  readonly proof_refs: readonly string[];
}

// ─── Pipeline: Explainable Verdict (Stage 7) ────────────────
export type VerdictImpact = "positive" | "negative" | "neutral";

export interface VerdictReason {
  readonly factor: string;
  readonly impact: VerdictImpact;
  readonly weight: number;
  readonly evidence_ref?: string;
}

export interface ExplainableVerdict {
  readonly chosen_action: string;
  readonly confidence: number;
  readonly reasons_for: readonly VerdictReason[];
  readonly reasons_against: readonly VerdictReason[];
  readonly alternatives_rejected: readonly {
    readonly action: string;
    readonly rejection_reason: string;
  }[];
}

// ─── Pipeline: Risk Heatmap (Stage 7) ───────────────────────
export interface RiskHeatmapEntry {
  readonly file_path: string;
  readonly line_start: number;
  readonly line_end: number;
  readonly risk_level: RiskLevel;
  readonly risk_type: string;
  readonly description: string;
}

// ─── Pipeline: Side-Effect Budget (Stage 7) ──────────────────
export type SideEffectBudgetStatus = "ok" | "warning" | "exceeded";

export interface SideEffectBudget {
  readonly max_side_effects: number;
  readonly used_side_effects: number;
  readonly allowed_actions: readonly string[];
  readonly blocked_actions: readonly string[];
  readonly budget_status: SideEffectBudgetStatus;
}

// ─── Pipeline: Drift Guard (Stage 8) ────────────────────────
export type DriftAlertType = "policy_drift" | "ssot_drift" | "gate_regression";
export type DriftAlertSeverity = "info" | "warning" | "critical";

export interface DriftAlert {
  readonly id: string;
  readonly type: DriftAlertType;
  readonly severity: DriftAlertSeverity;
  readonly description: string;
  readonly previous_digest: string;
  readonly current_digest: string;
  readonly requires_evidence: boolean;
  readonly timestamp_ms: number;
}

export interface DriftGuardState {
  readonly alerts: readonly DriftAlert[];
  readonly policy_version: string;
  readonly ssot_version: string;
  readonly last_check_ms: number;
  readonly gate_pass_rate: number;
}

// ─── Turn Pipeline (composite per-turn state) ───────────────
export interface TurnPipeline {
  readonly inputGate: InputGateResult | null;
  readonly failClosed: FailClosedConstraints | null;
  readonly strategy: StrategyState;
  readonly validation: ValidationState;
  readonly evidenceBundle: EvidenceBundle | null;
  readonly decisionTrace: readonly DecisionTraceEntry[];
  readonly verdict: ExplainableVerdict | null;
  readonly riskHeatmap: readonly RiskHeatmapEntry[];
  readonly sideEffectBudget: SideEffectBudget;
  readonly driftGuard: DriftGuardState;
}
