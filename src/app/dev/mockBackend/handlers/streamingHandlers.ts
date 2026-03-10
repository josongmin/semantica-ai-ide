/**
 * Streaming / Core Conversation Handlers
 *
 * Covers: SEND_MESSAGE, STOP_AGENT, GRANT_APPROVAL, GRANT_APPROVAL_SANDBOX,
 *         DENY_APPROVAL, RETRY_MESSAGE, APPLY_PLAYBOOK
 *
 * These handlers manage the full turn lifecycle including abort controllers,
 * approval gates, and streaming text.
 */
import type {
  FileChange,
  MessageId,
  RiskLevel,
  TimelineEvent,
  ToolCall,
  ToolCategory,
  TurnId,
} from "../../../../shared/protocol";
import { executeWorkflow } from "../messageAnalyzer";
import {
  abortableSleep,
  nextId,
  postServerEvent,
  postServerEvents,
  streamText,
} from "../MockBackendCore";
import {
  classifyIntent,
  pickResponse,
  toProtoClassification,
  toProtoRiskLevel,
} from "../responsePool";
import { ANALYSIS_SUMMARIES, INTENT_SUMMARIES, MODEL_LABELS } from "./handlerConstants";
import type { Handler, HandlerContext } from "./index";
import { emitCompletionBatch, emitPostCompletionEvents } from "./turnCompletionEmitter";

function deriveStrategy(risk: string): "GREEDY" | "BEAM" | "MCTS" {
  if (risk === "R4") return "MCTS";
  if (risk === "R3") return "BEAM";
  return "GREEDY";
}

// ── Internal helpers ──────────────────────────────────────────

function finalizeCancelledTurn(turnId: TurnId) {
  postServerEvents([
    {
      t: "UPSERT_TURN",
      turn: { id: turnId, phases: [], status: "error", created_at_ms: Date.now() },
    },
    { t: "SET_SESSION_META", meta: { status: "idle" } },
  ]);
  // eslint-disable-next-line no-console
  console.log(`[mockBackend] Turn ${turnId} cancelled`);
}

function requestApproval(
  toolCallId: string,
  description: string,
  signal: AbortSignal,
  ctx: HandlerContext,
  riskLevel: RiskLevel = "moderate",
  supportsSandbox = false,
): Promise<boolean> {
  postServerEvent({
    t: "REQUEST_TOOL_APPROVAL",
    tool_call_id: toolCallId,
    action_id: toolCallId,
    risk_level: riskLevel,
    description,
    supports_sandbox: supportsSandbox,
  });

  return new Promise<boolean>((resolve) => {
    if (ctx.pendingApprovalResolve) ctx.pendingApprovalResolve(false);
    ctx.setPendingApprovalResolve(resolve);
    const timeout = setTimeout(() => {
      if (ctx.pendingApprovalResolve === resolve) {
        ctx.setPendingApprovalResolve(null);
        resolve(true);
      }
    }, 30_000);

    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        if (ctx.pendingApprovalResolve === resolve) {
          ctx.setPendingApprovalResolve(null);
          resolve(false);
        }
      },
      { once: true },
    );
  });
}

async function handleSendMessage(
  text: string,
  turnId: TurnId,
  userMsgId: MessageId,
  ctx: HandlerContext,
) {
  // ── Keyword-based workflow routing (demo) ───────────────────
  // If a SOTA-specific workflow matches, it handles the full turn lifecycle.
  const handled = await executeWorkflow(text, turnId, userMsgId, ctx);
  if (handled) return;

  // ── Default pipeline (general intent) ───────────────────────
  // Abort any in-flight turn
  ctx.activeAbort?.abort();
  const abort = new AbortController();
  ctx.setActiveAbort(abort);
  const { signal } = abort;

  const {state} = ctx;
  const now = Date.now();
  state.turnCounter++;

  // Classify intent and pick a response
  const classification = classifyIntent(text);
  const response = pickResponse(text);
  const hasToolCalls = (response.toolCalls?.length ?? 0) > 0;
  const hasFileChanges = (response.fileChanges?.length ?? 0) > 0;

  // Determine which phases to show based on intent
  const skipAnalysis = !hasToolCalls;
  const skipPlan = classification.changeSize === "C0";
  const skipChanges = !hasFileChanges;

  // Risk-based approval: R3+ require approval for all tool calls
  const requireApprovalForAll = classification.risk === "R3" || classification.risk === "R4";

  // Phase timing — faster for info-only intents
  const PHASE_MS = classification.changeSize === "C0" ? 500 : 800;

  try {
    // ── User message phase ────────────────────────────────────
    postServerEvents([
      {
        t: "SET_SESSION_META",
        meta: {
          status: "running",
          model_label: MODEL_LABELS[state.activeModel] ?? state.activeModel,
        },
      },
      {
        t: "UPSERT_MESSAGE",
        msg: {
          id: userMsgId,
          turn_id: turnId,
          role: "user",
          created_at_ms: now,
          text,
          status: "final",
        },
      },
      {
        t: "UPSERT_TURN",
        turn: {
          id: turnId,
          phases: [
            {
              phase: "user_message",
              message_ids: [userMsgId],
              tool_call_ids: [],
              summary: text.slice(0, 80),
              collapsed: false,
              status: "success",
            },
          ],
          status: "running",
          created_at_ms: now,
        },
      },
    ]);

    await abortableSleep(PHASE_MS / 2, signal);

    // ── Thinking phase ────────────────────────────────────────
    const thinkMsgId = nextId("msg") as MessageId;
    const thinkingText =
      response.thinkingText ??
      `\uC0AC\uC6A9\uC790\uAC00 "${text.slice(0, 40)}"\uC5D0 \uB300\uD574 \uC694\uCCAD\uD588\uC2B5\uB2C8\uB2E4. \uD504\uB85C\uC81D\uD2B8 \uAD6C\uC870\uB97C \uD655\uC778\uD558\uACE0 \uC801\uC808\uD55C \uBC29\uBC95\uC744 \uACC4\uD68D\uD558\uACA0\uC2B5\uB2C8\uB2E4...`;
    const thinkingSummary = INTENT_SUMMARIES[classification.intent];

    postServerEvents([
      {
        t: "UPSERT_MESSAGE",
        msg: {
          id: thinkMsgId,
          turn_id: turnId,
          role: "assistant",
          created_at_ms: Date.now(),
          text: "",
          status: "streaming",
        },
      },
      {
        t: "UPDATE_TURN_PHASE",
        turn_id: turnId,
        phase: "thinking",
        entry: { status: "running", summary: thinkingSummary, message_ids: [thinkMsgId] },
      },
    ]);
    await streamText(thinkMsgId, thinkingText, PHASE_MS, signal);

    // ── Emit thinking completion + InputGateResult (pipeline stage 0) ──
    const protoClassification = toProtoClassification(classification);
    postServerEvents([
      { t: "SET_MESSAGE_STATUS", id: thinkMsgId, status: "final" },
      {
        t: "UPDATE_TURN_PHASE",
        turn_id: turnId,
        phase: "thinking",
        entry: { status: "success", collapsed: true, summary: "" },
      },
      {
        t: "SET_INPUT_GATE_RESULT",
        turn_id: turnId,
        result: {
          intent_type: protoClassification.intent_type,
          risk_level: protoClassification.risk_level,
          change_size: protoClassification.change_size,
          uncertainty: protoClassification.uncertainty,
          context_signals: {
            has_repro: false,
            has_logs: classification.intent === "Q_DIAG",
            has_patch_hints: classification.intent === "Q_FIX",
            pii_detected: false,
            security_sensitive: classification.intent === "Q_SEC",
          },
        },
      },
    ]);

    // ── Emit P0 status events (auth, quota) ───────────────────
    postServerEvents([
      {
        t: "SET_AUTH_STATUS",
        status: {
          state: "authenticated",
          provider: "github",
          user_email: "dev@example.com",
          expires_at_ms: Date.now() + 3_600_000,
        },
      },
      {
        t: "SET_QUOTA_STATUS",
        status: {
          alert_level: state.costUsd > 5 ? "warning" : "normal",
          budget_usd: 10,
          spent_usd: state.costUsd,
          remaining_usd: 10 - state.costUsd,
        },
      },
    ]);

    // ── Pipeline Stage 1: Fail-Closed Constraints + Strategy ──
    postServerEvents([
      {
        t: "SET_FAIL_CLOSED_CONSTRAINTS",
        turn_id: turnId,
        constraints: {
          allowed_actions: ["read", "write", "bash"],
          required_gates: hasFileChanges ? ["typecheck", "lint", "test"] : ["lint"],
          tool_allowlist: ["Read", "Edit", "Write", "Bash", "Glob", "Grep"],
          max_side_effects: classification.risk === "R4" ? 3 : 10,
          policy_version_digest: "sha256:mock-policy-v1",
          ssot_digest: "sha256:mock-ssot-v1",
        },
      },
      {
        t: "SET_STRATEGY_STATE",
        turn_id: turnId,
        state: {
          mode: classification.changeSize === "C0" ? "FAST" : "DEEP",
          strategy: deriveStrategy(classification.risk),
          budget: {
            time_budget_ms: 30000,
            solver_budget: classification.changeSize === "C0" ? 1 : 3,
            max_candidates: classification.changeSize === "C0" ? 1 : 5,
            max_depth: 3,
          },
          hypothesis_graph: [],
          search_depth: 0,
          candidates_evaluated: 0,
          candidates_pruned: 0,
          current_best_score: 0,
        },
      },
      {
        t: "PUSH_DECISION_TRACE",
        turn_id: turnId,
        entry: {
          id: nextId("dt"),
          timestamp_ms: Date.now(),
          stage: "input_gate",
          decision: `classify_as_${classification.intent}`,
          reason: `Intent: ${classification.intent}, Risk: ${classification.risk}, Change: ${classification.changeSize}`,
          alternatives_considered: 3,
        },
      },
    ]);

    // ── P1: Worktree status (if file changes expected) ────────
    if (hasFileChanges) {
      postServerEvent({
        t: "SET_WORKTREE_STATUS",
        worktree: {
          id: nextId("wt"),
          branch: `agent/${classification.intent.toLowerCase()}`,
          path: `/tmp/worktrees/agent-${state.turnCounter}`,
          phase: "active",
          created_at_ms: Date.now(),
          base_branch: "main",
        },
      });
    }

    // ── P2: Sandbox status ────────────────────────────────────
    postServerEvent({
      t: "SET_SANDBOX_STATUS",
      status: {
        enabled: true,
        network_policy: classification.intent === "Q_SEC" ? "block_all" : "allowlist",
        allowed_hosts: ["api.github.com", "registry.npmjs.org"],
        denied_hosts: [],
        violations: [],
      },
    });

    await abortableSleep(100, signal);

    // ── HITL: User Input Request (for high-uncertainty scenarios) ──
    if (classification.uncertainty === "U2" || classification.uncertainty === "U3") {
      const userInputId = nextId("uinput");
      postServerEvent({
        t: "REQUEST_USER_INPUT",
        request: {
          id: userInputId,
          turn_id: turnId,
          question:
            classification.intent === "Q_REFACTOR"
              ? "Which refactoring approach do you prefer?"
              : "How should I handle this?",
          description:
            classification.intent === "Q_REFACTOR"
              ? "Multiple approaches are possible. Your choice affects the implementation."
              : "I need your input before proceeding.",
          response_type: "single_choice",
          choices: [
            {
              id: "opt-a",
              label: "Safe & incremental",
              description: "Minimal changes, lower risk",
              icon: "shield",
            },
            {
              id: "opt-b",
              label: "Full rewrite",
              description: "Clean architecture, more work",
              icon: "rocket",
            },
            {
              id: "opt-c",
              label: "Hybrid approach",
              description: "Best of both worlds",
              icon: "merge",
            },
          ],
          required: false,
          urgency: classification.risk === "R3" || classification.risk === "R4" ? "high" : "normal",
          created_at_ms: Date.now(),
          status: "pending",
        },
      });
    }

    // ── Analysis phase (with tool calls) ──────────────────────
    if (!skipAnalysis) {
      postServerEvent({
        t: "UPDATE_TURN_PHASE",
        turn_id: turnId,
        phase: "analysis",
        entry: {
          status: "running",
          summary: ANALYSIS_SUMMARIES[classification.intent] ?? "Analyzing...",
        },
      });

      const toolCalls = response.toolCalls!;
      for (const tc of toolCalls) {
        if (signal.aborted) return;
        const toolCallId = nextId("tc");

        // Check approval: auto mode + write, or R3+ for all tool calls
        const needsApproval =
          (state.approvalMode === "auto" && tc.category === "write") ||
          (requireApprovalForAll && state.approvalMode !== "auto");

        if (needsApproval) {
          const protoRisk = toProtoRiskLevel(classification.risk);
          const isSandboxable =
            tc.category === "terminal" || tc.category === "write" || tc.category === "delete";
          const approved = await requestApproval(
            toolCallId,
            `${tc.tool_name}: ${tc.args_summary}`,
            signal,
            ctx,
            protoRisk,
            isSandboxable,
          );
          if (!approved) {
            postServerEvent({
              t: "UPDATE_TOOL_CALL_STATUS",
              id: toolCallId,
              status: "error",
              result_summary: "User denied",
            });
            continue;
          }
        }

        const toolCall: ToolCall = {
          id: toolCallId,
          turn_id: turnId,
          tool_name: tc.tool_name,
          category: tc.category as ToolCategory,
          args_summary: tc.args_summary,
          status: "running",
          duration_ms: 0,
        };
        postServerEvents([
          { t: "UPSERT_TOOL_CALL", tool_call: toolCall },
          {
            t: "PUSH_TIMELINE",
            event: {
              id: nextId("evt"),
              turn_id: turnId,
              type: "tool_call_start",
              timestamp_ms: Date.now(),
              summary: `${tc.tool_name}: ${tc.args_summary}`,
            } as TimelineEvent,
          },
        ]);

        await abortableSleep(tc.duration_ms + 100, signal);

        postServerEvents([
          {
            t: "UPDATE_TOOL_CALL_STATUS",
            id: toolCallId,
            status: "success",
            result_summary: tc.result_summary,
            duration_ms: tc.duration_ms,
          },
          {
            t: "PUSH_TIMELINE",
            event: {
              id: nextId("evt"),
              turn_id: turnId,
              type: "tool_call_end",
              timestamp_ms: Date.now(),
              summary: `${tc.tool_name} completed (${tc.duration_ms}ms)`,
            } as TimelineEvent,
          },
        ]);
      }

      postServerEvent({
        t: "UPDATE_TURN_PHASE",
        turn_id: turnId,
        phase: "analysis",
        entry: {
          status: "success",
          summary: `${toolCalls.length} tool calls completed`,
          collapsed: true,
        },
      });

      // ── Emit mock diagnostics for diag/sec intents ──────────
      if (classification.intent === "Q_DIAG" || classification.intent === "Q_SEC") {
        postServerEvent({
          t: "SET_DIAGNOSTICS",
          file_path: "src/components/Button.tsx",
          diagnostics: [
            {
              id: nextId("diag"),
              file_path: "src/components/Button.tsx",
              line: 15,
              severity: "warning",
              source: "type_checker",
              message: "Possible stale closure in useCallback",
            },
          ],
        });
      }

      // ── Emit mock security scan for Q_SEC ────────────────────
      if (classification.intent === "Q_SEC") {
        postServerEvent({
          t: "SET_SECURITY_SCAN",
          scan: {
            scan_id: nextId("scan"),
            status: "completed",
            findings: [
              {
                id: nextId("finding"),
                scan_type: "code",
                severity: "medium",
                title: "Potential XSS",
                description: "dangerouslySetInnerHTML usage detected",
                file_path: "src/widgets/message-row/MessageRow.tsx",
                line: 45,
              },
            ],
            summary: { critical: 0, high: 0, medium: 1, low: 0 },
            timestamp_ms: Date.now(),
          },
        });
      }

      // ── Emit mock terminal output for fix/refactor intents ──
      if (classification.intent === "Q_FIX" || classification.intent === "Q_REFACTOR") {
        postServerEvent({
          t: "APPEND_TERMINAL_OUTPUT",
          chunk: {
            tool_call_id: toolCalls[0] ? nextId("tc") : "mock-tc",
            stream: "stdout",
            chunk: "$ npm run build\n\u2713 Build succeeded in 1.2s\n",
            timestamp_ms: Date.now(),
          },
        });
      }

      // ── Pipeline Stage 5: Validation after analysis ──────────
      postServerEvents([
        {
          t: "SET_VALIDATION_STATE",
          turn_id: turnId,
          state: {
            policy_check: "pass",
            invariants: [{ id: nextId("inv"), invariant: "no_forbidden_paths", status: "pass" }],
            risk_witnesses: [],
            equivalences: [],
            counter_examples: [],
            qapi_results: [],
            test_subset: hasFileChanges ? ["unit", "integration"] : [],
            runner_status: "pass",
            evidence_schema_valid: true,
          },
        },
        {
          t: "PUSH_DECISION_TRACE",
          turn_id: turnId,
          entry: {
            id: nextId("dt"),
            timestamp_ms: Date.now(),
            stage: "validation",
            decision: "all_gates_passed",
            reason: `${toolCalls.length} tool calls validated successfully`,
            alternatives_considered: 0,
          },
        },
      ]);

      // ── P1: CI/CD status for intents with changes ────────────
      if (hasFileChanges) {
        postServerEvent({
          t: "SET_CI_CD_STATUS",
          pipeline: {
            id: nextId("ci"),
            name: "Agent CI Check",
            phase: "running",
            branch: `agent/${classification.intent.toLowerCase()}`,
            started_at_ms: Date.now(),
            steps: [
              { name: "typecheck", phase: "pass", duration_ms: 1200 },
              { name: "lint", phase: "pass", duration_ms: 800 },
              { name: "test", phase: "running" },
            ],
          },
        });
      }

      // ── P2: Debug state for diagnostic intents ───────────────
      if (classification.intent === "Q_DIAG" || classification.intent === "Q_FIX") {
        postServerEvent({
          t: "SET_DEBUG_STATE",
          state: {
            phase: "hypothesizing",
            hypotheses: [
              {
                id: nextId("hyp"),
                description: "Stale closure in event handler",
                status: "open",
                confidence: 0.7,
              },
              {
                id: nextId("hyp"),
                description: "Missing dependency in useEffect",
                status: "open",
                confidence: 0.5,
              },
            ],
          },
        });
      }

      await abortableSleep(100, signal);
    }

    // ── Plan phase (skipped for C0 / info-only intents) ───────
    if (!skipPlan) {
      const planMsgId = nextId("msg") as MessageId;
      const planText =
        response.planSteps ??
        "1. Analyze the codebase\n2. Implement changes\n3. Verify correctness";

      postServerEvents([
        {
          t: "UPSERT_MESSAGE",
          msg: {
            id: planMsgId,
            turn_id: turnId,
            role: "assistant",
            created_at_ms: Date.now(),
            text: "",
            status: "streaming",
          },
        },
        {
          t: "UPDATE_TURN_PHASE",
          turn_id: turnId,
          phase: "plan",
          entry: { status: "running", message_ids: [planMsgId], summary: "Planning..." },
        },
      ]);
      await streamText(planMsgId, planText, PHASE_MS / 2, signal);
      postServerEvents([
        { t: "SET_MESSAGE_STATUS", id: planMsgId, status: "final" },
        {
          t: "UPDATE_TURN_PHASE",
          turn_id: turnId,
          phase: "plan",
          entry: { status: "success", collapsed: true, summary: "" },
        },
      ]);
      await abortableSleep(100, signal);
    }

    // ── Changes phase (with file changes) ─────────────────────
    if (!skipChanges) {
      postServerEvent({
        t: "UPDATE_TURN_PHASE",
        turn_id: turnId,
        phase: "changes",
        entry: { status: "running", summary: "Writing files..." },
      });

      for (const fc of response.fileChanges!) {
        if (signal.aborted) return;
        const fileChange: FileChange = {
          file_path: fc.file_path,
          turn_id: turnId,
          status: fc.status,
          insertions: fc.insertions,
          deletions: fc.deletions,
          approval_status: "pending",
        };
        postServerEvents([
          { t: "UPSERT_FILE_CHANGE", file_change: fileChange },
          {
            t: "PUSH_TIMELINE",
            event: {
              id: nextId("evt"),
              turn_id: turnId,
              type: fc.status === "added" ? "file_created" : "file_modified",
              timestamp_ms: Date.now(),
              summary: `${fc.status === "added" ? "Created" : "Modified"} ${fc.file_path}`,
            } as TimelineEvent,
          },
        ]);
        await abortableSleep(200, signal);
      }

      const totalInsert = response.fileChanges!.reduce((s, f) => s + f.insertions, 0);
      const totalDelete = response.fileChanges!.reduce((s, f) => s + f.deletions, 0);
      postServerEvent({
        t: "UPDATE_TURN_PHASE",
        turn_id: turnId,
        phase: "changes",
        entry: {
          status: "success",
          summary: `${response.fileChanges!.length} files changed (+${totalInsert}, -${totalDelete})`,
          collapsed: false,
        },
      });
      // ── Pipeline Stage 6: Evidence bundle after changes ───────
      postServerEvents([
        {
          t: "SET_EVIDENCE_BUNDLE",
          turn_id: turnId,
          bundle: {
            bundle_id: nextId("eb"),
            replay_key: `replay-${turnId}`,
            snapshot_hash: `snap-${Date.now()}`,
            env_digest: "sha256:mock-env",
            policy_digest: "sha256:mock-policy-v1",
            ssot_digest: "sha256:mock-ssot-v1",
            patch_digest: `sha256:patch-${turnId}`,
            runner_meta_digest: "sha256:mock-runner",
            gate_passed: true,
            created_at_ms: Date.now(),
            decision_trace: [],
            proof_refs: [],
          },
        },
        {
          t: "PUSH_DECISION_TRACE",
          turn_id: turnId,
          entry: {
            id: nextId("dt"),
            timestamp_ms: Date.now(),
            stage: "evidence",
            decision: "bundle_created",
            reason: `${response.fileChanges!.length} file changes bundled with evidence`,
            alternatives_considered: 0,
          },
        },
      ]);

      // ── P1: External file change notification ─────────────────
      postServerEvent({
        t: "FILE_CHANGE_EXTERNAL",
        change: {
          file_path: response.fileChanges?.[0]?.file_path ?? "",
          change_type: "modified",
          timestamp_ms: Date.now(),
          detail: "Agent modified file",
        },
      });

      // ── P1: Deploy status (preview) ────────────────────────────
      postServerEvent({
        t: "SET_DEPLOY_STATUS",
        deploy: {
          id: nextId("dep"),
          target: "preview",
          phase: "deploying",
          url: `https://preview-${state.turnCounter}.example.com`,
          started_at_ms: Date.now(),
        },
      });

      await abortableSleep(100, signal);
    }

    // ── Summary phase ─────────────────────────────────────────
    const summaryMsgId = nextId("msg") as MessageId;
    postServerEvents([
      {
        t: "UPSERT_MESSAGE",
        msg: {
          id: summaryMsgId,
          turn_id: turnId,
          role: "assistant",
          created_at_ms: Date.now(),
          text: "",
          status: "streaming",
        },
      },
      {
        t: "UPDATE_TURN_PHASE",
        turn_id: turnId,
        phase: "summary",
        entry: { status: "running", message_ids: [summaryMsgId] },
      },
    ]);
    await streamText(summaryMsgId, response.text, PHASE_MS * 2, signal);

    // ── Emit turn completion batch ────────────────────────────
    emitCompletionBatch(turnId, summaryMsgId, classification, response, hasFileChanges, state);

    if (signal.aborted) return;

    // ── Emit post-completion pipeline events + finalize turn ──
    emitPostCompletionEvents(
      turnId,
      classification,
      response,
      hasFileChanges,
      state,
      PHASE_MS,
      now,
    );
  } catch {
    // AbortError — turn was stopped
    finalizeCancelledTurn(turnId);
  } finally {
    if (ctx.activeAbort === abort) {
      ctx.setActiveAbort(null);
    }
  }
}

function handleStopAgent(ctx: HandlerContext) {
  if (ctx.activeAbort) {
    ctx.activeAbort.abort();
    ctx.setActiveAbort(null);
  }
  postServerEvent({ t: "SET_SESSION_META", meta: { status: "idle" } });
}

// ── Registration ──────────────────────────────────────────────

export function registerStreamingHandlers(registry: Map<string, Handler>): void {
  registry.set("SEND_MESSAGE", (msg, ctx) => {
    void handleSendMessage(msg.text, msg.turn_id as TurnId, msg.message_id as MessageId, ctx);
  });

  registry.set("STOP_AGENT", (_msg, ctx) => {
    handleStopAgent(ctx);
  });

  registry.set("GRANT_APPROVAL", (_msg, ctx) => {
    ctx.pendingApprovalResolve?.(true);
    ctx.setPendingApprovalResolve(null);
  });

  registry.set("GRANT_APPROVAL_SANDBOX", (_msg, ctx) => {
    ctx.pendingApprovalResolve?.(true);
    ctx.setPendingApprovalResolve(null);
  });

  registry.set("DENY_APPROVAL", (_msg, ctx) => {
    ctx.pendingApprovalResolve?.(false);
    ctx.setPendingApprovalResolve(null);
  });

  registry.set("RETRY_MESSAGE", (_msg, ctx) => {
    void handleSendMessage("Retry requested", nextId("turn") as TurnId, nextId("msg") as MessageId, ctx);
  });

  registry.set("APPLY_PLAYBOOK", (msg, ctx) => {
    // eslint-disable-next-line no-console
    console.log(`[mockBackend] Applying playbook ${msg.playbook_id}`);
    void handleSendMessage(
      `[Playbook ${msg.playbook_id}] Executing automated steps...`,
      nextId("turn") as TurnId,
      nextId("msg") as MessageId,
      ctx,
    );
  });
}
