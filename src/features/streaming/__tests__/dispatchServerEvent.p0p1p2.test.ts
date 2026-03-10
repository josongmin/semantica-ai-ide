import { createStore } from "jotai";

import { turnPipelineAtomFamily } from "~entities/turn-pipeline";
import { backgroundJobsAtom } from "~shared/bootstrap/background-agent";

import { dispatchServerEvent } from "../../../app/event-dispatch";
import type { TurnId } from "../../../shared/protocol";
import { replaySessionAtom } from "../../action-replay";
import { agentRulesAtom, ruleViolationsAtom } from "../../agent-rules";
import { agentSteersAtom } from "../../agent-steer";
import { agentWaveAtom } from "../../agent-wave";
import { authStatusAtom } from "../../auth-status";
import { autoContextAtom } from "../../auto-context";
import { bugbotStatusAtom } from "../../bugbot-status";
import { ciCdPipelineAtom } from "../../ci-cd-status";
import { debugStateAtom } from "../../debug-state";
import { deployStatusAtom } from "../../deploy-status";
import { diagnosticsMapAtom } from "../../diagnostics";
import { externalChangesAtom } from "../../file-watch";
import { hookEventsAtom } from "../../hook-events";
import { livingSpecAtom } from "../../living-spec";
import { debateSessionFamily } from "../../multi-agent-debate";
import { notificationsAtom } from "../../notifications";
import { pluginListAtom } from "../../plugin-status";
import { promptSuggestionsAtom } from "../../prompt-suggestions";
import { quotaStatusAtom } from "../../quota-status";
import { sandboxStatusAtom } from "../../sandbox-status";
import { securityScanAtom } from "../../security-scan";
import { sessionSchedulesAtom } from "../../session-schedule";
import { speculativeEditFamily } from "../../speculative-edit";
import { terminalChunksAtom } from "../../terminal-output";
import { testResultsAtom } from "../../test-results";
import { verifierResultAtom } from "../../verifier-result";
import { worktreeStatusAtom } from "../../worktree-status";
const TEST_TURN_ID = "turn-test" as TurnId;

function createDispatch(store: ReturnType<typeof createStore>) {
  return (serverEvent: Parameters<typeof dispatchServerEvent>[1]) =>
    dispatchServerEvent(store, serverEvent);
}

// ─────────────────────────────────────────────────────────────
// P0: Terminal, Test, Diagnostics, Quota, Notification, Auth
// ─────────────────────────────────────────────────────────────

describe("P0 ServerEvent dispatch", () => {
  describe("APPEND_TERMINAL_OUTPUT", () => {
    it("appends terminal chunk", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "APPEND_TERMINAL_OUTPUT",
        chunk: { tool_call_id: "tc-1", stream: "stdout", chunk: "hello\n", timestamp_ms: 1000 },
      });

      const chunks = store.get(terminalChunksAtom);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]?.chunk).toBe("hello\n");
      expect(chunks[0]?.stream).toBe("stdout");
    });

    it("accumulates multiple chunks", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "APPEND_TERMINAL_OUTPUT",
        chunk: { tool_call_id: "tc-1", stream: "stdout", chunk: "line1\n", timestamp_ms: 1000 },
      });
      dispatch({
        t: "APPEND_TERMINAL_OUTPUT",
        chunk: { tool_call_id: "tc-1", stream: "stderr", chunk: "err\n", timestamp_ms: 2000 },
      });

      expect(store.get(terminalChunksAtom)).toHaveLength(2);
    });
  });

  describe("SET_TEST_RESULTS", () => {
    it("sets test results", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_TEST_RESULTS",
        results: {
          runner_status: "pass",
          total: 10,
          passed: 9,
          failed: 1,
          skipped: 0,
          duration_ms: 500,
          cases: [{ name: "test-1", status: "pass", duration_ms: 5 }],
        },
      });

      const results = store.get(testResultsAtom);
      expect(results.runner_status).toBe("pass");
      expect(results.total).toBe(10);
      expect(results.failed).toBe(1);
      expect(results.cases).toHaveLength(1);
    });

    it("replaces on subsequent dispatch", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_TEST_RESULTS",
        results: {
          runner_status: "running",
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0,
          duration_ms: 0,
          cases: [],
        },
      });
      dispatch({
        t: "SET_TEST_RESULTS",
        results: {
          runner_status: "pass",
          total: 5,
          passed: 5,
          failed: 0,
          skipped: 0,
          duration_ms: 200,
          cases: [],
        },
      });

      expect(store.get(testResultsAtom).total).toBe(5);
    });
  });

  describe("SET_DIAGNOSTICS", () => {
    it("sets diagnostics per file_path", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_DIAGNOSTICS",
        file_path: "src/foo.ts",
        diagnostics: [
          {
            id: "d1",
            file_path: "src/foo.ts",
            line: 10,
            severity: "warning",
            source: "linter",
            message: "Unused var",
          },
        ],
      });

      const map = store.get(diagnosticsMapAtom);
      expect(map.get("src/foo.ts")).toHaveLength(1);
      expect(map.get("src/foo.ts")![0]?.message).toBe("Unused var");
    });

    it("sets diagnostics for multiple files independently", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_DIAGNOSTICS",
        file_path: "a.ts",
        diagnostics: [
          {
            id: "d1",
            file_path: "a.ts",
            line: 1,
            severity: "error",
            source: "compiler",
            message: "err",
          },
        ],
      });
      dispatch({
        t: "SET_DIAGNOSTICS",
        file_path: "b.ts",
        diagnostics: [
          {
            id: "d2",
            file_path: "b.ts",
            line: 2,
            severity: "info",
            source: "linter",
            message: "info",
          },
        ],
      });

      const map = store.get(diagnosticsMapAtom);
      expect(map.size).toBe(2);
    });
  });

  describe("SET_QUOTA_STATUS", () => {
    it("sets quota status", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_QUOTA_STATUS",
        status: { alert_level: "warning", budget_usd: 10, spent_usd: 8 },
      });

      expect(store.get(quotaStatusAtom).alert_level).toBe("warning");
    });
  });

  describe("PUSH_NOTIFICATION", () => {
    it("pushes notification", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "PUSH_NOTIFICATION",
        notification: {
          id: "n1",
          type: "agent_complete",
          urgency: "normal",
          title: "Done",
          message: "Task complete",
          timestamp_ms: 1000,
        },
      });

      const notifs = store.get(notificationsAtom);
      expect(notifs).toHaveLength(1);
      expect(notifs[0]?.title).toBe("Done");
    });

    it("accumulates multiple notifications", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "PUSH_NOTIFICATION",
        notification: {
          id: "n1",
          type: "info",
          urgency: "normal",
          title: "A",
          message: "msg",
          timestamp_ms: 1000,
        },
      });
      dispatch({
        t: "PUSH_NOTIFICATION",
        notification: {
          id: "n2",
          type: "error",
          urgency: "high",
          title: "B",
          message: "msg",
          timestamp_ms: 2000,
        },
      });

      expect(store.get(notificationsAtom)).toHaveLength(2);
    });
  });

  describe("SET_AUTH_STATUS", () => {
    it("sets auth status", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_AUTH_STATUS",
        status: { state: "authenticated", provider: "github", user_email: "test@example.com" },
      });

      const auth = store.get(authStatusAtom);
      expect(auth.state).toBe("authenticated");
      expect(auth.provider).toBe("github");
    });
  });
});

// ─────────────────────────────────────────────────────────────
// P1: Hook, Worktree, FileWatch, CI/CD, Security, Deploy,
//     Prompt, Debug
// ─────────────────────────────────────────────────────────────

describe("P1 ServerEvent dispatch", () => {
  describe("SET_HOOK_EVENT", () => {
    it("pushes hook event", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_HOOK_EVENT",
        event: {
          id: "h1",
          hook_name: "PostToolUse",
          phase: "completed",
          timestamp_ms: 1000,
          decision: "allow",
        },
      });

      expect(store.get(hookEventsAtom)).toHaveLength(1);
      expect(store.get(hookEventsAtom)[0]?.hook_name).toBe("PostToolUse");
    });
  });

  describe("SET_WORKTREE_STATUS", () => {
    it("sets worktree status", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      expect(store.get(worktreeStatusAtom)).toBeNull();

      dispatch({
        t: "SET_WORKTREE_STATUS",
        worktree: {
          id: "wt-1",
          branch: "feat/test",
          path: "/tmp/wt",
          phase: "active",
          created_at_ms: 1000,
          base_branch: "main",
        },
      });

      const wt = store.get(worktreeStatusAtom);
      expect(wt).not.toBeNull();
      expect(wt!.branch).toBe("feat/test");
    });
  });

  describe("FILE_CHANGE_EXTERNAL", () => {
    it("pushes external file change", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "FILE_CHANGE_EXTERNAL",
        change: { file_path: "src/app.ts", change_type: "modified", timestamp_ms: 1000 },
      });

      expect(store.get(externalChangesAtom)).toHaveLength(1);
      expect(store.get(externalChangesAtom)[0]?.file_path).toBe("src/app.ts");
    });
  });

  describe("SET_CI_CD_STATUS", () => {
    it("sets CI/CD pipeline status", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      expect(store.get(ciCdPipelineAtom)).toBeNull();

      dispatch({
        t: "SET_CI_CD_STATUS",
        pipeline: {
          id: "pipe-1",
          name: "CI Build",
          phase: "running",
          url: "https://github.com/test/run/1",
          branch: "main",
          started_at_ms: 1000,
          steps: [{ name: "build", phase: "pass", duration_ms: 5000 }],
        },
      });

      const pipe = store.get(ciCdPipelineAtom);
      expect(pipe).not.toBeNull();
      expect(pipe!.phase).toBe("running");
    });
  });

  describe("SET_SECURITY_SCAN", () => {
    it("sets security scan result", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_SECURITY_SCAN",
        scan: {
          scan_id: "scan-1",
          status: "completed",
          findings: [],
          summary: { critical: 0, high: 0, medium: 0, low: 0 },
          timestamp_ms: 1000,
        },
      });

      const scan = store.get(securityScanAtom);
      expect(scan).not.toBeNull();
      expect(scan!.status).toBe("completed");
    });
  });

  describe("SET_DEPLOY_STATUS", () => {
    it("sets deploy status", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_DEPLOY_STATUS",
        deploy: {
          id: "dep-1",
          target: "preview",
          phase: "deploying",
          url: "https://preview.example.com",
          started_at_ms: 1000,
        },
      });

      expect(store.get(deployStatusAtom)!.phase).toBe("deploying");
    });
  });

  describe("PUSH_PROMPT_SUGGESTION", () => {
    it("pushes prompt suggestion", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "PUSH_PROMPT_SUGGESTION",
        suggestion: { id: "sug-1", text: "Write tests", context: "post-turn", confidence: 0.9 },
      });

      expect(store.get(promptSuggestionsAtom)).toHaveLength(1);
      expect(store.get(promptSuggestionsAtom)[0]?.text).toBe("Write tests");
    });
  });

  describe("SET_DEBUG_STATE", () => {
    it("sets debug state", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_DEBUG_STATE",
        state: {
          phase: "hypothesizing",
          hypotheses: [
            { id: "hyp-1", description: "Null ref in auth", status: "open", confidence: 0.7 },
          ],
          current_hypothesis_id: "hyp-1",
        },
      });

      const debug = store.get(debugStateAtom);
      expect(debug.phase).toBe("hypothesizing");
      expect(debug.hypotheses).toHaveLength(1);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// P2: Sandbox, Plugin, Wave, Verifier, Spec, Schedule,
//     Steer, Bugbot
// ─────────────────────────────────────────────────────────────

describe("P2 ServerEvent dispatch", () => {
  describe("SET_SANDBOX_STATUS", () => {
    it("sets sandbox status", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_SANDBOX_STATUS",
        status: {
          enabled: true,
          network_policy: "allowlist",
          allowed_hosts: ["api.github.com"],
          denied_hosts: [],
          violations: [],
        },
      });

      const sb = store.get(sandboxStatusAtom);
      expect(sb.enabled).toBe(true);
      expect(sb.allowed_hosts).toContain("api.github.com");
    });
  });

  describe("SET_PLUGIN_STATUS", () => {
    it("sets plugin list", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_PLUGIN_STATUS",
        plugins: [
          { id: "p1", name: "eslint-plugin", version: "1.0.0", phase: "installed" },
          { id: "p2", name: "prettier", version: "3.0.0", phase: "available" },
        ],
      });

      expect(store.get(pluginListAtom)).toHaveLength(2);
      expect(store.get(pluginListAtom)[0]?.name).toBe("eslint-plugin");
    });
  });

  describe("SET_AGENT_WAVE", () => {
    it("sets agent wave", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_AGENT_WAVE",
        wave: {
          wave_id: "wave-1",
          wave_number: 1,
          phase: "executing",
          agent_ids: ["a1", "a2"],
          completed_count: 0,
          total_count: 2,
          started_at_ms: 1000,
        },
      });

      const wave = store.get(agentWaveAtom);
      expect(wave).not.toBeNull();
      expect(wave!.wave_number).toBe(1);
      expect(wave!.total_count).toBe(2);
    });
  });

  describe("SET_VERIFIER_RESULT", () => {
    it("sets verifier result", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_VERIFIER_RESULT",
        result: {
          id: "vr-1",
          spec_section: "auth-flow",
          outcome: "pass",
          message: "All checks passed",
          inconsistencies: [],
          timestamp_ms: 1000,
        },
      });

      const result = store.get(verifierResultAtom);
      expect(result).not.toBeNull();
      expect(result!.outcome).toBe("pass");
      expect(result!.spec_section).toBe("auth-flow");
    });
  });

  describe("UPDATE_LIVING_SPEC", () => {
    it("sets living spec", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "UPDATE_LIVING_SPEC",
        spec: {
          id: "spec-1",
          title: "Auth Module",
          content: "## Auth Flow\nOAuth2 + JWT",
          version: 1,
          last_updated_ms: 1000,
          sections_completed: 3,
          sections_total: 5,
        },
      });

      const spec = store.get(livingSpecAtom);
      expect(spec).not.toBeNull();
      expect(spec!.title).toBe("Auth Module");
      expect(spec!.sections_completed).toBe(3);
    });
  });

  describe("SET_SESSION_SCHEDULE", () => {
    it("sets session schedules", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_SESSION_SCHEDULE",
        schedules: [
          {
            id: "sched-1",
            label: "Nightly lint",
            frequency: "daily",
            enabled: true,
            prompt: "Run lint",
            next_run_ms: 1000,
            last_run_ms: 500,
          },
        ],
      });

      expect(store.get(sessionSchedulesAtom)).toHaveLength(1);
      expect(store.get(sessionSchedulesAtom)[0]?.label).toBe("Nightly lint");
    });
  });

  describe("STEER_AGENT", () => {
    it("pushes agent steer command", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "STEER_AGENT",
        steer: {
          agent_id: "agent-1",
          action: "pause",
          reason: "High risk detected",
          timestamp_ms: 1000,
        },
      });

      expect(store.get(agentSteersAtom)).toHaveLength(1);
      expect(store.get(agentSteersAtom)[0]?.action).toBe("pause");
    });
  });

  describe("SET_BUGBOT_STATUS", () => {
    it("sets bugbot status", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_BUGBOT_STATUS",
        status: {
          phase: "scanning",
          issues: [
            {
              id: "bug-1",
              title: "Null reference",
              severity: "warning",
              file_path: "src/app.ts",
              line: 42,
              auto_fixable: true,
            },
          ],
          last_scan_ms: 1000,
        },
      });

      const bb = store.get(bugbotStatusAtom);
      expect(bb.phase).toBe("scanning");
      expect(bb.issues).toHaveLength(1);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Pipeline: Input Gate → ... → Drift Guard (Stages 0-8)
// ─────────────────────────────────────────────────────────────

describe("Pipeline ServerEvent dispatch", () => {
  describe("SET_INPUT_GATE_RESULT (Stage 0)", () => {
    it("sets input gate result", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_INPUT_GATE_RESULT",
        turn_id: TEST_TURN_ID,
        result: {
          intent_type: "bug_fix",
          risk_level: "moderate",
          change_size: "medium",
          uncertainty: "medium",
          context_signals: {
            has_repro: false,
            has_logs: true,
            has_patch_hints: false,
            pii_detected: false,
            security_sensitive: false,
          },
        },
      });

      const gate = store.get(turnPipelineAtomFamily(TEST_TURN_ID)).inputGate;
      expect(gate).not.toBeNull();
      expect(gate!.risk_level).toBe("moderate");
    });
  });

  describe("SET_FAIL_CLOSED_CONSTRAINTS (Stage 0-1)", () => {
    it("sets fail-closed constraints", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_FAIL_CLOSED_CONSTRAINTS",
        turn_id: TEST_TURN_ID,
        constraints: {
          allowed_actions: ["read", "write"],
          required_gates: ["typecheck", "lint"],
          tool_allowlist: ["bash", "edit"],
          max_side_effects: 10,
          policy_version_digest: "sha256:abc",
          ssot_digest: "sha256:def",
        },
      });

      const fc = store.get(turnPipelineAtomFamily(TEST_TURN_ID)).failClosed;
      expect(fc).not.toBeNull();
      expect(fc!.max_side_effects).toBe(10);
      expect(fc!.required_gates).toContain("typecheck");
    });
  });

  describe("SET_STRATEGY_STATE (Stage 1)", () => {
    it("sets strategy state", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_STRATEGY_STATE",
        turn_id: TEST_TURN_ID,
        state: {
          mode: "DEEP",
          strategy: "BEAM",
          budget: { time_budget_ms: 60000, solver_budget: 5, max_candidates: 3, max_depth: 4 },
          hypothesis_graph: [],
          search_depth: 2,
          candidates_evaluated: 5,
          candidates_pruned: 2,
          current_best_score: 0.85,
        },
      });

      const {strategy} = store.get(turnPipelineAtomFamily(TEST_TURN_ID));
      expect(strategy.mode).toBe("DEEP");
      expect(strategy.strategy).toBe("BEAM");
      expect(strategy.current_best_score).toBe(0.85);
    });
  });

  describe("SET_VALIDATION_STATE (Stage 5)", () => {
    it("sets validation state", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_VALIDATION_STATE",
        turn_id: TEST_TURN_ID,
        state: {
          policy_check: "pass",
          invariants: [{ id: "inv-1", invariant: "no side effects", status: "pass" }],
          risk_witnesses: [],
          equivalences: [],
          counter_examples: [],
          qapi_results: [],
          test_subset: ["test-a"],
          runner_status: "pass",
          evidence_schema_valid: true,
        },
      });

      const vs = store.get(turnPipelineAtomFamily(TEST_TURN_ID)).validation;
      expect(vs.policy_check).toBe("pass");
      expect(vs.invariants).toHaveLength(1);
    });
  });

  describe("SET_EVIDENCE_BUNDLE (Stage 6)", () => {
    it("sets evidence bundle", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_EVIDENCE_BUNDLE",
        turn_id: TEST_TURN_ID,
        bundle: {
          bundle_id: "eb-1",
          replay_key: "rk-1",
          snapshot_hash: "snap-abc",
          env_digest: "env-abc",
          policy_digest: "pol-abc",
          ssot_digest: "ssot-abc",
          patch_digest: "patch-abc",
          runner_meta_digest: "runner-abc",
          gate_passed: true,
          created_at_ms: 1000,
          decision_trace: [],
          proof_refs: ["ref-1"],
        },
      });

      const bundle = store.get(turnPipelineAtomFamily(TEST_TURN_ID)).evidenceBundle;
      expect(bundle).not.toBeNull();
      expect(bundle!.gate_passed).toBe(true);
      expect(bundle!.proof_refs).toHaveLength(1);
    });
  });

  describe("PUSH_DECISION_TRACE (Stage 6)", () => {
    it("pushes decision trace entry", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "PUSH_DECISION_TRACE",
        turn_id: TEST_TURN_ID,
        entry: {
          id: "dt-1",
          timestamp_ms: 1000,
          stage: "validation",
          decision: "approve_typecheck",
          reason: "No type errors found",
          alternatives_considered: 2,
        },
      });

      expect(store.get(turnPipelineAtomFamily(TEST_TURN_ID)).decisionTrace).toHaveLength(1);
      expect(store.get(turnPipelineAtomFamily(TEST_TURN_ID)).decisionTrace[0]?.stage).toBe(
        "validation",
      );
    });

    it("accumulates multiple trace entries", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "PUSH_DECISION_TRACE",
        turn_id: TEST_TURN_ID,
        entry: {
          id: "dt-1",
          timestamp_ms: 1000,
          stage: "input_gate",
          decision: "classify",
          reason: "r1",
          alternatives_considered: 1,
        },
      });
      dispatch({
        t: "PUSH_DECISION_TRACE",
        turn_id: TEST_TURN_ID,
        entry: {
          id: "dt-2",
          timestamp_ms: 2000,
          stage: "validation",
          decision: "typecheck",
          reason: "r2",
          alternatives_considered: 0,
        },
      });

      const trace = store.get(turnPipelineAtomFamily(TEST_TURN_ID)).decisionTrace;
      expect(trace).toHaveLength(2);
      expect(trace[0]?.id).toBe("dt-1");
      expect(trace[1]?.id).toBe("dt-2");
    });
  });

  describe("SET_EXPLAINABLE_VERDICT (Stage 7)", () => {
    it("sets explainable verdict", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_EXPLAINABLE_VERDICT",
        turn_id: TEST_TURN_ID,
        verdict: {
          chosen_action: "apply_patch",
          confidence: 0.92,
          reasons_for: [{ factor: "type_safety", impact: "positive", weight: 0.4 }],
          reasons_against: [],
          alternatives_rejected: [],
        },
      });

      const {verdict} = store.get(turnPipelineAtomFamily(TEST_TURN_ID));
      expect(verdict).not.toBeNull();
      expect(verdict!.chosen_action).toBe("apply_patch");
      expect(verdict!.confidence).toBe(0.92);
    });
  });

  describe("SET_RISK_HEATMAP (Stage 7)", () => {
    it("sets risk heatmap entries", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_RISK_HEATMAP",
        turn_id: TEST_TURN_ID,
        entries: [
          {
            file_path: "src/auth.ts",
            line_start: 1,
            line_end: 50,
            risk_level: "dangerous",
            risk_type: "security",
            description: "Auth logic",
          },
          {
            file_path: "src/utils.ts",
            line_start: 10,
            line_end: 20,
            risk_level: "safe",
            risk_type: "logic",
            description: "Helper",
          },
        ],
      });

      const entries = store.get(turnPipelineAtomFamily(TEST_TURN_ID)).riskHeatmap;
      expect(entries).toHaveLength(2);
      expect(entries[0]?.risk_level).toBe("dangerous");
    });
  });

  describe("SET_SIDE_EFFECT_BUDGET (Stage 7)", () => {
    it("sets side-effect budget", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_SIDE_EFFECT_BUDGET",
        turn_id: TEST_TURN_ID,
        budget: {
          max_side_effects: 10,
          used_side_effects: 8,
          allowed_actions: ["file_write", "bash"],
          blocked_actions: ["network"],
          budget_status: "warning",
        },
      });

      const budget = store.get(turnPipelineAtomFamily(TEST_TURN_ID)).sideEffectBudget;
      expect(budget.used_side_effects).toBe(8);
      expect(budget.budget_status).toBe("warning");
    });
  });

  describe("SET_DRIFT_GUARD_STATE (Stage 8)", () => {
    it("sets drift guard state", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_DRIFT_GUARD_STATE",
        turn_id: TEST_TURN_ID,
        state: {
          alerts: [
            {
              id: "da-1",
              type: "policy_drift",
              severity: "warning",
              description: "Policy changed",
              previous_digest: "aaa",
              current_digest: "bbb",
              requires_evidence: true,
              timestamp_ms: 1000,
            },
          ],
          policy_version: "v2",
          ssot_version: "v1",
          last_check_ms: 1000,
          gate_pass_rate: 0.95,
        },
      });

      const dg = store.get(turnPipelineAtomFamily(TEST_TURN_ID)).driftGuard;
      expect(dg.alerts).toHaveLength(1);
      expect(dg.gate_pass_rate).toBe(0.95);
    });
  });
});

// ─────────────────────────────────────────────────────────────
// SOTA: Agent Rules, Auto Context, Speculative Edit,
//       Background Jobs, Action Replay, Multi-Agent Debate
// ─────────────────────────────────────────────────────────────

describe("SOTA ServerEvent dispatch", () => {
  describe("SET_AGENT_RULES", () => {
    it("sets agent rules array", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_AGENT_RULES",
        rules: [
          {
            id: "r1",
            title: "No direct DB access",
            content: "Use ORM only",
            source: "file",
            status: "active",
            violation_count: 0,
          },
          {
            id: "r2",
            title: "Require tests",
            content: "All features need tests",
            source: "team",
            status: "active",
            violation_count: 2,
            file_path: ".claude/rules.md",
          },
        ],
      });

      const rules = store.get(agentRulesAtom);
      expect(rules).toHaveLength(2);
      expect(rules[0]?.title).toBe("No direct DB access");
      expect(rules[1]?.violation_count).toBe(2);
    });

    it("replaces on subsequent dispatch", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_AGENT_RULES",
        rules: [
          {
            id: "r1",
            title: "A",
            content: "a",
            source: "user",
            status: "active",
            violation_count: 0,
          },
        ],
      });
      dispatch({
        t: "SET_AGENT_RULES",
        rules: [
          {
            id: "r2",
            title: "B",
            content: "b",
            source: "file",
            status: "disabled",
            violation_count: 1,
          },
        ],
      });

      expect(store.get(agentRulesAtom)).toHaveLength(1);
      expect(store.get(agentRulesAtom)[0]?.id).toBe("r2");
    });
  });

  describe("PUSH_RULE_VIOLATION", () => {
    it("pushes rule violation", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "PUSH_RULE_VIOLATION",
        violation: {
          id: "rv-1",
          rule_id: "r1",
          turn_id: "t1",
          description: "Direct SQL query detected",
          severity: "error",
          timestamp_ms: 1000,
        },
      });

      const violations = store.get(ruleViolationsAtom);
      expect(violations).toHaveLength(1);
      expect(violations[0]?.severity).toBe("error");
    });

    it("accumulates multiple violations", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "PUSH_RULE_VIOLATION",
        violation: {
          id: "rv-1",
          rule_id: "r1",
          turn_id: "t1",
          description: "v1",
          severity: "warning",
          timestamp_ms: 1000,
        },
      });
      dispatch({
        t: "PUSH_RULE_VIOLATION",
        violation: {
          id: "rv-2",
          rule_id: "r1",
          turn_id: "t2",
          description: "v2",
          severity: "error",
          timestamp_ms: 2000,
        },
      });

      const violations = store.get(ruleViolationsAtom);
      expect(violations).toHaveLength(2);
      expect(violations[0]?.id).toBe("rv-1");
      expect(violations[1]?.id).toBe("rv-2");
    });
  });

  describe("SET_AUTO_CONTEXT", () => {
    it("sets auto context state", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_AUTO_CONTEXT",
        turn_id: "turn_1" as TurnId,
        state: {
          suggestions: [
            {
              id: "cs-1",
              file_path: "src/auth.ts",
              relevance_score: 0.95,
              reason: "Referenced in error",
              token_cost: 500,
              accepted: true,
            },
            {
              id: "cs-2",
              file_path: "src/utils.ts",
              relevance_score: 0.6,
              reason: "Helper dependency",
              token_cost: 200,
              accepted: false,
            },
          ],
          total_token_cost: 700,
          budget_tokens: 2000,
          status: "ready",
        },
      });

      // autoContextFamily dispatched via setAutoContextForTurnAtom
      // Verify no throw (atomFamily stores per-turn)
      expect(() =>
        dispatch({
          t: "SET_AUTO_CONTEXT",
          turn_id: "turn_1" as TurnId,
          state: { suggestions: [], total_token_cost: 0, budget_tokens: 0, status: "idle" },
        }),
      ).not.toThrow();
    });
  });

  describe("SET_SPECULATIVE_EDITS", () => {
    it("sets speculative edit state", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "SET_SPECULATIVE_EDITS",
        turn_id: "turn_1" as TurnId,
        state: {
          edits: [
            {
              id: "se-1",
              file_path: "src/app.ts",
              original_text: "const x = 1;",
              proposed_text: "const x = 2;",
              line_start: 10,
              line_end: 10,
              confidence: 0.85,
              risk_level: "safe",
              status: "pending",
            },
          ],
          status: "ready",
        },
      });

      const state = store.get(speculativeEditFamily("turn_1" as TurnId));
      expect(state.status).toBe("ready");
      expect(state.edits).toHaveLength(1);
      expect(state.edits[0]?.confidence).toBe(0.85);
    });
  });

  describe("UPSERT_BACKGROUND_JOB", () => {
    it("upserts background job", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "UPSERT_BACKGROUND_JOB",
        job: {
          id: "job-1",
          label: "Lint fix",
          phase: "running",
          progress: 50,
          created_at_ms: 1000,
          steps_completed: 2,
          steps_total: 4,
          files_changed: 3,
          cloud: false,
        },
      });

      const jobs = store.get(backgroundJobsAtom);
      expect(jobs.size).toBe(1);
      expect(jobs.get("job-1")!.phase).toBe("running");
      expect(jobs.get("job-1")!.progress).toBe(50);
    });

    it("updates existing job on re-upsert", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "UPSERT_BACKGROUND_JOB",
        job: {
          id: "job-1",
          label: "Task",
          phase: "initializing",
          progress: 0,
          created_at_ms: 1000,
          steps_completed: 0,
          steps_total: 3,
          files_changed: 0,
          cloud: true,
        },
      });
      dispatch({
        t: "UPSERT_BACKGROUND_JOB",
        job: {
          id: "job-1",
          label: "Task",
          phase: "running",
          progress: 33,
          created_at_ms: 1000,
          steps_completed: 1,
          steps_total: 3,
          files_changed: 1,
          cloud: true,
        },
      });

      const jobs = store.get(backgroundJobsAtom);
      expect(jobs.size).toBe(1);
      expect(jobs.get("job-1")!.phase).toBe("running");
      expect(jobs.get("job-1")!.progress).toBe(33);
    });
  });

  describe("REMOVE_BACKGROUND_JOB", () => {
    it("removes background job by id", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      dispatch({
        t: "UPSERT_BACKGROUND_JOB",
        job: {
          id: "job-1",
          label: "A",
          phase: "done",
          progress: 100,
          created_at_ms: 1000,
          steps_completed: 1,
          steps_total: 1,
          files_changed: 0,
          cloud: false,
        },
      });
      dispatch({
        t: "UPSERT_BACKGROUND_JOB",
        job: {
          id: "job-2",
          label: "B",
          phase: "running",
          progress: 50,
          created_at_ms: 2000,
          steps_completed: 0,
          steps_total: 1,
          files_changed: 0,
          cloud: false,
        },
      });

      expect(store.get(backgroundJobsAtom).size).toBe(2);

      dispatch({ t: "REMOVE_BACKGROUND_JOB", id: "job-1" });

      const jobs = store.get(backgroundJobsAtom);
      expect(jobs.size).toBe(1);
      expect(jobs.has("job-1")).toBe(false);
      expect(jobs.has("job-2")).toBe(true);
    });
  });

  describe("SET_REPLAY_SESSION", () => {
    it("sets replay session", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      expect(store.get(replaySessionAtom)).toBeNull();

      dispatch({
        t: "SET_REPLAY_SESSION",
        session: {
          steps: [
            {
              id: "rs-1",
              index: 0,
              type: "tool_call",
              summary: "bash: npm install",
              files_affected: ["package.json"],
              timestamp_ms: 1000,
              duration_ms: 5000,
              can_branch: true,
            },
          ],
          current_index: 0,
          total_steps: 1,
          source_turn_id: "turn-1",
          status: "playing",
          playback_speed: 1,
        },
      });

      const session = store.get(replaySessionAtom);
      expect(session).not.toBeNull();
      expect(session!.status).toBe("playing");
      expect(session!.steps).toHaveLength(1);
      expect(session!.steps[0]?.type).toBe("tool_call");
    });
  });

  describe("SET_DEBATE_SESSION", () => {
    it("sets debate session", () => {
      const store = createStore();
      const dispatch = createDispatch(store);

      expect(store.get(debateSessionFamily("turn_1" as TurnId))).toBeNull();

      dispatch({
        t: "SET_DEBATE_SESSION",
        turn_id: "turn_1" as TurnId,
        session: {
          id: "debate-1",
          prompt: "Implement auth flow",
          agents: [
            {
              id: "a1",
              model_id: "claude-4",
              label: "Agent A",
              status: "done",
              confidence: 0.85,
              files_changed: 3,
              tokens_used: 5000,
              duration_ms: 10000,
              approach_summary: "JWT-based",
            },
            {
              id: "a2",
              model_id: "claude-4",
              label: "Agent B",
              status: "done",
              confidence: 0.78,
              files_changed: 4,
              tokens_used: 6000,
              duration_ms: 12000,
              approach_summary: "Session-based",
            },
          ],
          status: "decided",
          consensus: {
            winner_id: "a1",
            method: "auto_judge",
            scores: [
              { agent_id: "a1", score: 8.5, reasoning: "Better security" },
              { agent_id: "a2", score: 7.8, reasoning: "Simpler implementation" },
            ],
            merged: false,
          },
          created_at_ms: 1000,
        },
      });

      const session = store.get(debateSessionFamily("turn_1" as TurnId));
      expect(session).not.toBeNull();
      expect(session!.status).toBe("decided");
      expect(session!.agents).toHaveLength(2);
      expect(session!.consensus!.winner_id).toBe("a1");
    });
  });
});

// ─────────────────────────────────────────────────────────────
// RESET_STORES clears all new features
// ─────────────────────────────────────────────────────────────

describe("RESET_STORES clears P0/P1/P2 + pipeline state", () => {
  it("resets all 22 new feature atoms and 10 pipeline atoms", () => {
    const store = createStore();
    const dispatch = createDispatch(store);

    // ── Populate P0
    dispatch({
      t: "APPEND_TERMINAL_OUTPUT",
      chunk: { tool_call_id: "tc", stream: "stdout", chunk: "x", timestamp_ms: 0 },
    });
    dispatch({
      t: "SET_TEST_RESULTS",
      results: {
        runner_status: "pass",
        total: 1,
        passed: 1,
        failed: 0,
        skipped: 0,
        duration_ms: 1,
        cases: [],
      },
    });
    dispatch({
      t: "SET_DIAGNOSTICS",
      file_path: "f.ts",
      diagnostics: [
        {
          id: "d",
          file_path: "f.ts",
          line: 1,
          severity: "error",
          source: "compiler",
          message: "e",
        },
      ],
    });
    dispatch({ t: "SET_QUOTA_STATUS", status: { alert_level: "critical" } });
    dispatch({
      t: "PUSH_NOTIFICATION",
      notification: {
        id: "n",
        type: "info",
        urgency: "normal",
        title: "T",
        message: "M",
        timestamp_ms: 0,
      },
    });
    dispatch({ t: "SET_AUTH_STATUS", status: { state: "authenticated" } });

    // ── Populate P1
    dispatch({
      t: "SET_HOOK_EVENT",
      event: { id: "h", hook_name: "PostToolUse", phase: "completed", timestamp_ms: 0 },
    });
    dispatch({
      t: "SET_WORKTREE_STATUS",
      worktree: { id: "w", branch: "b", path: "/p", phase: "active", created_at_ms: 0 },
    });
    dispatch({
      t: "FILE_CHANGE_EXTERNAL",
      change: { file_path: "x", change_type: "modified", timestamp_ms: 0 },
    });
    dispatch({ t: "SET_CI_CD_STATUS", pipeline: { id: "ci", name: "CI", phase: "running" } });
    dispatch({
      t: "SET_SECURITY_SCAN",
      scan: {
        scan_id: "s",
        status: "completed",
        findings: [],
        summary: { critical: 0, high: 0, medium: 0, low: 0 },
        timestamp_ms: 0,
      },
    });
    dispatch({
      t: "SET_DEPLOY_STATUS",
      deploy: { id: "d", target: "preview", phase: "live", started_at_ms: 0 },
    });
    dispatch({
      t: "PUSH_PROMPT_SUGGESTION",
      suggestion: { id: "ps", text: "t", context: "post-turn", confidence: 0.5 },
    });
    dispatch({
      t: "SET_DEBUG_STATE",
      state: {
        phase: "hypothesizing",
        hypotheses: [{ id: "h1", description: "t", status: "open", confidence: 0.5 }],
      },
    });

    // ── Populate P2
    dispatch({
      t: "SET_SANDBOX_STATUS",
      status: {
        enabled: true,
        network_policy: "block_all",
        allowed_hosts: [],
        denied_hosts: [],
        violations: [],
      },
    });
    dispatch({
      t: "SET_PLUGIN_STATUS",
      plugins: [{ id: "p", name: "n", version: "1", phase: "installed" }],
    });
    dispatch({
      t: "SET_AGENT_WAVE",
      wave: {
        wave_id: "aw",
        wave_number: 1,
        phase: "executing",
        agent_ids: [],
        completed_count: 0,
        total_count: 1,
        started_at_ms: 0,
      },
    });
    dispatch({
      t: "SET_VERIFIER_RESULT",
      result: {
        id: "vr",
        spec_section: "s",
        outcome: "pass",
        message: "ok",
        inconsistencies: [],
        timestamp_ms: 0,
      },
    });
    dispatch({
      t: "UPDATE_LIVING_SPEC",
      spec: {
        id: "ls",
        title: "t",
        content: "c",
        version: 1,
        last_updated_ms: 0,
        sections_completed: 0,
        sections_total: 1,
      },
    });
    dispatch({
      t: "SET_SESSION_SCHEDULE",
      schedules: [
        { id: "ss", label: "n", frequency: "daily", enabled: true, prompt: "p", next_run_ms: 0 },
      ],
    });
    dispatch({
      t: "STEER_AGENT",
      steer: { agent_id: "a", action: "pause", reason: "r", timestamp_ms: 0 },
    });
    dispatch({ t: "SET_BUGBOT_STATUS", status: { phase: "scanning", issues: [] } });

    // ── Populate SOTA
    dispatch({
      t: "SET_AGENT_RULES",
      rules: [
        { id: "r", title: "t", content: "c", source: "user", status: "active", violation_count: 0 },
      ],
    });
    dispatch({
      t: "PUSH_RULE_VIOLATION",
      violation: {
        id: "rv",
        rule_id: "r",
        turn_id: "t",
        description: "d",
        severity: "warning",
        timestamp_ms: 0,
      },
    });
    dispatch({
      t: "SET_AUTO_CONTEXT",
      turn_id: "t" as TurnId,
      state: {
        suggestions: [
          {
            id: "cs",
            file_path: "f",
            relevance_score: 0.9,
            reason: "r",
            token_cost: 100,
            accepted: true,
          },
        ],
        total_token_cost: 100,
        budget_tokens: 1000,
        status: "ready",
      },
    });
    dispatch({
      t: "SET_SPECULATIVE_EDITS",
      turn_id: "turn_1" as TurnId,
      state: {
        edits: [
          {
            id: "se",
            file_path: "f",
            original_text: "a",
            proposed_text: "b",
            line_start: 1,
            line_end: 1,
            confidence: 0.8,
            risk_level: "safe",
            status: "pending",
          },
        ],
        status: "ready",
      },
    });
    dispatch({
      t: "UPSERT_BACKGROUND_JOB",
      job: {
        id: "bj",
        label: "j",
        phase: "running",
        progress: 50,
        created_at_ms: 0,
        steps_completed: 1,
        steps_total: 2,
        files_changed: 1,
        cloud: false,
      },
    });
    dispatch({
      t: "SET_REPLAY_SESSION",
      session: {
        steps: [
          {
            id: "rs",
            index: 0,
            type: "tool_call",
            summary: "s",
            files_affected: [],
            timestamp_ms: 0,
            duration_ms: 100,
            can_branch: true,
          },
        ],
        current_index: 0,
        total_steps: 1,
        source_turn_id: "t",
        status: "playing",
        playback_speed: 1,
      },
    });
    dispatch({
      t: "SET_DEBATE_SESSION",
      turn_id: "turn_1" as TurnId,
      session: {
        id: "ds",
        prompt: "p",
        agents: [
          {
            id: "a",
            model_id: "m",
            label: "l",
            status: "done",
            confidence: 0.9,
            files_changed: 1,
            tokens_used: 100,
            duration_ms: 1000,
          },
        ],
        status: "decided",
        created_at_ms: 0,
      },
    });

    // ── Populate Pipeline
    dispatch({
      t: "SET_INPUT_GATE_RESULT",
      turn_id: TEST_TURN_ID,
      result: {
        intent_type: "bug_fix",
        risk_level: "moderate",
        change_size: "medium",
        uncertainty: "medium",
        context_signals: {
          has_repro: false,
          has_logs: false,
          has_patch_hints: false,
          pii_detected: false,
          security_sensitive: false,
        },
      },
    });
    dispatch({
      t: "SET_FAIL_CLOSED_CONSTRAINTS",
      turn_id: TEST_TURN_ID,
      constraints: {
        allowed_actions: [],
        required_gates: [],
        tool_allowlist: [],
        max_side_effects: 10,
        policy_version_digest: "a",
        ssot_digest: "b",
      },
    });
    dispatch({
      t: "SET_STRATEGY_STATE",
      turn_id: TEST_TURN_ID,
      state: {
        mode: "DEEP",
        strategy: "MCTS",
        budget: { time_budget_ms: 30000, solver_budget: 1, max_candidates: 1, max_depth: 1 },
        hypothesis_graph: [],
        search_depth: 1,
        candidates_evaluated: 1,
        candidates_pruned: 0,
        current_best_score: 0.9,
      },
    });
    dispatch({
      t: "SET_VALIDATION_STATE",
      turn_id: TEST_TURN_ID,
      state: {
        policy_check: "pass",
        invariants: [],
        risk_witnesses: [],
        equivalences: [],
        counter_examples: [],
        qapi_results: [],
        test_subset: [],
        runner_status: "pass",
        evidence_schema_valid: true,
      },
    });
    dispatch({
      t: "SET_EVIDENCE_BUNDLE",
      turn_id: TEST_TURN_ID,
      bundle: {
        bundle_id: "e",
        replay_key: "r",
        snapshot_hash: "s",
        env_digest: "e",
        policy_digest: "p",
        ssot_digest: "s",
        patch_digest: "pa",
        runner_meta_digest: "rm",
        gate_passed: true,
        created_at_ms: 0,
        decision_trace: [],
        proof_refs: [],
      },
    });
    dispatch({
      t: "PUSH_DECISION_TRACE",
      turn_id: TEST_TURN_ID,
      entry: {
        id: "d",
        timestamp_ms: 0,
        stage: "input_gate",
        decision: "d",
        reason: "r",
        alternatives_considered: 0,
      },
    });
    dispatch({
      t: "SET_EXPLAINABLE_VERDICT",
      turn_id: TEST_TURN_ID,
      verdict: {
        chosen_action: "apply",
        confidence: 0.9,
        reasons_for: [],
        reasons_against: [],
        alternatives_rejected: [],
      },
    });
    dispatch({
      t: "SET_RISK_HEATMAP",
      turn_id: TEST_TURN_ID,
      entries: [
        {
          file_path: "f.ts",
          line_start: 1,
          line_end: 10,
          risk_level: "safe",
          risk_type: "logic",
          description: "d",
        },
      ],
    });
    dispatch({
      t: "SET_SIDE_EFFECT_BUDGET",
      turn_id: TEST_TURN_ID,
      budget: {
        max_side_effects: 10,
        used_side_effects: 7,
        allowed_actions: [],
        blocked_actions: [],
        budget_status: "exceeded",
      },
    });
    dispatch({
      t: "SET_DRIFT_GUARD_STATE",
      turn_id: TEST_TURN_ID,
      state: {
        alerts: [
          {
            id: "a",
            type: "policy_drift",
            severity: "info",
            description: "d",
            previous_digest: "a",
            current_digest: "b",
            requires_evidence: false,
            timestamp_ms: 0,
          },
        ],
        policy_version: "v1",
        ssot_version: "v1",
        last_check_ms: 0,
        gate_pass_rate: 1.0,
      },
    });

    // ── Verify populated (assert non-default values to prevent false positives)
    expect(store.get(terminalChunksAtom).length).toBeGreaterThan(0);
    expect(store.get(notificationsAtom).length).toBeGreaterThan(0);
    expect(store.get(hookEventsAtom).length).toBeGreaterThan(0);
    const pp = store.get(turnPipelineAtomFamily(TEST_TURN_ID));
    expect(pp.inputGate).not.toBeNull();
    expect(pp.strategy.mode).toBe("DEEP"); // non-default (default: FAST)
    expect(pp.strategy.search_depth).toBe(1); // non-default (default: 0)
    expect(pp.validation.runner_status).toBe("pass"); // non-default (default: idle)
    expect(pp.sideEffectBudget.budget_status).toBe("exceeded"); // non-default (default: ok)
    expect(pp.sideEffectBudget.used_side_effects).toBe(7); // non-default (default: 0)
    expect(pp.driftGuard.alerts).toHaveLength(1); // non-default (default: [])
    expect(pp.decisionTrace).toHaveLength(1); // non-default (default: [])

    // ── RESET
    dispatch({ t: "RESET_STORES" });

    // ── Verify P0 reset
    expect(store.get(terminalChunksAtom)).toEqual([]);
    expect(store.get(testResultsAtom).runner_status).toBe("idle");
    expect(store.get(diagnosticsMapAtom).size).toBe(0);
    expect(store.get(quotaStatusAtom).alert_level).toBe("normal");
    expect(store.get(notificationsAtom)).toEqual([]);
    expect(store.get(authStatusAtom).state).toBe("unauthenticated");

    // ── Verify P1 reset
    expect(store.get(hookEventsAtom)).toEqual([]);
    expect(store.get(worktreeStatusAtom)).toBeNull();
    expect(store.get(externalChangesAtom)).toEqual([]);
    expect(store.get(ciCdPipelineAtom)).toBeNull();
    expect(store.get(securityScanAtom)).toBeNull();
    expect(store.get(deployStatusAtom)).toBeNull();
    expect(store.get(promptSuggestionsAtom)).toEqual([]);
    expect(store.get(debugStateAtom).phase).toBe("idle");

    // ── Verify P2 reset
    expect(store.get(sandboxStatusAtom).enabled).toBe(false);
    expect(store.get(pluginListAtom)).toEqual([]);
    expect(store.get(agentWaveAtom)).toBeNull();
    expect(store.get(verifierResultAtom)).toBeNull();
    expect(store.get(livingSpecAtom)).toBeNull();
    expect(store.get(sessionSchedulesAtom)).toEqual([]);
    expect(store.get(agentSteersAtom)).toEqual([]);
    expect(store.get(bugbotStatusAtom).phase).toBe("idle");

    // ── Verify SOTA reset
    expect(store.get(agentRulesAtom)).toEqual([]); // non-nullable, resets to []
    expect(store.get(ruleViolationsAtom)).toEqual([]); // push-based, resets to []
    expect(store.get(autoContextAtom).status).toBe("idle"); // non-nullable, resets to default
    expect(store.get(autoContextAtom).suggestions).toEqual([]);
    // speculativeEdit & debateSession use per-turn atomFamilies (GC'd automatically)
    expect(store.get(backgroundJobsAtom).size).toBe(0); // Map, resets to empty
    expect(store.get(replaySessionAtom)).toBeNull(); // nullable

    // ── Verify Pipeline reset (atomFamily entries cleared by resetTurnPipelineStoreAtom)
    // Each assertion tests a value that was non-default before reset
    const rp = store.get(turnPipelineAtomFamily(TEST_TURN_ID));
    expect(rp.inputGate).toBeNull(); // was: non-null
    expect(rp.failClosed).toBeNull(); // was: non-null
    expect(rp.strategy.mode).toBe("FAST"); // was: DEEP
    expect(rp.strategy.search_depth).toBe(0); // was: 1
    expect(rp.validation.runner_status).toBe("idle"); // was: pass
    expect(rp.validation.policy_check).toBe("pending"); // was: pass
    expect(rp.evidenceBundle).toBeNull(); // was: non-null
    expect(rp.decisionTrace).toEqual([]); // was: [1 entry]
    expect(rp.verdict).toBeNull(); // was: non-null
    expect(rp.riskHeatmap).toEqual([]); // was: [1 entry]
    expect(rp.sideEffectBudget.budget_status).toBe("ok"); // was: exceeded
    expect(rp.sideEffectBudget.used_side_effects).toBe(0); // was: 7
    expect(rp.driftGuard.alerts).toEqual([]); // was: [1 alert]
  });
});
