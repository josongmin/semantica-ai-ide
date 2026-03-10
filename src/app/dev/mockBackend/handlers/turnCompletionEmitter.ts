/**
 * Turn Completion Event Emitter
 *
 * Extracted from streamingHandlers to keep file sizes manageable.
 * Emits all post-summary pipeline events: completion batch, verdict,
 * risk heatmap, drift guard, plugin status, suggestions, and turn finalization.
 */
import type {
  MessageId,
  RiskLevel,
  TurnId,
} from "../../../../shared/protocol";
import {
  nextId,
  postServerEvent,
  postServerEvents,
} from "../MockBackendCore";
import { addCost,type MockSessionState } from "../MockSessionState";
import { getCost, getTokensIn, getTokensOut } from "./handlerConstants";

function deriveConfidence(risk: string): number {
  if (risk === "R1") return 0.95;
  if (risk === "R2") return 0.85;
  return 0.7;
}

/** Classification result from responsePool.classifyIntent */
export interface TurnClassification {
  intent: string;
  risk: string;
  changeSize: string;
  uncertainty: string;
}

/** Simplified response shape used by the emitter */
export interface TurnResponse {
  text: string;
  fileChanges?: readonly { file_path: string; status: string; insertions: number; deletions: number }[];
}

/**
 * Emit the completion batch: summary finalization, hooks, notifications,
 * CI/CD updates, debug state, and test results.
 */
export function emitCompletionBatch(
  turnId: TurnId,
  summaryMsgId: MessageId,
  classification: TurnClassification,
  response: TurnResponse,
  hasFileChanges: boolean,
  state: MockSessionState,
): void {
  const completionBatch: Parameters<typeof postServerEvents>[0] = [
    { t: "SET_MESSAGE_STATUS", id: summaryMsgId, status: "final" },
    {
      t: "UPDATE_TURN_PHASE",
      turn_id: turnId,
      phase: "summary",
      entry: { status: "success" },
    },
    {
      t: "SET_HOOK_EVENT",
      event: {
        id: nextId("hook"),
        hook_name: "PostToolUse",
        phase: "completed",
        decision: "allow",
        timestamp_ms: Date.now(),
      },
    },
    {
      t: "PUSH_NOTIFICATION",
      notification: {
        id: nextId("notif"),
        type: hasFileChanges ? "agent_complete" : "info",
        urgency: classification.risk === "R3" || classification.risk === "R4" ? "high" : "normal",
        title: "턴 완료",
        message: hasFileChanges
          ? `${response.fileChanges!.length}개 파일 변경, 테스트 통과`
          : "분석이 완료되었습니다",
        timestamp_ms: Date.now(),
        auto_dismiss_ms: 5000,
      },
    },
  ];

  // Update CI/CD to pass if running
  if (hasFileChanges) {
    completionBatch.push({
      t: "SET_CI_CD_STATUS",
      pipeline: {
        id: nextId("ci"),
        name: "Agent CI Check",
        phase: "pass",
        branch: `agent/${classification.intent.toLowerCase()}`,
        started_at_ms: Date.now() - 3000,
        finished_at_ms: Date.now(),
        steps: [
          { name: "typecheck", phase: "pass", duration_ms: 1200 },
          { name: "lint", phase: "pass", duration_ms: 800 },
          { name: "test", phase: "pass", duration_ms: 3450 },
        ],
      },
    });
    completionBatch.push({
      t: "SET_DEPLOY_STATUS",
      deploy: {
        id: nextId("dep"),
        target: "preview",
        phase: "live",
        url: `https://preview-${state.turnCounter}.example.com`,
        health_check_passed: true,
        started_at_ms: Date.now() - 2000,
        finished_at_ms: Date.now(),
      },
    });
  }

  // Update debug state to resolved
  if (classification.intent === "Q_DIAG" || classification.intent === "Q_FIX") {
    completionBatch.push({
      t: "SET_DEBUG_STATE",
      state: {
        phase: "resolved",
        hypotheses: [
          { id: nextId("hyp"), description: "Root cause identified and fixed", status: "confirmed", confidence: 0.95 },
        ],
      },
    });
  }

  if (hasFileChanges || classification.intent === "Q_SPEC") {
    completionBatch.push({
      t: "SET_TEST_RESULTS",
      results: {
        runner_status: "pass",
        total: 42,
        passed: 42,
        failed: 0,
        skipped: 2,
        duration_ms: 3450,
        cases: [
          { name: "should handle APPEND_TEXT", suite: "dispatchServerEvent", status: "pass", duration_ms: 12 },
          { name: "should reset stores", suite: "dispatchServerEvent", status: "pass", duration_ms: 8 },
        ],
        command: "vitest run",
        turn_id: turnId,
      },
    });
  }

  postServerEvents(completionBatch);
}

/**
 * Emit post-completion pipeline events: verdict, risk heatmap, side-effect budget,
 * drift guard, plugin/wave/verifier/spec/bugbot status, schedules, agent steer,
 * prompt suggestions, and finalize the turn with cost/metrics/checkpoint.
 */
export function emitPostCompletionEvents(
  turnId: TurnId,
  classification: TurnClassification,
  response: TurnResponse,
  hasFileChanges: boolean,
  state: MockSessionState,
  PHASE_MS: number,
  createdAtMs: number,
): void {
  // ── Pipeline Stage 7: Verdict + Risk Heatmap + Budget ─────
  const riskFiles = hasFileChanges
    ? response.fileChanges!.map((fc) => ({
        file_path: fc.file_path,
        line_start: 1,
        line_end: fc.insertions + fc.deletions,
        risk_level: (classification.risk === "R3" || classification.risk === "R4" ? "dangerous" : "safe") as RiskLevel,
        risk_type: classification.intent === "Q_SEC" ? "security" : "logic",
        description: `${fc.status} ${fc.file_path}`,
      }))
    : [];

  postServerEvents([
    {
      t: "SET_EXPLAINABLE_VERDICT",
      turn_id: turnId,
      verdict: {
        chosen_action: hasFileChanges ? "apply_patch" : "answer_only",
        confidence: deriveConfidence(classification.risk),
        reasons_for: [
          { factor: "validation_passed", impact: "positive", weight: 0.5 },
          { factor: "test_coverage", impact: "positive", weight: 0.3 },
        ],
        reasons_against: classification.risk === "R3" || classification.risk === "R4"
          ? [{ factor: "high_risk_change", impact: "negative", weight: 0.4 }]
          : [],
        alternatives_rejected: [],
      },
    },
    { t: "SET_RISK_HEATMAP", turn_id: turnId, entries: riskFiles },
    {
      t: "SET_SIDE_EFFECT_BUDGET",
      turn_id: turnId,
      budget: {
        max_side_effects: 10,
        used_side_effects: hasFileChanges ? response.fileChanges!.length : 0,
        allowed_actions: ["file_write", "bash", "edit"],
        blocked_actions: classification.intent === "Q_SEC" ? ["network"] : [],
        budget_status: "ok",
      },
    },
  ]);

  // ── Pipeline Stage 8: Drift Guard ─────────────────────────
  postServerEvent({
    t: "SET_DRIFT_GUARD_STATE",
    turn_id: turnId,
    state: {
      alerts: [],
      policy_version: "v1",
      ssot_version: "v1",
      last_check_ms: Date.now(),
      gate_pass_rate: 1.0,
    },
  });

  // ── P2: Remaining feature events ──────────────────────────
  postServerEvents([
    {
      t: "SET_PLUGIN_STATUS",
      plugins: [
        { id: "plugin-eslint", name: "eslint", version: "9.0.0", phase: "installed" },
        { id: "plugin-prettier", name: "prettier", version: "3.4.0", phase: "installed" },
      ],
    },
    ...(classification.changeSize !== "C0" ? [{
      t: "SET_AGENT_WAVE" as const,
      wave: {
        wave_id: nextId("wave"),
        wave_number: 1,
        phase: "completed" as const,
        agent_ids: ["main"],
        completed_count: 1,
        total_count: 1,
        started_at_ms: Date.now() - 5000,
      },
    }] : []),
    ...(hasFileChanges ? [{
      t: "SET_VERIFIER_RESULT" as const,
      result: {
        id: nextId("vr"),
        spec_section: "general",
        outcome: "pass" as const,
        message: "All verification checks passed",
        inconsistencies: [] as readonly string[],
        timestamp_ms: Date.now(),
      },
    }] : []),
    {
      t: "UPDATE_LIVING_SPEC" as const,
      spec: {
        id: "spec-main",
        title: "Project Specification",
        content: `## Turn ${state.turnCounter}\n${response.text.slice(0, 100)}...`,
        version: state.turnCounter,
        last_updated_ms: Date.now(),
        sections_completed: state.turnCounter,
        sections_total: state.turnCounter + 2,
      },
    },
    {
      t: "SET_BUGBOT_STATUS" as const,
      status: {
        phase: "idle" as const,
        issues: [],
        last_scan_ms: Date.now(),
      },
    },
  ]);

  // ── P1: Session schedules ─────────────────────────────────
  postServerEvent({
    t: "SET_SESSION_SCHEDULE",
    schedules: [
      { id: "sched-nightly", label: "Nightly lint check", frequency: "daily", cron_expression: "0 3 * * *", enabled: true, prompt: "프로젝트 린트 검사 실행", next_run_ms: Date.now() + 86_400_000 },
    ],
  });

  // ── P2: Agent steer (if high risk) ────────────────────────
  if (classification.risk === "R3" || classification.risk === "R4") {
    postServerEvent({
      t: "STEER_AGENT",
      steer: {
        agent_id: "main",
        action: "pause",
        reason: `High risk (${classification.risk}) — awaiting review`,
        timestamp_ms: Date.now(),
      },
    });
  }

  // ── Emit prompt suggestions for next turn ────────────────
  postServerEvents([
    { t: "PUSH_PROMPT_SUGGESTION", suggestion: { id: nextId("sug"), text: "이 변경에 대한 테스트를 작성해줘", context: "post-turn", confidence: 0.85 } },
    { t: "PUSH_PROMPT_SUGGESTION", suggestion: { id: nextId("sug"), text: "관련 파일도 함께 리팩토링 해줘", context: "post-turn", confidence: 0.7 } },
  ]);

  // ── Finalize turn ─────────────────────────────────────────
  const turnCost = getCost(classification.changeSize);
  const tokIn = getTokensIn(classification.changeSize);
  const tokOut = getTokensOut(classification.changeSize);
  addCost(state, turnCost, tokIn, tokOut);

  postServerEvents([
    {
      t: "UPSERT_TURN",
      turn: { id: turnId, phases: [], status: "success", created_at_ms: createdAtMs },
    },
    {
      t: "SET_SESSION_META",
      meta: {
        status: "idle",
        cost_usd: state.costUsd,
        tokens_in: state.tokensIn,
        tokens_out: state.tokensOut,
      },
    },
    {
      t: "UPDATE_TURN_METRICS",
      turn_id: turnId,
      ttft_ms: 120 + Math.floor(Math.random() * 200),
      latency_ms: PHASE_MS * 4 + Math.floor(Math.random() * 500),
      estimated_cost_usd: turnCost,
      token_usage: { input_tokens: tokIn, output_tokens: tokOut },
    },
    {
      t: "ADD_CHECKPOINT",
      checkpoint: {
        id: nextId("cp"),
        turn_id: turnId,
        label: `Turn ${state.turnCounter}`,
        timestamp_ms: Date.now(),
      },
    },
  ]);

  // eslint-disable-next-line no-console
  console.log(`[mockBackend] Turn classified: ${classification.intent} R=${classification.risk} C=${classification.changeSize} U=${classification.uncertainty}`);

  state.turnIds.push(turnId);
}
