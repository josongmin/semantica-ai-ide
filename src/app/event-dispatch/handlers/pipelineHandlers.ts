/**
 * Turn-pipeline entity handlers.
 *
 * Covers: SET_INPUT_GATE_RESULT, SET_FAIL_CLOSED_CONSTRAINTS, SET_STRATEGY_STATE,
 *         SET_VALIDATION_STATE, SET_EVIDENCE_BUNDLE, PUSH_DECISION_TRACE,
 *         SET_EXPLAINABLE_VERDICT, SET_RISK_HEATMAP, SET_SIDE_EFFECT_BUDGET,
 *         SET_DRIFT_GUARD_STATE
 */
import {
  DEFAULT_TURN_PIPELINE,
  turnPipelineAtomFamily,
} from "~entities/turn-pipeline";
import type { ServerEvent, TurnId, TurnPipeline } from "~shared/protocol";

import { registerHandler, type Store } from "./types";

// ── Self-registering handlers (side-effect at import time) ──

function getPipeline(s: Store, turnId: TurnId): TurnPipeline {
  return (s.get(turnPipelineAtomFamily(turnId))) ?? DEFAULT_TURN_PIPELINE;
}

registerHandler("SET_INPUT_GATE_RESULT", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_INPUT_GATE_RESULT") return;
  const prev = getPipeline(s, e.turn_id);
  s.set(turnPipelineAtomFamily(e.turn_id), { ...prev, inputGate: e.result });
});

registerHandler("SET_FAIL_CLOSED_CONSTRAINTS", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_FAIL_CLOSED_CONSTRAINTS") return;
  const prev = getPipeline(s, e.turn_id);
  s.set(turnPipelineAtomFamily(e.turn_id), { ...prev, failClosed: e.constraints });
});

registerHandler("SET_STRATEGY_STATE", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_STRATEGY_STATE") return;
  const prev = getPipeline(s, e.turn_id);
  s.set(turnPipelineAtomFamily(e.turn_id), { ...prev, strategy: e.state });
});

registerHandler("SET_VALIDATION_STATE", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_VALIDATION_STATE") return;
  const prev = getPipeline(s, e.turn_id);
  s.set(turnPipelineAtomFamily(e.turn_id), { ...prev, validation: e.state });
});

registerHandler("SET_EVIDENCE_BUNDLE", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_EVIDENCE_BUNDLE") return;
  const prev = getPipeline(s, e.turn_id);
  s.set(turnPipelineAtomFamily(e.turn_id), { ...prev, evidenceBundle: e.bundle });
});

registerHandler("PUSH_DECISION_TRACE", (e: ServerEvent, s: Store) => {
  if (e.t !== "PUSH_DECISION_TRACE") return;
  const prev = getPipeline(s, e.turn_id);
  s.set(turnPipelineAtomFamily(e.turn_id), { ...prev, decisionTrace: [...prev.decisionTrace, e.entry] });
});

registerHandler("SET_EXPLAINABLE_VERDICT", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_EXPLAINABLE_VERDICT") return;
  const prev = getPipeline(s, e.turn_id);
  s.set(turnPipelineAtomFamily(e.turn_id), { ...prev, verdict: e.verdict });
});

registerHandler("SET_RISK_HEATMAP", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_RISK_HEATMAP") return;
  const prev = getPipeline(s, e.turn_id);
  s.set(turnPipelineAtomFamily(e.turn_id), { ...prev, riskHeatmap: e.entries });
});

registerHandler("SET_SIDE_EFFECT_BUDGET", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_SIDE_EFFECT_BUDGET") return;
  const prev = getPipeline(s, e.turn_id);
  s.set(turnPipelineAtomFamily(e.turn_id), { ...prev, sideEffectBudget: e.budget });
});

registerHandler("SET_DRIFT_GUARD_STATE", (e: ServerEvent, s: Store) => {
  if (e.t !== "SET_DRIFT_GUARD_STATE") return;
  const prev = getPipeline(s, e.turn_id);
  s.set(turnPipelineAtomFamily(e.turn_id), { ...prev, driftGuard: e.state });
});

/** @deprecated Use side-effect import instead. Kept for backward compatibility. */
export function setupPipelineHandlers(): void {
  // Handlers are now registered at module scope.
}
