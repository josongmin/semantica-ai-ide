import type {
  FileChange,
  TimelineEvent,
  ToolCall,
  UiMessage,
} from "../../../shared/protocol";
import {
  nextId,
  nextMsgId,
  nextTurnId,
  postServerEvent,
  postServerEvents,
  sleep,
  streamText,
} from "../devUtils";

export async function streamTurn(durationSec = 5) {
  const turnId = nextTurnId();
  const phaseTime = (durationSec * 1000) / 6;
  const now = Date.now();

  const userMsgId = nextMsgId();
  const userMsg: UiMessage = {
    id: userMsgId,
    turn_id: turnId,
    role: "user",
    created_at_ms: now,
    text: "Implement a REST API endpoint for user authentication with JWT tokens",
    status: "final",
  };

  const turn = {
    id: turnId,
    phases: [
      {
        phase: "user_message" as const,
        message_ids: [userMsgId],
        tool_call_ids: [],
        summary: userMsg.text.slice(0, 80),
        collapsed: false,
        status: "success" as const,
      },
    ],
    status: "running" as const,
    created_at_ms: now,
  };

  postServerEvents([
    {
      t: "SET_SESSION_META",
      meta: { status: "running", model_label: "Claude Opus 4", model_id: "claude-opus-4-6" },
    },
    { t: "UPSERT_MESSAGE", msg: userMsg },
    { t: "UPSERT_TURN", turn },
  ]);
  await sleep(phaseTime);

  // Phase 1: thinking
  const thinkMsgId = nextMsgId();
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
      entry: { status: "running", summary: "Analyzing requirements..." },
    },
  ]);
  await streamText(
    thinkMsgId,
    "I need to create a JWT authentication endpoint. Let me analyze the project structure first, then implement the auth route with proper validation...",
    phaseTime,
  );
  postServerEvent({ t: "SET_MESSAGE_STATUS", id: thinkMsgId, status: "final" });
  postServerEvent({
    t: "UPDATE_TURN_PHASE",
    turn_id: turnId,
    phase: "thinking",
    entry: { status: "success", collapsed: true, duration_ms: Math.round(phaseTime) },
  });
  await sleep(100);

  // Phase 2: analysis
  postServerEvent({
    t: "UPDATE_TURN_PHASE",
    turn_id: turnId,
    phase: "analysis",
    entry: { status: "running", summary: "Reading project files..." },
  });
  const toolCalls: ToolCall[] = [
    {
      id: nextId("tc"),
      turn_id: turnId,
      tool_name: "read_file",
      category: "read",
      args_summary: "src/routes/index.ts",
      status: "success",
      result_summary: "Found 12 routes",
      duration_ms: 45,
    },
    {
      id: nextId("tc"),
      turn_id: turnId,
      tool_name: "read_file",
      category: "read",
      args_summary: "src/middleware/auth.ts",
      status: "success",
      result_summary: "Existing auth middleware",
      duration_ms: 32,
    },
    {
      id: nextId("tc"),
      turn_id: turnId,
      tool_name: "search_files",
      category: "search",
      args_summary: "pattern: 'jwt'",
      status: "success",
      result_summary: "3 matches found",
      duration_ms: 120,
    },
  ];
  for (const tc of toolCalls) {
    postServerEvent({ t: "UPSERT_TOOL_CALL", tool_call: { ...tc, status: "running" } });
    const evt: TimelineEvent = {
      id: nextId("evt"),
      turn_id: turnId,
      type: "tool_call_start",
      timestamp_ms: Date.now(),
      summary: `${tc.tool_name}: ${tc.args_summary}`,
    };
    postServerEvent({ t: "PUSH_TIMELINE", event: evt });
    await sleep(phaseTime / toolCalls.length / 2);
    postServerEvent({
      t: "UPDATE_TOOL_CALL_STATUS",
      id: tc.id,
      status: "success",
      result_summary: tc.result_summary,
      duration_ms: tc.duration_ms,
    });
    const endEvt: TimelineEvent = {
      id: nextId("evt"),
      turn_id: turnId,
      type: "tool_call_end",
      timestamp_ms: Date.now(),
      summary: `${tc.tool_name} completed (${tc.duration_ms}ms)`,
    };
    postServerEvent({ t: "PUSH_TIMELINE", event: endEvt });
    await sleep(phaseTime / toolCalls.length / 2);
  }
  postServerEvent({
    t: "UPDATE_TURN_PHASE",
    turn_id: turnId,
    phase: "analysis",
    entry: {
      status: "success",
      summary: `${toolCalls.length} tool calls completed`,
      collapsed: true,
      duration_ms: Math.round(phaseTime),
    },
  });

  // Phase 3: plan
  const planMsgId = nextMsgId();
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
      entry: {
        status: "running",
        message_ids: [planMsgId],
        summary: "Planning implementation...",
      },
    },
  ]);
  await streamText(
    planMsgId,
    "1. Create auth route handler\n2. Add JWT token generation\n3. Add password validation\n4. Update route index\n5. Add tests",
    phaseTime,
  );
  postServerEvent({ t: "SET_MESSAGE_STATUS", id: planMsgId, status: "final" });
  postServerEvent({
    t: "UPDATE_TURN_PHASE",
    turn_id: turnId,
    phase: "plan",
    entry: { status: "success", collapsed: true, duration_ms: Math.round(phaseTime) },
  });
  await sleep(100);

  // Phase 4: changes
  postServerEvent({
    t: "UPDATE_TURN_PHASE",
    turn_id: turnId,
    phase: "changes",
    entry: { status: "running", summary: "Writing files..." },
  });
  const fileChanges: FileChange[] = [
    { file_path: "src/routes/auth.ts", turn_id: turnId, status: "added", insertions: 45, deletions: 0, approval_status: "pending" },
    { file_path: "src/middleware/jwt.ts", turn_id: turnId, status: "added", insertions: 28, deletions: 0, approval_status: "pending" },
    { file_path: "src/routes/index.ts", turn_id: turnId, status: "modified", insertions: 3, deletions: 1, approval_status: "pending" },
    { file_path: "src/types/auth.ts", turn_id: turnId, status: "added", insertions: 12, deletions: 0, approval_status: "pending" },
  ];
  const writeToolCalls: ToolCall[] = [
    { id: nextId("tc"), turn_id: turnId, tool_name: "write_file", category: "write", args_summary: "src/routes/auth.ts", status: "success", duration_ms: 15 },
    { id: nextId("tc"), turn_id: turnId, tool_name: "write_file", category: "write", args_summary: "src/middleware/jwt.ts", status: "success", duration_ms: 12 },
    { id: nextId("tc"), turn_id: turnId, tool_name: "write_file", category: "write", args_summary: "src/routes/index.ts", status: "success", duration_ms: 8 },
    { id: nextId("tc"), turn_id: turnId, tool_name: "write_file", category: "write", args_summary: "src/types/auth.ts", status: "success", duration_ms: 10 },
  ];
  for (let i = 0; i < fileChanges.length; i++) {
    const fc = fileChanges[i];
    const tc = writeToolCalls[i];
    if (fc === undefined || tc === undefined) continue;
    postServerEvent({ t: "UPSERT_FILE_CHANGE", file_change: fc });
    postServerEvent({ t: "UPSERT_TOOL_CALL", tool_call: tc });
    const evt: TimelineEvent = {
      id: nextId("evt"),
      turn_id: turnId,
      type: "file_created",
      timestamp_ms: Date.now(),
      summary: `Created ${fc.file_path}`,
    };
    postServerEvent({ t: "PUSH_TIMELINE", event: evt });
    await sleep(phaseTime / fileChanges.length);
  }
  postServerEvent({
    t: "UPDATE_TURN_PHASE",
    turn_id: turnId,
    phase: "changes",
    entry: {
      status: "success",
      summary: `${fileChanges.length} files changed (+88, -1)`,
      collapsed: false,
      duration_ms: Math.round(phaseTime),
    },
  });

  // Phase 5: summary
  const summaryMsgId = nextMsgId();
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
  await streamText(
    summaryMsgId,
    "I've implemented the JWT authentication endpoint with the following changes:\n\n• Created `src/routes/auth.ts` with login/register handlers\n• Added `src/middleware/jwt.ts` for token generation and validation\n• Updated `src/routes/index.ts` to register the auth routes\n• Created `src/types/auth.ts` with TypeScript interfaces\n\nThe endpoint supports POST /auth/login and POST /auth/register.",
    phaseTime,
  );
  postServerEvent({ t: "SET_MESSAGE_STATUS", id: summaryMsgId, status: "final" });
  postServerEvent({
    t: "UPDATE_TURN_PHASE",
    turn_id: turnId,
    phase: "summary",
    entry: { status: "success" },
  });

  postServerEvents([
    { t: "UPSERT_TURN", turn: { id: turnId, phases: [], status: "success", created_at_ms: now } },
    {
      t: "SET_SESSION_META",
      meta: { status: "idle", cost_usd: 0.0234, tokens_in: 4521, tokens_out: 1832 },
    },
    {
      t: "ADD_CHECKPOINT",
      checkpoint: {
        id: nextId("cp"),
        turn_id: turnId,
        label: "Auth endpoint",
        timestamp_ms: Date.now(),
      },
    },
  ]);
  // eslint-disable-next-line no-console
  console.log(`[dev] Turn ${turnId} completed in ${durationSec}s`);
}

export async function stream1000cps(durationSec = 10) {
  const turnId = nextTurnId();
  const msgId = nextMsgId();
  const now = Date.now();

  postServerEvents([
    { t: "SET_SESSION_META", meta: { status: "running", model_label: "Load Test" } },
    {
      t: "UPSERT_TURN",
      turn: {
        id: turnId,
        phases: [
          {
            phase: "summary",
            message_ids: [msgId],
            tool_call_ids: [],
            summary: "Streaming test",
            collapsed: false,
            status: "running",
          },
        ],
        status: "running",
        created_at_ms: now,
      },
    },
    {
      t: "UPSERT_MESSAGE",
      msg: {
        id: msgId,
        turn_id: turnId,
        role: "assistant",
        created_at_ms: now,
        text: "",
        status: "streaming",
      },
    },
  ]);

  const charsPerChunk = 20;
  const chunksPerSec = 1000 / charsPerChunk;
  const intervalMs = 1000 / chunksPerSec;
  const totalChunks = (durationSec * 1000) / intervalMs;
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789 ";

  for (let i = 0; i < totalChunks; i++) {
    let chunk = "";
    for (let j = 0; j < charsPerChunk; j++) {
      chunk += chars[Math.floor(Math.random() * chars.length)] ?? "";
    }
    if (i > 0 && i % 50 === 0) chunk += "\n";
    postServerEvent({ t: "APPEND_TEXT", id: msgId, chunk });
    await sleep(intervalMs);
  }

  postServerEvents([
    { t: "SET_MESSAGE_STATUS", id: msgId, status: "final" },
    { t: "SET_SESSION_META", meta: { status: "idle" } },
  ]);
  // eslint-disable-next-line no-console
  console.log(`[dev] stream1000cps completed. Check window.__perf.snapshot()`);
}
