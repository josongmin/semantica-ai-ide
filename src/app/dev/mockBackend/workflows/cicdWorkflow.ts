import type { GitCommitId, RemoteCommandId } from "../../../../shared/protocol";
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

export async function runCicdWorkflow(
  text: string,
  turnId: TurnId,
  userMsgId: MessageId,
  ctx: HandlerContext,
  persona: AgentPersona,
  signal: AbortSignal,
) {
  emitTurnStart(text, turnId, userMsgId, ctx, persona);
  await abortableSleep(300, signal);

  await emitThinking(
    turnId,
    `${persona.name} here. Triggering the CI/CD pipeline and monitoring each stage...`,
    "Starting pipeline...",
    signal,
    600,
  );

  // CI/CD pipeline stages
  const pipelineId = nextId("ci");
  postServerEvent({
    t: "SET_CI_CD_STATUS",
    pipeline: {
      id: pipelineId,
      name: "Main Pipeline",
      phase: "running",
      branch: "feature/demo",
      commit_sha: "abc1234",
      started_at_ms: Date.now(),
      steps: [
        { name: "install", phase: "running" },
        { name: "typecheck", phase: "queued" },
        { name: "lint", phase: "queued" },
        { name: "test", phase: "queued" },
        { name: "build", phase: "queued" },
      ],
    },
  });
  await abortableSleep(600, signal);

  postServerEvent({
    t: "SET_CI_CD_STATUS",
    pipeline: {
      id: pipelineId,
      name: "Main Pipeline",
      phase: "running",
      branch: "feature/demo",
      commit_sha: "abc1234",
      started_at_ms: Date.now() - 600,
      steps: [
        { name: "install", phase: "pass", duration_ms: 580 },
        { name: "typecheck", phase: "running" },
        { name: "lint", phase: "queued" },
        { name: "test", phase: "queued" },
        { name: "build", phase: "queued" },
      ],
    },
  });
  await abortableSleep(500, signal);

  postServerEvent({
    t: "SET_CI_CD_STATUS",
    pipeline: {
      id: pipelineId,
      name: "Main Pipeline",
      phase: "running",
      branch: "feature/demo",
      commit_sha: "abc1234",
      started_at_ms: Date.now() - 1100,
      steps: [
        { name: "install", phase: "pass", duration_ms: 580 },
        { name: "typecheck", phase: "pass", duration_ms: 1200 },
        { name: "lint", phase: "pass", duration_ms: 800 },
        { name: "test", phase: "running" },
        { name: "build", phase: "queued" },
      ],
    },
  });
  await abortableSleep(800, signal);

  postServerEvent({
    t: "SET_CI_CD_STATUS",
    pipeline: {
      id: pipelineId,
      name: "Main Pipeline",
      phase: "pass",
      branch: "feature/demo",
      commit_sha: "abc1234",
      started_at_ms: Date.now() - 2900,
      finished_at_ms: Date.now(),
      steps: [
        { name: "install", phase: "pass", duration_ms: 580 },
        { name: "typecheck", phase: "pass", duration_ms: 1200 },
        { name: "lint", phase: "pass", duration_ms: 800 },
        { name: "test", phase: "pass", duration_ms: 3450 },
        { name: "build", phase: "pass", duration_ms: 2100 },
      ],
    },
  });

  // Deploy
  postServerEvent({
    t: "SET_DEPLOY_STATUS",
    deploy: {
      id: nextId("dep"),
      target: "preview",
      phase: "deploying",
      url: "https://preview-42.example.com",
      started_at_ms: Date.now(),
    },
  });

  // Preview state
  postServerEvent({
    t: "SET_PREVIEW_STATE",
    state: {
      url: "https://preview-42.example.com",
      status: "updating",
      last_update_ms: Date.now(),
    },
  });
  await abortableSleep(800, signal);
  postServerEvent({
    t: "SET_PREVIEW_STATE",
    state: {
      url: "https://preview-42.example.com",
      status: "connected",
      last_update_ms: Date.now(),
    },
  });

  postServerEvent({
    t: "SET_DEPLOY_STATUS",
    deploy: {
      id: nextId("dep"),
      target: "preview",
      phase: "live",
      url: "https://preview-42.example.com",
      health_check_passed: true,
      started_at_ms: Date.now() - 800,
      finished_at_ms: Date.now(),
    },
  });

  // Remote command pushed to deploy agent
  postServerEvent({
    t: "PUSH_REMOTE_COMMAND",
    command: {
      id: nextId("rcmd") as RemoteCommandId,
      text: "deploy --target preview --branch feature/demo",
      received_at_ms: Date.now(),
      executed: true,
      source: "ci-pipeline",
    },
  });

  // Git commit
  postServerEvent({
    t: "PUSH_GIT_COMMIT",
    commit: {
      id: nextId("gc") as GitCommitId,
      sha: "abc1234",
      message: "feat: implement demo workflow",
      timestamp_ms: Date.now(),
      auto: true,
    },
  });

  await emitSummary(
    turnId,
    `## CI/CD Complete\n\n### Pipeline: All Green [PASS]\n\n| Stage | Status | Duration |\n|-------|:------:|----------|\n| Install | [PASS] | 580ms |\n| Typecheck | [PASS] | 1.2s |\n| Lint | [PASS] | 800ms |\n| Test | [PASS] | 3.5s |\n| Build | [PASS] | 2.1s |\n\n### Deploy\n- **Preview:** [preview-42.example.com](https://preview-42.example.com) [LIVE] Live\n- **Health check:** Passed\n- **Commit:** \`abc1234\` — "feat: implement demo workflow"\n\nReady to promote to staging or production.`,
    signal,
    1500,
  );

  postServerEvents([
    {
      t: "PUSH_PROMPT_SUGGESTION",
      suggestion: { id: nextId("sug"), text: "Deploy to production", confidence: 0.7 },
    },
    {
      t: "PUSH_NOTIFICATION",
      notification: {
        id: nextId("notif"),
        type: "agent_complete",
        urgency: "normal",
        title: "Deploy Live",
        message: "Preview deployment is live",
        timestamp_ms: Date.now(),
        auto_dismiss_ms: 5000,
      },
    },
  ]);

  finalizeTurn(turnId, ctx);
}
