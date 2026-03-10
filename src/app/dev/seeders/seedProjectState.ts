import type {
  ContextSpace,
  FileChange,
  GanttEntry,
  IntegrationConnection,
  LinkedTicket,
  MachineSnapshot,
  ModeEntry,
  Notepad,
  PlaybookEntry,
  ProjectTodo,
  ProjectTodoId,
  PromptTemplate,
  RemoteCommand,
  RemoteCommandId,
  TeamConfig,
  TurnId,
  WikiPage,
} from "../../../shared/protocol";
import { postServerEvent } from "../devUtils";

/**
 * Seeds project-level state: todos, compaction, architect, model routes, privacy,
 * notepads, usage stats, gantt, wiki, preview, voice, snapshots, modes, playbooks,
 * context spaces, integrations, tickets, team config, templates, completion stats,
 * scope guard, project files, patch simulation, and PR summary.
 *
 * Requires `t1Files` from seedSession and the seed turn IDs.
 */
export function seedProjectState(seedContext: { t1: TurnId; t2: TurnId; t1Files: FileChange[] }) {
  const now = Date.now();
  const { t1, t2, t1Files } = seedContext;

  // ── Project TODOs ───────────────────────────────────────
  const todos: ProjectTodo[] = [
    {
      id: "todo-1" as ProjectTodoId,
      label: "Rate limit 재시도 로직 추가",
      status: "pending",
      priority: "high",
      source_session_ids: ["session-main"],
      source_turn_id: t2,
      created_at_ms: now - 18000,
      updated_at_ms: now - 18000,
      description: "429 에러 시 exponential backoff 구현",
    },
    {
      id: "todo-2" as ProjectTodoId,
      label: "JWT refresh token 구현",
      status: "in_progress",
      priority: "medium",
      source_session_ids: ["session-main"],
      source_turn_id: t1,
      created_at_ms: now - 30000,
      updated_at_ms: now - 5000,
    },
    {
      id: "todo-3" as ProjectTodoId,
      label: "auth 엔드포인트 E2E 테스트",
      status: "pending",
      priority: "medium",
      source_session_ids: ["session-main"],
      created_at_ms: now - 25000,
      updated_at_ms: now - 25000,
    },
    {
      id: "todo-4" as ProjectTodoId,
      label: "패스워드 해싱 (bcrypt)",
      status: "completed",
      priority: "high",
      source_session_ids: ["session-main"],
      source_turn_id: t1,
      created_at_ms: now - 50000,
      updated_at_ms: now - 35000,
    },
  ];
  postServerEvent({ t: "SYNC_PROJECT_TODOS", todos });

  // ── Compaction event ────────────────────────────────────
  postServerEvent({
    t: "LOG_COMPACTION",
    event: {
      id: "compact-1",
      timestamp_ms: now - 25000,
      tokens_before: 180000,
      tokens_after: 45000,
      summary: "Context compacted: 180k→45k tokens (75% reduction)",
    },
  });

  // ── Architect state ─────────────────────────────────────
  postServerEvent({
    t: "SET_ARCHITECT_STATE",
    state: {
      active_role: "coder",
      model_name: "Claude Opus 4.6",
      task_description: "JWT auth 테스트 작성",
    },
  });

  // ── Model routes ────────────────────────────────────────
  postServerEvent({
    t: "SET_MODEL_ROUTES",
    routes: [
      {
        task_type: "code_generation",
        model: "claude-opus-4-6",
        reason: "Complex implementation",
        timestamp_ms: now - 60000,
      },
      {
        task_type: "code_review",
        model: "claude-sonnet-4-6",
        reason: "Fast review",
        timestamp_ms: now - 30000,
      },
      {
        task_type: "test_writing",
        model: "claude-sonnet-4-6",
        reason: "Standard patterns",
        timestamp_ms: now - 3000,
      },
    ],
  });

  // ── Privacy state ───────────────────────────────────────
  postServerEvent({
    t: "SET_PRIVACY_STATE",
    state: { mode: "local", details: "All data stays on your machine" },
  });

  // ── Notepads ────────────────────────────────────────────
  const notepads: Notepad[] = [
    {
      id: "pad-1",
      title: "Auth 설계 노트",
      content:
        "JWT + refresh token 패턴\n- Access token: 15분\n- Refresh token: 7일\n- HttpOnly cookie에 저장",
      updated_at_ms: now - 20000,
    },
    {
      id: "pad-2",
      title: "TODO",
      content: "- [ ] 비밀번호 정책 강화\n- [x] 이메일 유효성 검사\n- [ ] OAuth 추가",
      updated_at_ms: now - 10000,
    },
  ];
  postServerEvent({ t: "SET_NOTEPADS", notepads });

  // ── Usage stats ─────────────────────────────────────────
  postServerEvent({
    t: "SET_USAGE_STATS",
    stats: {
      total_sessions: 47,
      total_cost_usd: 3.42,
      total_tokens: 892000,
      per_model: [
        { model: "Claude Opus 4.6", tokens: 520000, cost_usd: 2.34 },
        { model: "Claude Sonnet 4.6", tokens: 310000, cost_usd: 0.89 },
        { model: "Claude Haiku 4.5", tokens: 62000, cost_usd: 0.19 },
      ],
    },
  });

  // ── Gantt entries ───────────────────────────────────────
  const gantt: GanttEntry[] = [
    {
      id: "g-1",
      tool_name: "Read",
      start_ms: now - 58000,
      end_ms: now - 57955,
      status: "success",
      tool_type: "read",
    },
    {
      id: "g-2",
      tool_name: "Read",
      start_ms: now - 57000,
      end_ms: now - 56968,
      status: "success",
      tool_type: "read",
    },
    {
      id: "g-3",
      tool_name: "Grep",
      start_ms: now - 56000,
      end_ms: now - 55880,
      status: "success",
      tool_type: "search",
    },
    {
      id: "g-4",
      tool_name: "Write",
      start_ms: now - 40000,
      end_ms: now - 39985,
      status: "success",
      tool_type: "write",
    },
    {
      id: "g-5",
      tool_name: "Write",
      start_ms: now - 39000,
      end_ms: now - 38988,
      status: "success",
      tool_type: "write",
    },
    {
      id: "g-6",
      tool_name: "Bash",
      start_ms: now - 14000,
      end_ms: now - 13150,
      status: "success",
      tool_type: "bash",
    },
    {
      id: "g-7",
      tool_name: "Bash",
      start_ms: now - 13000,
      end_ms: now - 10900,
      status: "success",
      tool_type: "bash",
    },
    {
      id: "g-8",
      tool_name: "Glob",
      start_ms: now - 2000,
      end_ms: now - 1965,
      status: "success",
      tool_type: "search",
    },
    {
      id: "g-9",
      tool_name: "Read",
      start_ms: now - 1500,
      end_ms: now,
      status: "running",
      tool_type: "read",
    },
  ];
  postServerEvent({ t: "SET_GANTT_ENTRIES", entries: gantt });

  // ── Three-model architecture ────────────────────────────
  postServerEvent({
    t: "SET_THREE_MODEL_STATE",
    state: {
      planner: {
        model: "Claude Opus 4.6",
        status: "done",
        output: "테스트 계획: happy path + edge cases",
      },
      coder: { model: "Claude Sonnet 4.6", status: "active", output: "auth.test.ts 작성 중..." },
      critic: { model: "Claude Haiku 4.5", status: "idle", output: "" },
    },
  });

  // ── Wiki pages ──────────────────────────────────────────
  const wiki: WikiPage[] = [
    {
      id: "wiki-1",
      title: "프로젝트 개요",
      content: "# JWT Auth Project\n\nREST API 인증 시스템",
      updated_at_ms: now - 50000,
    },
    {
      id: "wiki-2",
      title: "인증 아키텍처",
      content:
        "## JWT Flow\n\n1. 로그인 → access + refresh token 발급\n2. 요청 시 Bearer token 검증\n3. 만료 시 refresh로 갱신",
      parent_id: "wiki-1",
      source_turn_id: t1,
      updated_at_ms: now - 30000,
    },
  ];
  postServerEvent({ t: "SET_WIKI_PAGES", pages: wiki });

  // ── Live preview ────────────────────────────────────────
  postServerEvent({
    t: "SET_PREVIEW_STATE",
    state: { url: "http://localhost:3000", status: "connected", last_update_ms: now - 1000 },
  });

  // ── Voice input ─────────────────────────────────────────
  postServerEvent({ t: "SET_VOICE_INPUT_STATE", state: { status: "idle" } });

  // ── Machine snapshots ──────────────────────────────────
  const snapshots: MachineSnapshot[] = [
    {
      id: "snap-1",
      label: "인증 구현 전",
      created_at_ms: now - 65000,
      size_mb: 245,
      status: "ready",
    },
    {
      id: "snap-2",
      label: "인증 구현 후",
      created_at_ms: now - 29000,
      size_mb: 248,
      status: "ready",
    },
  ];
  postServerEvent({ t: "SET_MACHINE_SNAPSHOTS", snapshots });

  // ── Mode gallery ────────────────────────────────────────
  const modes: ModeEntry[] = [
    {
      id: "mode-1",
      name: "Code",
      description: "일반 코딩 모드",
      author: "anthropic",
      rating: 4.9,
      install_count: 50000,
      installed: true,
      categories: ["default"],
    },
    {
      id: "mode-2",
      name: "Architect",
      description: "시스템 설계 모드",
      author: "anthropic",
      rating: 4.7,
      install_count: 12000,
      installed: true,
      categories: ["design"],
    },
    {
      id: "mode-3",
      name: "Debug",
      description: "디버깅 전문 모드",
      author: "community",
      rating: 4.3,
      install_count: 5600,
      installed: false,
      categories: ["debug"],
    },
  ];
  postServerEvent({ t: "SET_MODE_GALLERY", entries: modes });

  // ── Playbook market ─────────────────────────────────────
  const playbooks: PlaybookEntry[] = [
    {
      id: "pb-1",
      name: "REST API 구축",
      description: "Express + TypeScript REST API",
      version: "1.2.0",
      author: "anthropic",
      rating: 4.8,
      installed: true,
      category: "backend",
    },
    {
      id: "pb-2",
      name: "React 컴포넌트",
      description: "React + TailwindCSS 패턴",
      version: "2.0.1",
      author: "community",
      rating: 4.5,
      installed: false,
      category: "frontend",
    },
  ];
  postServerEvent({ t: "SET_PLAYBOOK_MARKET", entries: playbooks });

  // ── Context spaces ──────────────────────────────────────
  const spaces: ContextSpace[] = [
    {
      id: "cs-1",
      name: "Auth 모듈",
      description: "인증 관련 파일",
      files: ["src/routes/auth.ts", "src/middleware/jwt.ts", "src/types/auth.ts"],
      rules: ["rule-1"],
      active: true,
    },
    {
      id: "cs-2",
      name: "테스트",
      description: "테스트 파일",
      files: ["src/**/*.test.ts"],
      rules: [],
      active: false,
    },
  ];
  postServerEvent({ t: "SET_CONTEXT_SPACES", spaces });

  // ── Integrations ────────────────────────────────────────
  const integrations: IntegrationConnection[] = [
    {
      id: "int-1",
      platform: "slack",
      channel: "#dev-alerts",
      status: "connected",
      last_sync_ms: now - 5000,
    },
    { id: "int-2", platform: "custom", channel: "github:user/project", status: "syncing" },
  ];
  postServerEvent({ t: "SET_INTEGRATIONS", connections: integrations });

  // ── Linked ticket ───────────────────────────────────────
  const ticket: LinkedTicket = {
    id: "ticket-1",
    key: "AUTH-42",
    title: "JWT 인증 엔드포인트 구현",
    status: "In Progress",
    platform: "linear",
    url: "https://linear.app/team/AUTH-42",
  };
  postServerEvent({ t: "SET_LINKED_TICKET", ticket });

  // ── Team config ─────────────────────────────────────────
  const teamConfig: TeamConfig[] = [
    {
      key: "model",
      local_value: "claude-opus-4-6",
      team_value: "claude-sonnet-4-6",
      status: "different",
    },
    { key: "approval_mode", local_value: "auto", team_value: "auto", status: "same" },
    { key: "auto_commit", local_value: "true", team_value: "", status: "local_only" },
  ];
  postServerEvent({ t: "SET_TEAM_CONFIG", items: teamConfig });

  // ── Prompt templates ────────────────────────────────────
  const templates: PromptTemplate[] = [
    {
      id: "pt-1",
      name: "코드 리뷰",
      description: "PR 코드 리뷰 요청",
      template: "이 PR을 리뷰해줘:\n- 보안 이슈\n- 성능 문제\n- 코드 스타일",
      scope: "team",
      category: "review",
    },
    {
      id: "pt-2",
      name: "버그 수정",
      description: "버그 수정 템플릿",
      template: "이 버그를 수정해줘:\n에러: {{error}}\n재현 경로: {{steps}}",
      scope: "personal",
      category: "debug",
    },
  ];
  postServerEvent({ t: "SET_PROMPT_TEMPLATES", templates });

  // ── Completion stats ────────────────────────────────────
  postServerEvent({
    t: "SET_COMPLETION_STATS",
    stats: { shown_today: 42, accepted_today: 31, acceptance_rate: 0.738 },
  });

  // ── Scope guard ─────────────────────────────────────────
  postServerEvent({
    t: "SET_SCOPE_GUARD",
    includes: ["src/**"],
    excludes: ["node_modules/**", "dist/**", ".git/**"],
  });

  // ── Project files ───────────────────────────────────────
  postServerEvent({
    t: "SET_PROJECT_FILES",
    files: [
      "src/routes/auth.ts",
      "src/routes/index.ts",
      "src/middleware/jwt.ts",
      "src/middleware/auth.ts",
      "src/types/auth.ts",
      "src/config.ts",
      "src/app.ts",
      "package.json",
      "tsconfig.json",
    ],
  });

  // ── Patch simulation ────────────────────────────────────
  postServerEvent({
    t: "SET_PATCH_SIMULATION",
    turn_id: "turn_1" as TurnId,
    file_path: "src/routes/index.ts",
    conflict_risk: "low",
    affected_files: ["src/routes/index.ts", "src/app.ts"],
  });

  // ── PR summary ──────────────────────────────────────────
  postServerEvent({
    t: "SET_PR_SUMMARY",
    summary: {
      title: "feat: JWT 인증 엔드포인트 추가",
      intent: "REST API에 JWT 기반 인증 시스템 구현",
      changes: t1Files,
      todos: ["이메일 validation 추가", "refresh token 구현", "rate limit 처리"],
    },
  });

  // ── Remote control ──────────────────────────────────────
  postServerEvent({ t: "SET_REMOTE_STATUS", status: "connected" });
  const remoteCmd: RemoteCommand = {
    id: "cmd-1" as RemoteCommandId,
    text: "빌드하고 배포해줘",
    received_at_ms: now - 1000,
    executed: false,
  };
  postServerEvent({ t: "PUSH_REMOTE_COMMAND", command: remoteCmd });
}
