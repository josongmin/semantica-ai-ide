import type {
  AgentInstance,
  AgentInstanceId,
  AgentMessage,
  ArenaResponse,
  ArenaResponseId,
  BrowserAction,
  BrowserConsoleEntry,
  ContextSpace,
  DecisionTraceEntry,
  DriftGuardState,
  EvidenceBundle,
  ExplainableVerdict,
  FailClosedConstraints,
  FileChange,
  GanttEntry,
  GitCommit,
  GitCommitId,
  InputGateResult,
  IntegrationConnection,
  LinkedTicket,
  MachineSnapshot,
  McpRegistryEntry,
  McpServerId,
  McpTool,
  MemoryRule,
  MemoryRuleId,
  MissionControlAgent,
  ModeEntry,
  Notepad,
  PlaybookEntry,
  ProjectTodo,
  ProjectTodoId,
  PromptTemplate,
  RemoteCommand,
  RemoteCommandId,
  ReviewComment,
  ReviewCommentId,
  RiskHeatmapEntry,
  SideEffectBudget,
  StrategyState,
  TeamConfig,
  TurnId,
  ValidationState,
  WikiPage,
} from "../../../shared/protocol";
import { postServerEvent, postServerEvents } from "../devUtils";

/**
 * Seeds all feature atoms: agents, MCP, browser, memory, arena, git, review,
 * remote, todos, compaction, architect, model routes, privacy, notepads,
 * usage stats, gantt, three-model, wiki, preview, voice, snapshots, modes,
 * playbooks, context spaces, integrations, tickets, agent messages, team config,
 * templates, completion stats, scope guard, project files, patch simulation,
 * PR summary, and all pipeline stages (input gate through drift guard).
 */
export function seedFeatures(t1: TurnId, t2: TurnId, t1Files: FileChange[]) {
  const now = Date.now();

  // ── Parallel agents ────────────────────────────────────
  const agents: AgentInstance[] = [
    {
      id: "agent-seed-1" as AgentInstanceId,
      label: "Lint 자동 수정",
      status: "success",
      progress: 100,
      model_id: "claude-haiku-4-5",
      created_at_ms: now - 45000,
      completed_at_ms: now - 40000,
      files_processed: 12,
      files_total: 12,
      current_task: "완료",
    },
    {
      id: "agent-seed-2" as AgentInstanceId,
      label: "테스트 파일 생성",
      status: "running",
      progress: 65,
      model_id: "claude-sonnet-4-6",
      created_at_ms: now - 10000,
      current_file: "src/routes/__tests__/auth.test.ts",
      files_processed: 3,
      files_total: 5,
      current_task: "auth.test.ts 작성 중",
    },
    {
      id: "agent-seed-3" as AgentInstanceId,
      label: "타입 체크",
      status: "error",
      progress: 30,
      model_id: "claude-haiku-4-5",
      created_at_ms: now - 8000,
      error_message: "Type error in jwt.ts:15",
    },
  ];
  for (const a of agents) postServerEvent({ t: "UPSERT_AGENT_INSTANCE", instance: a });

  // ── Mission control agents ──────────────────────────────
  const mcAgents: MissionControlAgent[] = [
    {
      id: "agent-seed-1" as AgentInstanceId,
      name: "Linter",
      status: "idle",
      progress_pct: 100,
      risk_level: "safe",
    },
    {
      id: "agent-seed-2" as AgentInstanceId,
      name: "Test Writer",
      status: "running",
      current_task: "auth.test.ts",
      progress_pct: 65,
      risk_level: "safe",
      eta_ms: 5000,
    },
    {
      id: "agent-seed-3" as AgentInstanceId,
      name: "Type Checker",
      status: "error",
      progress_pct: 30,
      risk_level: "moderate",
    },
  ];
  postServerEvent({ t: "SET_MISSION_CONTROL_AGENTS", agents: mcAgents });

  // ── Semantic index ──────────────────────────────────────
  postServerEvent({ t: "SET_INDEX_STATUS", status: "ready", progress: 100, file_count: 1247 });
  postServerEvent({
    t: "SET_SEARCH_RESULTS",
    query: "authentication",
    results: [
      {
        file_path: "src/routes/auth.ts",
        line_number: 15,
        snippet: "export async function authenticateUser(req, res) {",
        score: 0.95,
        symbol_name: "authenticateUser",
      },
      {
        file_path: "src/middleware/jwt.ts",
        line_number: 1,
        snippet: "import jwt from 'jsonwebtoken';",
        score: 0.82,
      },
      {
        file_path: "src/middleware/auth.ts",
        line_number: 8,
        snippet: "export function requireAuth(req, res, next) {",
        score: 0.78,
        symbol_name: "requireAuth",
      },
    ],
  });

  // ── MCP servers ─────────────────────────────────────────
  const mcpId1 = "mcp-seed-1" as McpServerId;
  const mcpId2 = "mcp-seed-2" as McpServerId;
  postServerEvents([
    {
      t: "UPSERT_MCP_SERVER",
      server: {
        id: mcpId1,
        name: "filesystem",
        url: "stdio://localhost",
        status: "connected",
        enabled: true,
        tool_count: 4,
      },
    },
    {
      t: "UPSERT_MCP_SERVER",
      server: {
        id: mcpId2,
        name: "postgres",
        url: "stdio://pg",
        status: "error",
        enabled: true,
        tool_count: 0,
        error_message: "Connection refused",
      },
    },
  ]);
  const mcpTools: McpTool[] = [
    {
      server_id: mcpId1,
      tool_name: "read_file",
      description: "Read file contents",
      requires_approval: false,
      input_schema: {},
    },
    {
      server_id: mcpId1,
      tool_name: "write_file",
      description: "Write file contents",
      requires_approval: true,
      input_schema: {},
    },
    {
      server_id: mcpId1,
      tool_name: "list_dir",
      description: "List directory",
      requires_approval: false,
      input_schema: {},
    },
    {
      server_id: mcpId1,
      tool_name: "delete_file",
      description: "Delete a file",
      requires_approval: true,
      input_schema: {},
    },
  ];
  postServerEvent({ t: "SET_MCP_TOOLS", server_id: mcpId1, tools: mcpTools });

  // ── MCP Registry ────────────────────────────────────────
  const mcpRegistry: McpRegistryEntry[] = [
    {
      id: "reg-1",
      name: "filesystem",
      description: "File system operations",
      author: "anthropic",
      rating: 4.8,
      install_count: 15200,
      installed: true,
      categories: ["file", "core"],
      compatibility: ">=1.0",
    },
    {
      id: "reg-2",
      name: "postgres",
      description: "PostgreSQL database access",
      author: "community",
      rating: 4.2,
      install_count: 3400,
      installed: true,
      categories: ["database"],
      compatibility: ">=1.0",
    },
    {
      id: "reg-3",
      name: "github",
      description: "GitHub API integration",
      author: "anthropic",
      rating: 4.6,
      install_count: 8900,
      installed: false,
      categories: ["git", "api"],
      compatibility: ">=1.0",
    },
  ];
  postServerEvent({ t: "SET_MCP_REGISTRY", entries: mcpRegistry });

  // ── Browser preview ─────────────────────────────────────
  postServerEvent({
    t: "SET_BROWSER_STATE",
    state: { url: "http://localhost:3000/auth/login", loading: false, title: "Login Page" },
  });
  const consoleEntries: BrowserConsoleEntry[] = [
    { id: "bc-1", level: "log", message: "App mounted successfully", timestamp_ms: now - 5000 },
    { id: "bc-2", level: "warn", message: "React.StrictMode detected", timestamp_ms: now - 4000 },
    {
      id: "bc-3",
      level: "error",
      message: "Failed to fetch /api/health",
      timestamp_ms: now - 2000,
    },
  ];
  for (const e of consoleEntries) postServerEvent({ t: "PUSH_BROWSER_CONSOLE", entry: e });

  // ── Browser actions ──────────────────────────────────────
  const browserActions: BrowserAction[] = [
    { id: "ba-1", type: "navigate", value: "http://localhost:3000", timestamp_ms: now - 6000 },
    { id: "ba-2", type: "click", target: "button.login-btn", timestamp_ms: now - 4000 },
    {
      id: "ba-3",
      type: "type",
      target: "input#email",
      value: "test@example.com",
      timestamp_ms: now - 3500,
    },
    { id: "ba-4", type: "screenshot", timestamp_ms: now - 3000 },
  ];
  postServerEvent({ t: "SET_BROWSER_ACTIONS", actions: browserActions });

  // ── Memory rules ────────────────────────────────────────
  const rules: MemoryRule[] = [
    {
      id: "rule-1" as MemoryRuleId,
      title: "TypeScript strict mode 사용",
      content: "tsconfig.json에 strict: true 설정",
      source: "CLAUDE.md",
      active: true,
      created_at_ms: now - 100000,
    },
    {
      id: "rule-2" as MemoryRuleId,
      title: "항상 한국어로 응답",
      content: "사용자와 한국어로 대화할 것",
      source: "user",
      active: true,
      pinned: true,
      created_at_ms: now - 90000,
    },
    {
      id: "rule-3" as MemoryRuleId,
      title: "Vitest 사용",
      content: "테스트에 Jest 대신 Vitest 사용",
      source: "project",
      active: true,
      created_at_ms: now - 80000,
    },
  ];
  for (const r of rules) postServerEvent({ t: "UPSERT_MEMORY_RULE", rule: r });
  postServerEvent({ t: "SET_ACTIVE_RULES", ids: rules.map((r) => r.id) });

  // ── Auto-memory suggestion ──────────────────────────────
  postServerEvent({
    t: "SUGGEST_AUTO_MEMORY",
    suggestion: {
      id: "auto-mem-1",
      title: "FSD 아키텍처 준수",
      content: "Feature-Sliced Design 패턴 사용: shared → entities → features → widgets → pages",
      confidence: 0.92,
      source_turn_id: t1,
    },
  });

  // ── Arena mode ──────────────────────────────────────────
  const arenaA: ArenaResponse = {
    id: "arena-a" as ArenaResponseId,
    slot: "A",
    model_id: "claude-opus-4-6",
    model_label: "Claude Opus 4.6",
    text: "Arena A: 이 코드에서 JWT 토큰을 HttpOnly 쿠키에 저장하는 것이 가장 안전합니다.",
    status: "final",
    created_at_ms: now - 5000,
  };
  const arenaB: ArenaResponse = {
    id: "arena-b" as ArenaResponseId,
    slot: "B",
    model_id: "claude-sonnet-4-6",
    model_label: "Sonnet 4.6",
    text: "Arena B: Authorization 헤더에 Bearer 토큰으로 전달하는 것이 RESTful 표준에 부합합니다.",
    status: "final",
    created_at_ms: now - 5000,
  };
  postServerEvents([
    { t: "UPSERT_ARENA_RESPONSE", response: arenaA },
    { t: "UPSERT_ARENA_RESPONSE", response: arenaB },
  ]);

  // ── Git commits ─────────────────────────────────────────
  postServerEvent({ t: "SET_AUTO_COMMIT_ENABLED", enabled: true });
  const commits: GitCommit[] = [
    {
      id: "gc-1" as GitCommitId,
      sha: "abc1234",
      message: "feat: add JWT authentication endpoint",
      timestamp_ms: now - 12000,
      auto: true,
      branch: "main",
    },
    {
      id: "gc-2" as GitCommitId,
      sha: "def5678",
      message: "chore: update route index",
      timestamp_ms: now - 11500,
      auto: true,
      branch: "main",
    },
  ];
  for (const c of commits) postServerEvent({ t: "PUSH_GIT_COMMIT", commit: c });

  // ── AI code review ──────────────────────────────────────
  const reviews: ReviewComment[] = [
    {
      id: "rc-1" as ReviewCommentId,
      file_path: "src/routes/auth.ts",
      line: 42,
      line_start: 42,
      line_end: 42,
      text: "이메일 input validation 추가 필요",
      message: "이메일 input validation 추가 필요",
      severity: "warning",
      status: "open",
      suggestion: "zod schema로 request body를 validate",
    },
    {
      id: "rc-2" as ReviewCommentId,
      file_path: "src/middleware/jwt.ts",
      line: 15,
      line_start: 15,
      line_end: 18,
      text: "secret을 하드코딩하지 말고 환경변수 사용",
      message: "secret을 하드코딩하지 말고 환경변수 사용",
      severity: "error",
      status: "open",
      suggested_fix: "const secret = process.env.JWT_SECRET",
    },
    {
      id: "rc-3" as ReviewCommentId,
      file_path: "src/types/auth.ts",
      line: 8,
      line_start: 8,
      line_end: 8,
      text: "readonly 사용 권장",
      message: "readonly 사용 권장",
      severity: "suggestion",
      status: "accepted",
    },
  ];
  for (const r of reviews) postServerEvent({ t: "UPSERT_REVIEW_COMMENT", comment: r });

  // ── Remote control ──────────────────────────────────────
  postServerEvent({ t: "SET_REMOTE_STATUS", status: "connected" });
  const remoteCmd: RemoteCommand = {
    id: "cmd-1" as RemoteCommandId,
    text: "빌드하고 배포해줘",
    received_at_ms: now - 1000,
    executed: false,
  };
  postServerEvent({ t: "PUSH_REMOTE_COMMAND", command: remoteCmd });

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

  // ── Agent messages (P2P) ────────────────────────────────
  const agentMessages: AgentMessage[] = [
    {
      id: "am-1",
      from_agent: "Test Writer",
      to_agent: "Linter",
      content: "auth.test.ts 생성 완료, lint 확인 부탁",
      timestamp_ms: now - 5000,
      message_type: "request",
    },
    {
      id: "am-2",
      from_agent: "Linter",
      to_agent: "Test Writer",
      content: "lint 통과, 문제 없음",
      timestamp_ms: now - 4000,
      message_type: "response",
    },
  ];
  postServerEvent({ t: "SET_AGENT_MESSAGES", messages: agentMessages });

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
    workspace_name: "my-api-server",
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

  // ─── Pipeline: Input Gate ───────────────────────────────
  postServerEvent({
    t: "SET_INPUT_GATE_RESULT",
    turn_id: t1,
    result: {
      intent_type: "bug_fix",
      risk_level: "moderate",
      change_size: "medium",
      uncertainty: "low",
      context_signals: {
        has_repro: true,
        has_logs: true,
        has_patch_hints: false,
        pii_detected: false,
        security_sensitive: true,
      },
    } satisfies InputGateResult,
  });

  // ─── Pipeline: Fail-Closed Constraints ──────────────────
  postServerEvent({
    t: "SET_FAIL_CLOSED_CONSTRAINTS",
    turn_id: t1,
    constraints: {
      allowed_actions: ["read_file", "write_file", "run_test", "search"],
      required_gates: ["invariant_check", "risk_witness", "test_pass"],
      tool_allowlist: ["read_file", "write_file", "grep", "bash", "lint"],
      max_side_effects: 5,
      policy_version_digest: "pol_sha256_a1b2c3d4",
      ssot_digest: "ssot_sha256_e5f6g7h8",
    } satisfies FailClosedConstraints,
  });

  // ─── Pipeline: Strategy ────────────────────────────────
  postServerEvent({
    t: "SET_STRATEGY_STATE",
    turn_id: t1,
    state: {
      mode: "DEEP",
      strategy: "BEAM",
      budget: {
        time_budget_ms: 60000,
        solver_budget: 3,
        max_candidates: 8,
        max_depth: 4,
      },
      hypothesis_graph: [
        {
          id: "h1",
          hypothesis: "NullPointerException은 userService.getUser() 반환값 미검증이 원인",
          status: "confirmed",
          confidence: 0.92,
          evidence_ids: ["ev1", "ev2"],
        },
        {
          id: "h2",
          hypothesis: "Race condition으로 인한 동시 접근 문제",
          status: "refuted",
          confidence: 0.15,
          evidence_ids: ["ev3"],
        },
        {
          id: "h3",
          hypothesis: "입력 validation 누락으로 인한 잘못된 상태 전이",
          status: "open",
          confidence: 0.45,
          evidence_ids: [],
        },
      ],
      search_depth: 3,
      candidates_evaluated: 5,
      candidates_pruned: 2,
      current_best_score: 0.87,
    } satisfies StrategyState,
  });

  // ─── Pipeline: Validation Core ─────────────────────────
  postServerEvent({
    t: "SET_VALIDATION_STATE",
    turn_id: t1,
    state: {
      policy_check: "pass",
      invariants: [
        {
          id: "inv1",
          invariant: "모든 public API에 null check 존재",
          status: "pass",
          witness: "getUser() → null guard 추가됨",
        },
        { id: "inv2", invariant: "트랜잭션 경계 내 DB 호출", status: "pass" },
        {
          id: "inv3",
          invariant: "에러 핸들링 체인 무결성",
          status: "fail",
          witness: "catch 블록에서 원본 에러 context 손실",
        },
      ],
      risk_witnesses: [
        {
          id: "rw1",
          risk_type: "null_deref",
          severity: "moderate",
          description: "userService.getUser()의 null 반환 가능성",
          file_path: "src/services/UserController.ts",
          line: 42,
        },
        {
          id: "rw2",
          risk_type: "error_swallow",
          severity: "dangerous",
          description: "catch 블록이 원본 에러를 무시하고 generic error 반환",
          file_path: "src/middleware/errorHandler.ts",
          line: 78,
          witness_data: "catch(e) { return res.status(500).send('Error') }",
        },
      ],
      equivalences: [
        {
          id: "eq1",
          original_hash: "abc123",
          modified_hash: "def456",
          equivalent: true,
          witness: "모든 테스트 케이스에서 동일한 출력",
        },
      ],
      counter_examples: [
        {
          id: "ce1",
          description: "undefined user ID로 API 호출 시 500 에러",
          min_repro: "curl /api/users/undefined",
          patterns: ["null_input", "missing_validation"],
          source: "test_failure",
        },
      ],
      qapi_results: [
        {
          query_id: "q1",
          query_type: "relation_slice",
          status: "resolved",
          answer: "UserController → UserService → UserRepository",
          entities: ["UserController", "UserService", "UserRepository"],
        },
        {
          query_id: "q2",
          query_type: "impact_cone",
          status: "resolved",
          answer: "변경 영향 범위: 3 파일, 12 함수",
          entities: ["getUser", "validateUser", "findById"],
        },
        {
          query_id: "q3",
          query_type: "risk_witness",
          status: "resolved",
          answer: "null deref 위험 2건 식별",
          witness_id: "rw1",
        },
        { query_id: "q4", query_type: "invariant_check", status: "pending" },
      ],
      test_subset: ["user.controller.test.ts", "error-handler.test.ts", "user.service.test.ts"],
      runner_status: "pass",
      runner_summary: "42 passed, 0 failed (3.2s)",
      evidence_schema_valid: true,
    } satisfies ValidationState,
  });

  // ─── Pipeline: Decision Trace ──────────────────────────
  const traceEntries: DecisionTraceEntry[] = [
    {
      id: "dt1",
      timestamp_ms: Date.now() - 5000,
      stage: "S0",
      decision: "Intent: bug_fix (confidence 0.94)",
      reason: "에러 로그와 스택 트레이스 포함",
      alternatives_considered: 3,
    },
    {
      id: "dt2",
      timestamp_ms: Date.now() - 4500,
      stage: "S1",
      decision: "Strategy: BEAM (depth 4)",
      reason: "moderate risk + medium change size → deep search",
      alternatives_considered: 4,
    },
    {
      id: "dt3",
      timestamp_ms: Date.now() - 4000,
      stage: "S4",
      decision: "Candidate A 선택 (score 0.87)",
      reason: "null guard 추가 + 에러 context 보존",
      alternatives_considered: 5,
    },
    {
      id: "dt4",
      timestamp_ms: Date.now() - 3000,
      stage: "S4",
      decision: "Candidate C pruned (dominated)",
      reason: "A가 C의 모든 테스트를 통과하면서 추가 invariant도 충족",
      alternatives_considered: 0,
    },
    {
      id: "dt5",
      timestamp_ms: Date.now() - 2000,
      stage: "S5",
      decision: "Validation: PASS",
      reason: "42/42 테스트 통과, invariant 2/3 통과 (1 warning)",
      alternatives_considered: 0,
    },
  ];
  for (const entry of traceEntries) {
    postServerEvent({ t: "PUSH_DECISION_TRACE", turn_id: t1, entry });
  }

  // ─── Pipeline: Evidence Bundle ─────────────────────────
  postServerEvent({
    t: "SET_EVIDENCE_BUNDLE",
    turn_id: t1,
    bundle: {
      bundle_id: "bndl_2024_001",
      replay_key: "rk_sha256_x9y0z1w2",
      snapshot_hash: "snap_sha256_a1b2",
      env_digest: "env_sha256_c3d4",
      policy_digest: "pol_sha256_a1b2c3d4",
      ssot_digest: "ssot_sha256_e5f6g7h8",
      patch_digest: "patch_sha256_i9j0",
      runner_meta_digest: "rm_sha256_k1l2",
      gate_passed: true,
      created_at_ms: Date.now(),
      decision_trace: traceEntries,
      proof_refs: ["proof://invariant/null_guard_added", "proof://test/all_pass_42"],
    } satisfies EvidenceBundle,
  });

  // ─── Pipeline: Explainable Verdict ─────────────────────
  postServerEvent({
    t: "SET_EXPLAINABLE_VERDICT",
    turn_id: t1,
    verdict: {
      chosen_action: "null guard 추가 + 에러 context 보존 패치 적용",
      confidence: 0.87,
      reasons_for: [
        { factor: "모든 기존 테스트 통과", impact: "positive", weight: 0.35 },
        {
          factor: "NullPointerException 근본 원인 해결",
          impact: "positive",
          weight: 0.3,
          evidence_ref: "rw1",
        },
        { factor: "최소 변경 원칙 준수 (2 파일, +12 -3 lines)", impact: "positive", weight: 0.15 },
      ],
      reasons_against: [
        {
          factor: "에러 핸들링 체인 완전 수정 미완료 (inv3 fail)",
          impact: "negative",
          weight: 0.1,
        },
        { factor: "성능 영향 미측정 (null check 추가)", impact: "neutral", weight: 0.05 },
      ],
      alternatives_rejected: [
        {
          action: "Optional 타입 전면 도입",
          rejection_reason: "blast radius 과다 (15+ 파일 변경 필요)",
        },
        {
          action: "에러 핸들링 미들웨어 전체 리팩토링",
          rejection_reason: "change_size 예산 초과 + uncertainty 높음",
        },
      ],
    } satisfies ExplainableVerdict,
  });

  // ─── Pipeline: Risk Heatmap ────────────────────────────
  postServerEvent({
    t: "SET_RISK_HEATMAP",
    turn_id: t1,
    entries: [
      {
        file_path: "src/services/UserController.ts",
        line_start: 38,
        line_end: 52,
        risk_level: "moderate",
        risk_type: "null_deref",
        description: "getUser() null 반환 시 핸들링 필요",
      },
      {
        file_path: "src/services/UserController.ts",
        line_start: 95,
        line_end: 110,
        risk_level: "safe",
        risk_type: "validated",
        description: "입력 검증 완료된 영역",
      },
      {
        file_path: "src/middleware/errorHandler.ts",
        line_start: 70,
        line_end: 85,
        risk_level: "dangerous",
        risk_type: "error_swallow",
        description: "원본 에러 context 손실 위험",
      },
    ] satisfies RiskHeatmapEntry[],
  });

  // ─── Pipeline: Side-Effect Budget ──────────────────────
  postServerEvent({
    t: "SET_SIDE_EFFECT_BUDGET",
    turn_id: t1,
    budget: {
      max_side_effects: 5,
      used_side_effects: 3,
      allowed_actions: ["write_file", "run_test", "lint"],
      blocked_actions: ["git_push", "deploy", "delete_branch"],
      budget_status: "ok",
    } satisfies SideEffectBudget,
  });

  // ─── Pipeline: Drift Guard ─────────────────────────────
  postServerEvent({
    t: "SET_DRIFT_GUARD_STATE",
    turn_id: t1,
    state: {
      alerts: [
        {
          id: "da1",
          type: "gate_regression",
          severity: "warning",
          description: "invariant 통과율 95% → 67% 하락 (최근 3회 실행)",
          previous_digest: "pol_v2.1",
          current_digest: "pol_v2.2",
          requires_evidence: true,
          timestamp_ms: Date.now() - 60000,
        },
        {
          id: "da2",
          type: "ssot_drift",
          severity: "info",
          description: "Action Schema에 new_tool_call 추가됨",
          previous_digest: "ssot_v1.0",
          current_digest: "ssot_v1.1",
          requires_evidence: false,
          timestamp_ms: Date.now() - 30000,
        },
      ],
      policy_version: "v2.2",
      ssot_version: "v1.1",
      last_check_ms: Date.now() - 10000,
      gate_pass_rate: 0.85,
    } satisfies DriftGuardState,
  });
}
