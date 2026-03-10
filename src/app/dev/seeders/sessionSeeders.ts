import type {
  BoomerangTask,
  FileChange,
  MessageId,
  PlanChecklistItem,
  SessionId,
  SessionListEntry,
  SymbolMention,
  TimelineEvent,
  ToolCall,
  Turn,
  TurnId,
} from "../../../shared/protocol";
import { postServerEvent, postServerEvents } from "../devUtils";

/**
 * Seeds session meta, 4 turns (success/error/approval/running),
 * boomerang tasks, timeline, symbols, and session list.
 */
export function seedSession() {
  const now = Date.now();

  // ── Session meta ────────────────────────────────────────
  postServerEvent({
    t: "SET_SESSION_META",
    meta: {
      session_id: "session-main" as SessionId,
      status: "idle",
      model_id: "claude-opus-4-6",
      model_label: "Claude Opus 4.6",
      approval_mode: "auto",
      cost_usd: 0.0847,
      tokens_in: 12340,
      tokens_out: 5678,
      max_context_tokens: 200000,
      thinking_enabled: true,
      summary: "JWT 인증 구현 및 리팩터링",
      stats: {
        turns_count: 4,
        files_modified: 3,
        files_created: 4,
        files_deleted: 1,
        tool_calls_count: 18,
        errors_count: 1,
      },
    },
  });

  // ── Available models ───────────────────────────────────
  postServerEvent({
    t: "SET_AVAILABLE_MODELS",
    models: [
      { id: "claude-opus-4-6", label: "Claude Opus 4.6", provider: "Anthropic", supports_thinking: true },
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "Anthropic", supports_thinking: true },
      { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "Anthropic" },
    ],
  });

  // ── Turn 1: success — full 6-phase turn ─────────────────
  const t1 = "turn-seed-1" as TurnId;
  const t1UserMsg = "msg-seed-1" as MessageId;
  const t1ThinkMsg = "msg-seed-2" as MessageId;
  const t1PlanMsg = "msg-seed-3" as MessageId;
  const t1SummaryMsg = "msg-seed-4" as MessageId;
  const t1Tc1 = "tc-seed-1";
  const t1Tc2 = "tc-seed-2";
  const t1Tc3 = "tc-seed-3";
  const t1Tc4 = "tc-seed-4";
  const t1Tc5 = "tc-seed-5";

  postServerEvents([
    { t: "UPSERT_MESSAGE", msg: { id: t1UserMsg, turn_id: t1, role: "user", created_at_ms: now - 60000, text: "JWT 인증 API 엔드포인트를 구현해줘", status: "final" } },
    { t: "UPSERT_MESSAGE", msg: { id: t1ThinkMsg, turn_id: t1, role: "assistant", created_at_ms: now - 58000, text: "JWT 인증 엔드포인트를 만들겠습니다. 먼저 프로젝트 구조를 분석하고 기존 auth 미들웨어를 확인한 뒤 구현하겠습니다.", status: "final" } },
    { t: "UPSERT_MESSAGE", msg: { id: t1PlanMsg, turn_id: t1, role: "assistant", created_at_ms: now - 50000, text: "## 구현 계획\n\n| 단계 | 작업 | 파일 |\n|------|------|------|\n| 1 | Auth route handler 생성 | `src/routes/auth.ts` |\n| 2 | JWT 토큰 생성/검증 미들웨어 | `src/middleware/jwt.ts` |\n| 3 | 비밀번호 validation | `src/routes/auth.ts` |\n| 4 | Route index 업데이트 | `src/routes/index.ts` |\n| 5 | TypeScript 인터페이스 | `src/types/auth.ts` |\n\n> **참고:** 기존 `src/middleware/auth.ts`의 패턴을 따라 구현합니다.", status: "final" } },
    { t: "UPSERT_MESSAGE", msg: { id: t1SummaryMsg, turn_id: t1, role: "assistant", created_at_ms: now - 30000, text: "JWT 인증 엔드포인트를 구현했습니다.\n\n### 변경된 파일\n\n• `src/routes/auth.ts` — login/register 핸들러\n• `src/middleware/jwt.ts` — 토큰 생성/검증\n• `src/routes/index.ts` — auth 라우트 등록\n• `src/types/auth.ts` — TypeScript 인터페이스\n\n### 인증 플로우\n\n```mermaid\nsequenceDiagram\n    participant C as Client\n    participant S as Server\n    participant DB as Database\n    C->>S: POST /auth/login {email, password}\n    S->>DB: Find user by email\n    DB-->>S: User record\n    S->>S: Verify password (bcrypt)\n    S-->>C: {access_token, refresh_token}\n    C->>S: GET /api/protected (Bearer token)\n    S->>S: Verify JWT\n    S-->>C: 200 OK + data\n```\n\n### API 엔드포인트\n\n```typescript\n// POST /auth/login\ninterface LoginRequest {\n  email: string;\n  password: string;\n}\n\n// POST /auth/register  \ninterface RegisterRequest {\n  email: string;\n  password: string;\n  name: string;\n}\n```\n\n### 아키텍처\n\n```mermaid\ngraph TD\n    A[Client Request] --> B{Auth Router}\n    B -->|/login| C[Login Handler]\n    B -->|/register| D[Register Handler]\n    C --> E[JWT Middleware]\n    D --> E\n    E --> F[Token Generation]\n    F --> G[Response]\n\n```\n\nPOST `/auth/login`, POST `/auth/register` 사용 가능합니다.", status: "final" } },
  ]);

  // Tool calls for turn 1
  const t1ToolCalls: ToolCall[] = [
    { id: t1Tc1, turn_id: t1, tool_name: "Read", category: "read", args_summary: "src/routes/index.ts", status: "success", result_summary: "12 routes found", duration_ms: 45 },
    { id: t1Tc2, turn_id: t1, tool_name: "Read", category: "read", args_summary: "src/middleware/auth.ts", status: "success", result_summary: "기존 auth 미들웨어 확인", duration_ms: 32 },
    { id: t1Tc3, turn_id: t1, tool_name: "Grep", category: "search", args_summary: "pattern: 'jwt'", status: "success", result_summary: "3 matches", duration_ms: 120, output: { stdout: "src/config.ts:12: jwtSecret\nsrc/types/env.d.ts:5: JWT_SECRET\nsrc/middleware/auth.ts:3: import jwt", exit_code: 0 } },
    { id: t1Tc4, turn_id: t1, tool_name: "Write", category: "write", args_summary: "src/routes/auth.ts", status: "success", result_summary: "45 lines written", duration_ms: 15 },
    { id: t1Tc5, turn_id: t1, tool_name: "Write", category: "write", args_summary: "src/middleware/jwt.ts", status: "success", result_summary: "28 lines written", duration_ms: 12 },
  ];
  for (const tc of t1ToolCalls) {
    postServerEvent({ t: "UPSERT_TOOL_CALL", tool_call: tc });
  }

  const turn1: Turn = {
    id: t1,
    status: "success",
    created_at_ms: now - 60000,
    ttft_ms: 156,
    latency_ms: 3600,
    token_usage: { input_tokens: 4800, output_tokens: 1832, cache_read_tokens: 2100 },
    estimated_cost_usd: 0.0234,
    phases: [
      { phase: "user_message", message_ids: [t1UserMsg], tool_call_ids: [], summary: "JWT 인증 API 엔드포인트를 구현해줘", collapsed: false, status: "success" },
      { phase: "thinking", message_ids: [t1ThinkMsg], tool_call_ids: [], summary: "요구사항 분석 중...", collapsed: true, status: "success" },
      { phase: "analysis", message_ids: [], tool_call_ids: [t1Tc1, t1Tc2, t1Tc3], summary: "3 tool calls completed", collapsed: true, status: "success" },
      { phase: "plan", message_ids: [t1PlanMsg], tool_call_ids: [], summary: "5단계 구현 계획", collapsed: true, status: "success" },
      { phase: "changes", message_ids: [], tool_call_ids: [t1Tc4, t1Tc5], summary: "4 files changed (+88, -1)", collapsed: false, status: "success" },
      { phase: "summary", message_ids: [t1SummaryMsg], tool_call_ids: [], summary: "JWT 인증 완료", collapsed: false, status: "success" },
    ],
  };
  postServerEvent({ t: "UPSERT_TURN", turn: turn1 });

  // Plan checklist for turn 1
  const planItems: PlanChecklistItem[] = [
    { id: "plan-1", label: "auth route handler 생성", status: "completed" },
    { id: "plan-2", label: "JWT 토큰 생성/검증", status: "completed" },
    { id: "plan-3", label: "비밀번호 validation", status: "completed" },
    { id: "plan-4", label: "route index 업데이트", status: "completed" },
    { id: "plan-5", label: "테스트 추가", status: "completed" },
  ];
  postServerEvent({ t: "UPSERT_PLAN_CHECKLIST", turn_id: t1, items: planItems });

  // File changes for turn 1
  const t1Files: FileChange[] = [
    { file_path: "src/routes/auth.ts", turn_id: t1, status: "added", insertions: 45, deletions: 0, approval_status: "accepted" },
    { file_path: "src/middleware/jwt.ts", turn_id: t1, status: "added", insertions: 28, deletions: 0, approval_status: "accepted" },
    { file_path: "src/routes/index.ts", turn_id: t1, status: "modified", insertions: 3, deletions: 1, approval_status: "accepted" },
    { file_path: "src/types/auth.ts", turn_id: t1, status: "added", insertions: 12, deletions: 0, approval_status: "accepted" },
  ];
  for (const fc of t1Files) postServerEvent({ t: "UPSERT_FILE_CHANGE", file_change: fc });

  // Turn metrics
  postServerEvent({ t: "UPDATE_TURN_METRICS", turn_id: t1, ttft_ms: 156, latency_ms: 3600, token_usage: { input_tokens: 4800, output_tokens: 1832, cache_read_tokens: 2100 }, estimated_cost_usd: 0.0234 });

  // Bookmark turn 1
  postServerEvent({ t: "TOGGLE_TURN_BOOKMARK", turn_id: t1, bookmarked: true, bookmark_label: "important" });

  // Checkpoint for turn 1
  postServerEvent({ t: "ADD_CHECKPOINT", checkpoint: { id: "cp-1", turn_id: t1, label: "Auth endpoint 구현", timestamp_ms: now - 30000 } });

  // ── Turn 2: error — rate limit ─────────────────────────
  const t2 = "turn-seed-2" as TurnId;
  const t2UserMsg = "msg-seed-5" as MessageId;
  const t2ErrorMsg = "msg-seed-6" as MessageId;

  postServerEvents([
    { t: "UPSERT_MESSAGE", msg: { id: t2UserMsg, turn_id: t2, role: "user", created_at_ms: now - 20000, text: "테스트 코드도 작성해줘", status: "final" } },
    { t: "UPSERT_MESSAGE", msg: { id: t2ErrorMsg, turn_id: t2, role: "assistant", created_at_ms: now - 18000, text: "", status: "error", error_detail: "Rate limit exceeded. Please wait 30s.", classified_error: { category: "rate_limit", message: "API rate limit exceeded", retry_strategy: "retry_with_backoff", retry_after_ms: 30000 } } },
  ]);

  const turn2: Turn = {
    id: t2,
    status: "error",
    created_at_ms: now - 20000,
    phases: [
      { phase: "user_message", message_ids: [t2UserMsg], tool_call_ids: [], summary: "테스트 코드도 작성해줘", collapsed: false, status: "success" },
      { phase: "thinking", message_ids: [t2ErrorMsg], tool_call_ids: [], summary: "Rate limit exceeded", collapsed: false, status: "error" },
    ],
  };
  postServerEvent({ t: "UPSERT_TURN", turn: turn2 });

  // Classify the error
  postServerEvent({ t: "CLASSIFY_ERROR", id: t2ErrorMsg, error: { category: "rate_limit", message: "API rate limit exceeded", retry_strategy: "retry_with_backoff", retry_after_ms: 30000 } });

  // ── Turn 3: success — with approval gate ──────────────
  const t3 = "turn-seed-3" as TurnId;
  const t3UserMsg = "msg-seed-7" as MessageId;
  const t3SummaryMsg = "msg-seed-8" as MessageId;
  const t3Tc1 = "tc-seed-6";
  const t3Tc2 = "tc-seed-7";

  postServerEvents([
    { t: "UPSERT_MESSAGE", msg: { id: t3UserMsg, turn_id: t3, role: "user", created_at_ms: now - 15000, text: "git commit하고 push해줘", status: "final" } },
    { t: "UPSERT_MESSAGE", msg: { id: t3SummaryMsg, turn_id: t3, role: "assistant", created_at_ms: now - 10000, text: "커밋 완료했습니다.\n\n```\nfeat: add JWT authentication endpoint\n\n- Created auth route handler\n- Added JWT middleware\n- Updated route index\n```", status: "final" } },
  ]);

  const t3ToolCalls: ToolCall[] = [
    { id: t3Tc1, turn_id: t3, tool_name: "Bash", category: "terminal", args_summary: "git add -A && git commit -m 'feat: add JWT auth'", status: "success", result_summary: "4 files changed", duration_ms: 850, output: { stdout: "[main abc1234] feat: add JWT auth\n 4 files changed, 88 insertions(+), 1 deletion(-)", exit_code: 0 } },
    { id: t3Tc2, turn_id: t3, tool_name: "Bash", category: "terminal", args_summary: "git push origin main", status: "success", result_summary: "Push completed", duration_ms: 2100, output: { stdout: "To github.com:user/project.git\n   def5678..abc1234  main -> main", exit_code: 0 } },
  ];
  for (const tc of t3ToolCalls) postServerEvent({ t: "UPSERT_TOOL_CALL", tool_call: tc });

  const turn3: Turn = {
    id: t3,
    status: "success",
    created_at_ms: now - 15000,
    ttft_ms: 89,
    latency_ms: 4200,
    token_usage: { input_tokens: 2100, output_tokens: 430 },
    estimated_cost_usd: 0.0089,
    phases: [
      { phase: "user_message", message_ids: [t3UserMsg], tool_call_ids: [], summary: "", collapsed: false, status: "success" },
      { phase: "changes", message_ids: [], tool_call_ids: [t3Tc1, t3Tc2], summary: "git commit & push 완료", collapsed: false, status: "success" },
      { phase: "summary", message_ids: [t3SummaryMsg], tool_call_ids: [], summary: "커밋 완료", collapsed: false, status: "success" },
    ],
  };
  postServerEvent({ t: "UPSERT_TURN", turn: turn3 });

  // ── Turn 4: currently running ──────────────────────────
  const t4 = "turn-seed-4" as TurnId;
  const t4UserMsg = "msg-seed-9" as MessageId;
  const t4ThinkMsg = "msg-seed-10" as MessageId;
  const t4Tc1 = "tc-seed-8";
  const t4Tc2 = "tc-seed-9";

  postServerEvents([
    { t: "UPSERT_MESSAGE", msg: { id: t4UserMsg, turn_id: t4, role: "user", created_at_ms: now - 3000, text: "이제 테스트 코드 작성해줘. Jest 사용하고 happy path + edge case 둘 다 커버해줘", status: "final" } },
    { t: "UPSERT_MESSAGE", msg: { id: t4ThinkMsg, turn_id: t4, role: "assistant", created_at_ms: now - 2000, text: "Jest를 사용하여 auth 엔드포인트 테스트를 작성하겠습니다. 먼저 기존 테스트 구조를 확인...", status: "streaming" } },
  ]);

  const t4ToolCalls: ToolCall[] = [
    { id: t4Tc1, turn_id: t4, tool_name: "Glob", category: "search", args_summary: "**/*.test.ts", status: "success", result_summary: "8 test files found", duration_ms: 35 },
    { id: t4Tc2, turn_id: t4, tool_name: "Read", category: "read", args_summary: "src/routes/__tests__/users.test.ts", status: "running" },
  ];
  for (const tc of t4ToolCalls) postServerEvent({ t: "UPSERT_TOOL_CALL", tool_call: tc });

  const turn4: Turn = {
    id: t4,
    status: "running",
    created_at_ms: now - 3000,
    phases: [
      { phase: "user_message", message_ids: [t4UserMsg], tool_call_ids: [], summary: "", collapsed: false, status: "success" },
      { phase: "thinking", message_ids: [t4ThinkMsg], tool_call_ids: [], summary: "요구사항 분석 중...", collapsed: false, status: "running" },
      { phase: "analysis", message_ids: [], tool_call_ids: [t4Tc1, t4Tc2], summary: "파일 탐색 중...", collapsed: false, status: "running" },
    ],
  };
  postServerEvent({ t: "UPSERT_TURN", turn: turn4 });

  // Plan checklist (in progress)
  postServerEvent({ t: "UPSERT_PLAN_CHECKLIST", turn_id: t4, items: [
    { id: "plan-t4-1", label: "기존 테스트 구조 확인", status: "completed" },
    { id: "plan-t4-2", label: "auth.test.ts 작성", status: "in_progress" },
    { id: "plan-t4-3", label: "edge case 추가", status: "pending" },
    { id: "plan-t4-4", label: "테스트 실행 확인", status: "pending" },
  ]});

  // ── Boomerang tasks for turn 1 ─────────────────────────
  const boomerangTasks: BoomerangTask[] = [
    { id: "boom-1", parent_turn_id: t1, label: "auth 미들웨어 유닛테스트", status: "success", agent_id: "agent-1", result_summary: "5 tests passed" },
    { id: "boom-2", parent_turn_id: t1, label: "E2E 인증 플로우 테스트", status: "running", agent_id: "agent-2" },
  ];
  postServerEvent({ t: "SET_BOOMERANG_TASKS", tasks: boomerangTasks });

  // ── Timeline events ────────────────────────────────────
  const events: TimelineEvent[] = [
    { id: "evt-1", turn_id: t1, type: "tool_call_start", timestamp_ms: now - 58000, summary: "Read: src/routes/index.ts" },
    { id: "evt-2", turn_id: t1, type: "tool_call_end", timestamp_ms: now - 57000, summary: "Read completed (45ms)" },
    { id: "evt-3", turn_id: t1, type: "file_created", timestamp_ms: now - 40000, summary: "Created src/routes/auth.ts" },
    { id: "evt-4", turn_id: t1, type: "file_created", timestamp_ms: now - 38000, summary: "Created src/middleware/jwt.ts" },
    { id: "evt-5", turn_id: t1, type: "checkpoint_created", timestamp_ms: now - 30000, summary: "Checkpoint: Auth endpoint" },
    { id: "evt-6", turn_id: t2, type: "error_raised", timestamp_ms: now - 18000, summary: "Rate limit exceeded" },
    { id: "evt-7", turn_id: t3, type: "tool_call_start", timestamp_ms: now - 14000, summary: "Bash: git commit" },
    { id: "evt-8", turn_id: t3, type: "tool_call_end", timestamp_ms: now - 12000, summary: "Git push completed" },
    { id: "evt-9", turn_id: t4, type: "tool_call_start", timestamp_ms: now - 2000, summary: "Glob: **/*.test.ts" },
  ];
  for (const evt of events) postServerEvent({ t: "PUSH_TIMELINE", event: evt });

  // ── Symbol mentions ────────────────────────────────────
  const symbols: SymbolMention[] = [
    { name: "authenticateUser", kind: "function", file_path: "src/routes/auth.ts", line: 15, turn_id: t1 },
    { name: "JwtPayload", kind: "type", file_path: "src/types/auth.ts", line: 3, turn_id: t1 },
    { name: "verifyToken", kind: "function", file_path: "src/middleware/jwt.ts", line: 22, turn_id: t1 },
  ];
  postServerEvent({ t: "SET_SYMBOL_MENTIONS", symbols });

  // ── Session list ────────────────────────────────────────
  const sessions: SessionListEntry[] = [
    { session_id: "session-main" as SessionId, title: "JWT 인증 구현", model_label: "Claude Opus 4.6", status: "idle", created_at_ms: now - 60000, cost_usd: 0.0847, turn_count: 4, last_message_preview: "이제 테스트 코드 작성해줘" },
    { session_id: "session-2" as SessionId, title: "React 컴포넌트 리팩터링", model_label: "Claude Sonnet 4.6", status: "completed", created_at_ms: now - 300000, cost_usd: 0.0321, turn_count: 8, last_message_preview: "리팩터링 완료" },
    { session_id: "session-3" as SessionId, title: "DB 스키마 설계", model_label: "Claude Opus 4.6", status: "idle", created_at_ms: now - 600000, cost_usd: 0.0156, turn_count: 3, last_message_preview: "ERD 확인해봐" },
  ];
  postServerEvent({ t: "SET_SESSION_LIST", sessions });

  // Return t1Files for use by other seeders (PR summary)
  return { t1, t2, t3, t4, t1Files };
}
