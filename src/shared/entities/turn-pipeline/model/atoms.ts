import { atom } from "jotai";

import { createBoundedAtomFamily } from "~shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "~shared/lib/atoms/debugLabel";
import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";
import type { TurnId, TurnPipeline } from "~shared/protocol";

export const DEFAULT_TURN_PIPELINE: TurnPipeline = {
  inputGate: null,
  failClosed: null,
  strategy: {
    mode: "FAST",
    strategy: "GREEDY",
    budget: { time_budget_ms: 30000, solver_budget: 1, max_candidates: 1, max_depth: 1 },
    hypothesis_graph: [],
    search_depth: 0,
    candidates_evaluated: 0,
    candidates_pruned: 0,
    current_best_score: 0,
  },
  validation: {
    policy_check: "pending",
    invariants: [],
    risk_witnesses: [],
    equivalences: [],
    counter_examples: [],
    qapi_results: [],
    test_subset: [],
    runner_status: "idle",
    evidence_schema_valid: true,
  },
  evidenceBundle: null,
  decisionTrace: [],
  verdict: null,
  riskHeatmap: [],
  sideEffectBudget: {
    max_side_effects: 10,
    used_side_effects: 0,
    allowed_actions: [],
    blocked_actions: [],
    budget_status: "ok",
  },
  driftGuard: {
    alerts: [],
    policy_version: "",
    ssot_version: "",
    last_check_ms: 0,
    gate_pass_rate: 1.0,
  },
};

/** Per-turn pipeline state. Keyed by TurnId. */
export const turnPipelineAtomFamily = createBoundedAtomFamily(
  (_id: TurnId) => atom<TurnPipeline>(DEFAULT_TURN_PIPELINE),
  { maxSize: 500 },
  (a: TurnId, b: TurnId) => a === b,
);
setDebugLabel(turnPipelineAtomFamily, "turnPipelineAtomFamily");

/** Reset atom that clears all cached atomFamily entries */
export const resetTurnPipelineStoreAtom = atom(null, (_get, _set) => {
  turnPipelineAtomFamily.setShouldRemove(() => true);
  turnPipelineAtomFamily.setShouldRemove(null);
});

registerResetAtom(resetTurnPipelineStoreAtom);
