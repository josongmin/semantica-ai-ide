import type {
  AgentInstanceId,
  CompletionSettings,
  ElementMapping,
  McpServerId,
  McpToolCallId,
  MemoryRuleId,
  ProjectTodoId,
  ReviewCommentId,
  SessionId,
  ShareLink,
  ThreeWayDiffData,
  TurnId,
} from "../../../shared/protocol";
import {
  nextId,
  nextMsgId,
  nextTurnId,
  postServerEvent,
  postServerEvents,
  sleep,
  STAGE_DELAY,
} from "../devUtils";

/** Tool Approval scenario: SET_APPROVAL_MODE, SET_CATEGORY_PERMISSIONS, SET_QUOTE_CONTEXT,
 *  REQUEST_TOOL_APPROVAL, SET_TOOL_OUTPUT, SET_DIFF_LOADED, UPSERT_MCP_TOOL_CALL */
export async function simScenarioToolApproval() {
  const now = Date.now();
  const turnId = nextTurnId();
  const userMsgId = nextMsgId();
  const tcId = nextId("tc");

  postServerEvents([
    { t: "SET_SESSION_META", meta: { status: "running", model_label: "Tool Approval Sim" } },
    {
      t: "UPSERT_MESSAGE",
      msg: {
        id: userMsgId,
        turn_id: turnId,
        role: "user",
        created_at_ms: now,
        text: " 파일 수정해줘 (approval 테스트)",
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
            summary: "Tool approval 시나리오",
            collapsed: false,
            status: "success",
          },
        ],
        status: "running",
        created_at_ms: now,
      },
    },
  ]);
  await sleep(300);

  postServerEvent({ t: "SET_APPROVAL_MODE", mode: "auto" });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS SET_APPROVAL_MODE");
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_CATEGORY_PERMISSIONS",
    permissions: [
      { category: "read", permission: "auto" },
      { category: "write", permission: "confirm" },
      { category: "terminal", permission: "confirm" },
      { category: "search", permission: "auto" },
    ],
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS SET_CATEGORY_PERMISSIONS");
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_QUOTE_CONTEXT",
    message_id: userMsgId,
    quoted_text: "const foo = bar();",
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS SET_QUOTE_CONTEXT");
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "REQUEST_TOOL_APPROVAL",
    tool_call_id: tcId,
    action_id: nextId("action"),
    risk_level: "moderate",
    description: "Write to src/routes/auth.ts",
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS REQUEST_TOOL_APPROVAL");
  await sleep(STAGE_DELAY * 2);

  postServerEvent({
    t: "SET_TOOL_OUTPUT",
    id: tcId,
    output: { stdout: "File written: src/routes/auth.ts (45 lines)", exit_code: 0 },
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS SET_TOOL_OUTPUT");
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_DIFF_LOADED",
    id: userMsgId,
    diff_text:
      "--- a/src/routes/auth.ts\n+++ b/src/routes/auth.ts\n@@ -1,0 +1,5 @@\n+export function login() {\n+  // ...\n+}",
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS SET_DIFF_LOADED");
  await sleep(STAGE_DELAY);

  const mcpTcId = nextId("mcp-tc") as McpToolCallId;
  postServerEvent({
    t: "UPSERT_MCP_TOOL_CALL",
    call: {
      id: mcpTcId,
      turn_id: turnId as string,
      server_id: "mcp-seed-1" as McpServerId,
      tool_name: "read_file",
      args_summary: "src/config.ts",
      status: "success",
      result_summary: "OK (24 lines)",
      duration_ms: 45,
    },
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS UPSERT_MCP_TOOL_CALL");
  await sleep(STAGE_DELAY);

  postServerEvents([
    { t: "UPSERT_TURN", turn: { id: turnId, phases: [], status: "success", created_at_ms: now } },
    { t: "SET_SESSION_META", meta: { status: "idle" } },
  ]);
  // eslint-disable-next-line no-console
  console.log("[sim]  Tool Approval scenario complete (7 events)");
}

/** Session Ops scenario: SET_CURRENT_PAGE, SET_THINKING_MODE, SET_FAST_MODE, SET_PROGRESS,
 *  FORK_SESSION, SET_SHARE_LINK, SET_EXPORT_PROGRESS, UPDATE_SESSION_SUMMARY */
export async function simScenarioSessionOps() {
  // eslint-disable-next-line no-console
  console.log("[sim]  Starting session operations scenario...");

  postServerEvent({ t: "SET_CURRENT_PAGE", page: "settings" });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS SET_CURRENT_PAGE → settings");
  await sleep(STAGE_DELAY);
  postServerEvent({ t: "SET_CURRENT_PAGE", page: "chat" });
  await sleep(STAGE_DELAY);

  postServerEvent({ t: "SET_THINKING_MODE", enabled: true });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS SET_THINKING_MODE");
  await sleep(STAGE_DELAY);

  postServerEvent({ t: "SET_FAST_MODE", enabled: true });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS SET_FAST_MODE");
  await sleep(STAGE_DELAY);

  for (let pct = 0; pct <= 100; pct += 25) {
    postServerEvent({
      t: "SET_PROGRESS",
      key: "scenario_import",
      value: pct,
      max: 100,
      label: `처리 중... ${pct}%`,
    });
    await sleep(200);
  }
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS SET_PROGRESS (0→100)");
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "FORK_SESSION",
    source_session_id: "session-main" as SessionId,
    source_turn_id: "turn-seed-1" as TurnId,
    new_session_id: nextId("session") as SessionId,
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS FORK_SESSION");
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_SHARE_LINK",
    session_id: "session-main" as SessionId,
    link: {
      url: "https://share.claude.ai/sessions/abc123",
      expires_at_ms: Date.now() + 86_400_000,
      masked: false,
    } satisfies ShareLink,
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS SET_SHARE_LINK");
  await sleep(STAGE_DELAY);

  postServerEvent({ t: "SET_EXPORT_PROGRESS", progress: "exporting" });
  await sleep(400);
  postServerEvent({ t: "SET_EXPORT_PROGRESS", progress: "done" });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS SET_EXPORT_PROGRESS (exporting→done)");
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "UPDATE_SESSION_SUMMARY",
    summary: "JWT 인증 엔드포인트 구현 + 테스트 완료. Rate limit 이슈 확인됨.",
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS UPDATE_SESSION_SUMMARY");

  // eslint-disable-next-line no-console
  console.log("[sim]  Session Ops scenario complete (8 events)");
}

/** Todo & Plan scenario: UPSERT_PROJECT_TODO, UPDATE_PROJECT_TODO_STATUS,
 *  DELETE_PROJECT_TODO, UPDATE_PLAN_ITEM */
export async function simScenarioTodoPlan() {
  const now = Date.now();
  // eslint-disable-next-line no-console
  console.log("[sim]  Starting todo & plan scenario...");

  const newTodoId = nextId("todo") as ProjectTodoId;
  postServerEvent({
    t: "UPSERT_PROJECT_TODO",
    todo: {
      id: newTodoId,
      label: "WebSocket 지원 추가",
      status: "pending",
      priority: "high",
      source_session_ids: [],
      created_at_ms: now,
      updated_at_ms: now,
      description: "실시간 통신을 위한 WebSocket 구현",
    },
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS UPSERT_PROJECT_TODO");
  await sleep(STAGE_DELAY);

  postServerEvent({ t: "UPDATE_PROJECT_TODO_STATUS", id: newTodoId, status: "in_progress" });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS UPDATE_PROJECT_TODO_STATUS → in_progress");
  await sleep(STAGE_DELAY);

  postServerEvent({ t: "UPDATE_PROJECT_TODO_STATUS", id: newTodoId, status: "completed" });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS UPDATE_PROJECT_TODO_STATUS → completed");
  await sleep(STAGE_DELAY);

  postServerEvent({ t: "DELETE_PROJECT_TODO", id: newTodoId });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS DELETE_PROJECT_TODO");
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "UPDATE_PLAN_ITEM",
    turn_id: "turn-seed-4" as TurnId,
    item_id: "plan-t4-2",
    status: "completed",
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS UPDATE_PLAN_ITEM → completed");
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "UPDATE_PLAN_ITEM",
    turn_id: "turn-seed-4" as TurnId,
    item_id: "plan-t4-3",
    status: "in_progress",
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS UPDATE_PLAN_ITEM → in_progress");

  // eslint-disable-next-line no-console
  console.log("[sim]  Todo & Plan scenario complete (4 event types)");
}

/** Review & Diff scenario: SET_REVIEW_COMMENTS, UPDATE_REVIEW_COMMENT_STATUS,
 *  SET_CHECKPOINT_DIFF, SET_THREE_WAY_DIFF */
export async function simScenarioReviewDiff() {
  // eslint-disable-next-line no-console
  console.log("[sim]  Starting review & diff scenario...");

  postServerEvent({
    t: "SET_REVIEW_COMMENTS",
    file_path: "src/utils.ts",
    comments: [
      {
        id: "rc-gap-1" as ReviewCommentId,
        file_path: "src/utils.ts",
        line: 10,
        line_start: 10,
        line_end: 12,
        text: "에러 핸들링 추가 필요",
        message: "에러 핸들링 추가 필요",
        severity: "warning",
        status: "open",
      },
      {
        id: "rc-gap-2" as ReviewCommentId,
        file_path: "src/utils.ts",
        line: 25,
        line_start: 25,
        line_end: 25,
        text: "환경변수로 추출 권장",
        message: "환경변수로 추출 권장",
        severity: "suggestion",
        status: "open",
      },
    ],
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS SET_REVIEW_COMMENTS (2 comments)");
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "UPDATE_REVIEW_COMMENT_STATUS",
    id: "rc-gap-1" as ReviewCommentId,
    status: "accepted",
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS UPDATE_REVIEW_COMMENT_STATUS → accepted");
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "UPDATE_REVIEW_COMMENT_STATUS",
    id: "rc-gap-2" as ReviewCommentId,
    status: "dismissed",
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS UPDATE_REVIEW_COMMENT_STATUS → dismissed");
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_CHECKPOINT_DIFF",
    from_id: "cp-before",
    to_id: "cp-after",
    files: [
      {
        file_path: "src/routes/auth.ts",
        turn_id: "turn-seed-1" as TurnId,
        status: "modified",
        insertions: 12,
        deletions: 3,
        approval_status: "accepted",
      },
      {
        file_path: "src/middleware/jwt.ts",
        turn_id: "turn-seed-1" as TurnId,
        status: "added",
        insertions: 28,
        deletions: 0,
        approval_status: "pending",
      },
    ],
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS SET_CHECKPOINT_DIFF (2 files)");
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_THREE_WAY_DIFF",
    data: {
      id: "diff3_gap_1",
      turn_id: "turn-1" as TurnId,
      file_path: "src/routes/auth.ts",
      base_content: "function auth() {}",
      agent_content: "function auth() { validate(); }",
      current_content: "function auth() { log(); }",
      conflicts: [{ start_line: 1, end_line: 1 }],
      status: "pending",
    } satisfies ThreeWayDiffData,
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS SET_THREE_WAY_DIFF");

  // eslint-disable-next-line no-console
  console.log("[sim]  Review & Diff scenario complete (4 event types)");
}

/** Cleanup & HITL scenario: memory lifecycle, agent removal, arena winner,
 *  completion settings, browser console clear, element mappings,
 *  user input request/update/cancel, RESET_STORES */
export async function simScenarioCleanupHitl() {
  // eslint-disable-next-line no-console
  console.log("[sim]  Starting cleanup & HITL scenario...");

  // Memory lifecycle
  postServerEvent({ t: "PIN_MEMORY_RULE", id: "rule-1" as MemoryRuleId, pinned: true });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS PIN_MEMORY_RULE");
  await sleep(STAGE_DELAY);

  postServerEvent({ t: "REMOVE_MEMORY_RULE", id: "rule-3" as MemoryRuleId });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS REMOVE_MEMORY_RULE");
  await sleep(STAGE_DELAY);

  postServerEvent({ t: "DELETE_MEMORY_RULE", id: "rule-3" as MemoryRuleId });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS DELETE_MEMORY_RULE");
  await sleep(STAGE_DELAY);

  postServerEvent({ t: "DISMISS_AUTO_MEMORY", id: "auto-mem-1" });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS DISMISS_AUTO_MEMORY");
  await sleep(STAGE_DELAY);

  // Agent cleanup
  postServerEvent({ t: "REMOVE_AGENT_INSTANCE", id: "agent-seed-3" as AgentInstanceId });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS REMOVE_AGENT_INSTANCE");
  await sleep(STAGE_DELAY);

  postServerEvent({ t: "REMOVE_BACKGROUND_JOB", id: "job-cleanup-1" });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS REMOVE_BACKGROUND_JOB");
  await sleep(STAGE_DELAY);

  // Arena winner
  postServerEvent({ t: "SET_ARENA_WINNER", winner: "A" });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS SET_ARENA_WINNER → A");
  await sleep(STAGE_DELAY);

  // Completion settings
  postServerEvent({
    t: "SET_COMPLETION_SETTINGS",
    settings: {
      enabled: true,
      trigger_delay_ms: 300,
      max_lines: 10,
      accept_key: "Tab",
    } satisfies Partial<CompletionSettings>,
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS SET_COMPLETION_SETTINGS");
  await sleep(STAGE_DELAY);

  // Browser console clear
  postServerEvent({ t: "CLEAR_BROWSER_CONSOLE" });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS CLEAR_BROWSER_CONSOLE");
  await sleep(STAGE_DELAY);

  // Element mappings
  postServerEvent({
    t: "SET_ELEMENT_MAPPINGS",
    mappings: [
      {
        selector: ".login-btn",
        file_path: "src/components/LoginButton.tsx",
        line: 15,
        column: 1,
      } satisfies ElementMapping,
      {
        selector: "#app-root",
        file_path: "src/app/App.tsx",
        line: 1,
        column: 1,
      } satisfies ElementMapping,
    ],
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS SET_ELEMENT_MAPPINGS (2 entries)");
  await sleep(STAGE_DELAY);

  // HITL: User Input
  const reqId = nextId("input-req");
  postServerEvent({
    t: "REQUEST_USER_INPUT",
    request: {
      id: reqId,
      turn_id: "turn-seed-1" as TurnId,
      question: "이 파일을 삭제해도 괜찮을까요?",
      response_type: "confirmation",
      required: true,
      urgency: "high",
      created_at_ms: Date.now(),
      status: "pending",
    },
  });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS REQUEST_USER_INPUT");
  await sleep(STAGE_DELAY * 2);

  postServerEvent({ t: "UPDATE_USER_INPUT", id: reqId, status: "answered", answer: "확인" });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS UPDATE_USER_INPUT → answered");
  await sleep(STAGE_DELAY);

  // Second request + cancel
  const reqId2 = nextId("input-req");
  postServerEvent({
    t: "REQUEST_USER_INPUT",
    request: {
      id: reqId2,
      turn_id: "turn-seed-1" as TurnId,
      question: "DB를 초기화할까요?",
      response_type: "single_choice",
      choices: [
        { id: "yes", label: "예" },
        { id: "no", label: "아니오" },
      ],
      required: true,
      urgency: "normal",
      created_at_ms: Date.now(),
      status: "pending",
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({ t: "CANCEL_USER_INPUT", id: reqId2 });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS CANCEL_USER_INPUT");
  await sleep(STAGE_DELAY);

  // NOP (trivial, but for completeness)
  postServerEvent({ t: "NOP" });

  // RESET_STORES — last because it clears everything
  // eslint-disable-next-line no-console
  console.log("[sim]   [WARN] RESET_STORES will clear all state in 2s...");
  await sleep(2000);
  postServerEvent({ t: "RESET_STORES" });
  // eslint-disable-next-line no-console
  console.log("[sim]   PASS RESET_STORES");

  // eslint-disable-next-line no-console
  console.log("[sim]  Cleanup & HITL scenario complete (15 event types)");
}
