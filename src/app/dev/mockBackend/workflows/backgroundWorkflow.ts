import {
  abortableSleep,
  type AgentPersona,
  emitSummary,
  emitTurnStart,
  finalizeTurn,
  type HandlerContext,
  type MessageId,
  nextId,
  postServerEvent,
  sleep,
  type TurnId,
} from "./types";

export async function runBackgroundWorkflow(text: string, turnId: TurnId, userMsgId: MessageId, ctx: HandlerContext, persona: AgentPersona, signal: AbortSignal) {
  emitTurnStart(text, turnId, userMsgId, ctx, persona);
  await abortableSleep(200, signal);

  const jobId = nextId("job");

  // Quick response then launch background job
  await emitSummary(
    turnId,
    `## Background Task Launched\n\nJob \`${jobId}\` is now running in the background. I'll update you on progress.\n\nYou can continue working — the task won't block your session.`,
    signal, 600,
  );

  finalizeTurn(turnId, ctx);

  // Background job lifecycle (runs after turn completes — uses sleep, not abortableSleep)
  postServerEvent({ t: "SET_PROGRESS", key: `bg-${jobId}`, value: 0, max: 100, label: "Launching background job..." });
  postServerEvent({ t: "UPSERT_BACKGROUND_JOB", job: { id: jobId, label: "Background Analysis", phase: "queued", progress: 0, agent_model: "claude-sonnet-4-6", created_at_ms: Date.now(), steps_completed: 0, steps_total: 5, files_changed: 0, cloud: false } });
  await sleep(500);
  postServerEvent({ t: "UPSERT_BACKGROUND_JOB", job: { id: jobId, label: "Background Analysis", phase: "initializing", progress: 5, agent_model: "claude-sonnet-4-6", created_at_ms: Date.now(), current_step: "Setting up workspace...", steps_completed: 0, steps_total: 5, files_changed: 0, cloud: false } });
  await sleep(800);

  const steps = [
    { step: "Scanning codebase...", progress: 20, files: 0 },
    { step: "Analyzing dependencies...", progress: 40, files: 2 },
    { step: "Running linter...", progress: 60, files: 3 },
    { step: "Generating report...", progress: 80, files: 5 },
    { step: "Finalizing...", progress: 95, files: 7 },
  ];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (step === undefined) continue;
    await sleep(600);
    postServerEvent({ t: "UPSERT_BACKGROUND_JOB", job: { id: jobId, label: "Background Analysis", phase: "running", progress: step.progress, agent_model: "claude-sonnet-4-6", created_at_ms: Date.now() - 3000, current_step: step.step, steps_completed: i + 1, steps_total: 5, files_changed: step.files, cloud: false } });
  }
  await sleep(500);
  postServerEvent({ t: "UPSERT_BACKGROUND_JOB", job: { id: jobId, label: "Background Analysis", phase: "done", progress: 100, agent_model: "claude-sonnet-4-6", created_at_ms: Date.now() - 5000, completed_at_ms: Date.now(), steps_completed: 5, steps_total: 5, files_changed: 7, cloud: false, result_summary: "Completed successfully. Analyzed 45 files, found 7 improvements." } });
  postServerEvent({ t: "PUSH_NOTIFICATION", notification: { id: nextId("notif"), type: "agent_complete", urgency: "normal", title: "Background Job Done", message: "Background analysis completed. 7 files analyzed.", timestamp_ms: Date.now(), auto_dismiss_ms: 8000 } });
}
