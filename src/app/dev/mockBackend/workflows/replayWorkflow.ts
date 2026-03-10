import {
  abortableSleep,
  type AgentPersona,
  emitSummary,
  emitThinking,
  emitTurnStart,
  finalizeTurn,
  type HandlerContext,
  type MessageId,
  postServerEvent,
  type TurnId,
} from "./types";

export async function runReplayWorkflow(text: string, turnId: TurnId, userMsgId: MessageId, ctx: HandlerContext, persona: AgentPersona, signal: AbortSignal) {
  emitTurnStart(text, turnId, userMsgId, ctx, persona);
  await abortableSleep(300, signal);

  await emitThinking(turnId, `${persona.name} here. Loading action history and preparing step-by-step replay...`, "Loading replay...", signal, 600);

  // Replay session
  const session = {
    steps: [
      { id: "rs-1", index: 0, type: "user_input" as const, summary: "User asked to fix the login bug", input_snapshot: text, files_affected: [] as readonly string[], timestamp_ms: Date.now() - 30000, duration_ms: 0, can_branch: false },
      { id: "rs-2", index: 1, type: "model_response" as const, summary: "Analyzed error logs and traced to auth module", files_affected: [] as readonly string[], timestamp_ms: Date.now() - 28000, duration_ms: 2000, can_branch: true },
      { id: "rs-3", index: 2, type: "tool_call" as const, summary: "Read src/auth/login.ts (found null check issue)", files_affected: ["src/auth/login.ts"] as readonly string[], timestamp_ms: Date.now() - 25000, duration_ms: 500, can_branch: true },
      { id: "rs-4", index: 3, type: "tool_call" as const, summary: "Edit src/auth/login.ts (added null guard)", files_affected: ["src/auth/login.ts"] as readonly string[], timestamp_ms: Date.now() - 22000, duration_ms: 800, can_branch: true },
      { id: "rs-5", index: 4, type: "approval" as const, summary: "User approved file change", files_affected: ["src/auth/login.ts"] as readonly string[], timestamp_ms: Date.now() - 20000, duration_ms: 3000, can_branch: false },
      { id: "rs-6", index: 5, type: "tool_call" as const, summary: "Bash: vitest run auth.test.ts (all pass)", files_affected: ["src/auth/login.ts"] as readonly string[], timestamp_ms: Date.now() - 15000, duration_ms: 1500, can_branch: true },
      { id: "rs-7", index: 6, type: "checkpoint" as const, summary: "Checkpoint created after fix", files_affected: ["src/auth/login.ts"] as readonly string[], timestamp_ms: Date.now() - 12000, duration_ms: 200, can_branch: true },
    ],
    current_index: 0,
    total_steps: 7,
    source_turn_id: ctx.state.turnIds.at(-1) ?? turnId,
    status: "paused" as const,
    playback_speed: 1,
  };
  ctx.sotaState.replay = session;
  postServerEvent({ t: "SET_REPLAY_SESSION", session });

  // Gantt timeline of operations during replay
  const baseMs = Date.now() - 30000;
  postServerEvent({
    t: "SET_GANTT_ENTRIES",
    entries: [
      { id: "g1", tool_name: "read_file", start_ms: baseMs + 2000, end_ms: baseMs + 2500, status: "success", tool_type: "read" },
      { id: "g2", tool_name: "grep_search", start_ms: baseMs + 2200, end_ms: baseMs + 3000, status: "success", tool_type: "search" },
      { id: "g3", tool_name: "edit_file", start_ms: baseMs + 5000, end_ms: baseMs + 5800, status: "success", tool_type: "write" },
      { id: "g4", tool_name: "bash_run", start_ms: baseMs + 8000, end_ms: baseMs + 9500, status: "success", tool_type: "bash" },
      { id: "g5", tool_name: "read_file", start_ms: baseMs + 8200, end_ms: baseMs + 8600, status: "error", tool_type: "read" },
    ],
  });

  // Auto-play through steps
  for (let i = 0; i <= 6; i++) {
    await abortableSleep(500, signal);
    ctx.sotaState.replay = { ...session, current_index: i, status: i < 6 ? "playing" : "paused" };
    postServerEvent({ t: "SET_REPLAY_SESSION", session: ctx.sotaState.replay });
  }

  await emitSummary(
    turnId,
    `## Replay Complete\n\n**7 steps** replayed from the last turn:\n\n1. 1. User prompt\n2. 2. Analysis — traced to auth module\n3. 3. Read \`login.ts\` — found null check issue\n4. 4. Edit \`login.ts\` — added null guard\n5. [PASS] User approved change\n6. 6. Tests passed\n7. 7. Checkpoint created\n\n**Branch points available** at steps 2, 3, 4, 6, 7. You can branch from any of these to explore alternative approaches.`,
    signal, 1200,
  );

  finalizeTurn(turnId, ctx);
}
