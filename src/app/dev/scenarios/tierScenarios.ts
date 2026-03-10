import type {
  AgentInstanceId,
  AppNotification,
  AuthStatus,
  BugbotStatus,
  DebugState,
  ElementMapping,
  FileChange,
  ProjectTodoId,
  QuotaStatus,
  SandboxStatus,
  SessionId,
  TestResults,
  TurnId,
} from "../../../shared/protocol";
import { nextId, nextMsgId, nextTurnId, postServerEvent, sleep, STAGE_DELAY } from "../devUtils";
import { seedFeatures, seedSession, seedUiState } from "../seeders";

/**
 * Tier scenarios: fire P0/P1/P2/SOTA events individually.
 * These let DevScenarioBar trigger each tier without running full seedAll().
 */

// ─── P0: Terminal, Test, Diagnostics, Quota, Notification, Auth ──

export async function simScenarioP0() {
  const now = Date.now();
  // eslint-disable-next-line no-console
  console.log("[sim]  Starting P0 scenario...");

  postServerEvent({
    t: "APPEND_TERMINAL_OUTPUT",
    chunk: {
      tool_call_id: "tc-seed-1",
      stream: "stdout",
      chunk: "$ vitest run\n PASS 42 tests passed (1240ms)\n",
      timestamp_ms: now,
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_TEST_RESULTS",
    results: {
      runner_status: "pass",
      total: 50,
      passed: 48,
      failed: 0,
      skipped: 2,
      duration_ms: 1360,
      cases: [
        {
          name: "dispatch UPSERT_MESSAGE",
          suite: "dispatchServerEvent",
          status: "pass",
          duration_ms: 8,
        },
      ],
      command: "vitest run",
    } satisfies TestResults,
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_DIAGNOSTICS",
    file_path: "src/app/App.tsx",
    diagnostics: [
      {
        id: nextId("diag"),
        file_path: "src/app/App.tsx",
        line: 45,
        column: 12,
        severity: "warning",
        source: "type_checker",
        code: "TS2345",
        message: "Argument type mismatch",
      },
    ],
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_QUOTA_STATUS",
    status: {
      alert_level: "warning",
      budget_usd: 20,
      spent_usd: 17.5,
      remaining_usd: 2.5,
      rate_limit_remaining: 5,
      rate_limit_reset_ms: now + 60_000,
    } satisfies QuotaStatus,
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "PUSH_NOTIFICATION",
    notification: {
      id: nextId("notif"),
      type: "warning",
      urgency: "high",
      title: "P0 테스트 알림",
      message: "시나리오에서 발송된 알림입니다",
      timestamp_ms: now,
    } satisfies AppNotification,
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_AUTH_STATUS",
    status: {
      state: "authenticated",
      provider: "github",
      user_email: "dev@example.com",
      expires_at_ms: now + 3_600_000,
    } satisfies AuthStatus,
  });

  // eslint-disable-next-line no-console
  console.log("[sim]  P0 scenario complete (6 event types)");
}

// ─── P1: Hook, Worktree, FileWatch, CI/CD, Security, Deploy, Prompt, Debug ──

export async function simScenarioP1() {
  const now = Date.now();
  // eslint-disable-next-line no-console
  console.log("[sim]  Starting P1 scenario...");

  postServerEvent({
    t: "SET_HOOK_EVENT",
    event: {
      id: nextId("hook"),
      hook_name: "PostToolUse",
      phase: "completed",
      tool_name: "write_file",
      decision: "allow",
      duration_ms: 12,
      timestamp_ms: now,
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_WORKTREE_STATUS",
    worktree: {
      id: nextId("wt"),
      branch: "feat/p1-test",
      path: "/tmp/worktrees/p1-test",
      phase: "active",
      created_at_ms: now,
      base_branch: "main",
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "FILE_CHANGE_EXTERNAL",
    change: {
      file_path: "package.json",
      change_type: "modified",
      timestamp_ms: now,
      detail: "npm install completed",
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_CI_CD_STATUS",
    pipeline: {
      id: nextId("ci"),
      name: "Build & Test",
      phase: "pass",
      url: "https://github.com/user/repo/actions/runs/99999",
      branch: "main",
      commit_sha: "abc1234",
      started_at_ms: now - 120_000,
      finished_at_ms: now,
      steps: [
        { name: "Install", phase: "pass", duration_ms: 12_000 },
        { name: "Test", phase: "pass", duration_ms: 35_000 },
      ],
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_SECURITY_SCAN",
    scan: {
      scan_id: nextId("scan"),
      status: "completed",
      findings: [
        {
          id: nextId("sf"),
          scan_type: "dependency",
          severity: "medium",
          title: "lodash < 4.17.21",
          description: "Prototype pollution (CVE-2021-23337)",
          cve: "CVE-2021-23337",
          remediation: "npm update lodash",
        },
      ],
      summary: { critical: 0, high: 0, medium: 1, low: 0 },
      timestamp_ms: now,
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_DEPLOY_STATUS",
    deploy: {
      id: nextId("deploy"),
      target: "preview",
      phase: "live",
      url: "https://preview-abc.vercel.app",
      health_check_passed: true,
      started_at_ms: now - 90_000,
      finished_at_ms: now,
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "PUSH_PROMPT_SUGGESTION",
    suggestion: {
      id: nextId("sug"),
      text: "이 코드의 테스트를 작성해줘",
      context: "post-turn",
      confidence: 0.9,
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_DEBUG_STATE",
    state: {
      phase: "idle",
      hypotheses: [
        {
          id: nextId("hyp"),
          description: "메모리 누수: useEffect cleanup 누락",
          status: "confirmed",
          confidence: 0.92,
          evidence: "heap snapshot에서 detached DOM 노드 발견",
        },
      ],
    } satisfies DebugState,
  });

  // eslint-disable-next-line no-console
  console.log("[sim]  P1 scenario complete (8 event types)");
}

// ─── P2: Sandbox, Plugin, Wave, Verifier, Spec, Schedule, Steer, Bugbot ──

export async function simScenarioP2() {
  const now = Date.now();
  // eslint-disable-next-line no-console
  console.log("[sim]  Starting P2 scenario...");

  postServerEvent({
    t: "SET_SANDBOX_STATUS",
    status: {
      enabled: true,
      network_policy: "allowlist",
      allowed_hosts: ["registry.npmjs.org"],
      denied_hosts: [],
      violations: [
        { type: "network", target: "analytics.google.com", blocked: true, timestamp_ms: now },
      ],
    } satisfies SandboxStatus,
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_PLUGIN_STATUS",
    plugins: [
      { id: "plugin-eslint", name: "ESLint", version: "3.2.1", phase: "installed" },
      { id: "plugin-docker", name: "Docker Runner", version: "1.0.0-beta", phase: "available" },
    ],
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_AGENT_WAVE",
    wave: {
      wave_id: nextId("wave"),
      wave_number: 2,
      phase: "executing",
      agent_ids: ["agent-lint", "agent-test"],
      completed_count: 1,
      total_count: 2,
      started_at_ms: now,
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_VERIFIER_RESULT",
    result: {
      id: nextId("vr"),
      spec_section: "Pipeline invariant check",
      outcome: "pass",
      message: "모든 파일 변경이 승인됨",
      inconsistencies: [],
      timestamp_ms: now,
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "UPDATE_LIVING_SPEC",
    spec: {
      id: nextId("spec"),
      title: "Architecture Spec",
      content: "# Architecture\n\n## FSD\napp → pages → widgets → features → entities → shared",
      version: 4,
      last_updated_ms: now,
      sections_completed: 13,
      sections_total: 15,
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_SESSION_SCHEDULE",
    schedules: [
      {
        id: nextId("sched"),
        label: "매일 보안 스캔",
        frequency: "daily",
        next_run_ms: now + 86_400_000,
        last_run_ms: now,
        enabled: true,
        prompt: "보안 취약점 스캔",
      },
    ],
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "STEER_AGENT",
    steer: {
      agent_id: "agent-test",
      action: "redirect",
      reason: "테스트 범위 확장",
      redirect_prompt: "integration 테스트도 추가",
      timestamp_ms: now,
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_BUGBOT_STATUS",
    status: {
      phase: "idle",
      issues: [
        {
          id: nextId("bug"),
          title: "메모리 누수 감지",
          file_path: "src/widgets/message-row/MessageRow.tsx",
          line: 92,
          severity: "warning",
          auto_fixable: true,
        },
      ],
      last_scan_ms: now,
    } satisfies BugbotStatus,
  });

  // eslint-disable-next-line no-console
  console.log("[sim]  P2 scenario complete (8 event types)");
}

// ─── SOTA: Rules, Context, Speculative, BG Jobs, Replay, Debate ──

export async function simScenarioSota() {
  const now = Date.now();
  const t1 = "turn-seed-1" as TurnId;
  // eslint-disable-next-line no-console
  console.log("[sim] 2. Starting SOTA scenario...");

  const ruleId = nextId("rule");
  postServerEvent({
    t: "SET_AGENT_RULES",
    rules: [
      {
        id: ruleId,
        title: "TypeScript strict",
        content: "strictNullChecks 활성화",
        source: "file",
        file_path: ".cursorrules",
        status: "active",
        violation_count: 1,
      },
      {
        id: nextId("rule"),
        title: "Named export 사용",
        content: "default export 금지",
        source: "team",
        status: "active",
        violation_count: 0,
      },
    ],
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "PUSH_RULE_VIOLATION",
    violation: {
      id: nextId("rv"),
      rule_id: ruleId,
      turn_id: t1 as string,
      description: "console.log 발견: src/utils/helpers.ts:42",
      severity: "warning",
      timestamp_ms: now,
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_AUTO_CONTEXT",
    turn_id: "turn_1" as TurnId,
    state: {
      suggestions: [
        {
          id: nextId("ctx"),
          file_path: "src/shared/protocol/types.ts",
          relevance_score: 0.95,
          reason: "핵심 타입 정의",
          token_cost: 2400,
          accepted: true,
        },
      ],
      total_token_cost: 2400,
      budget_tokens: 8000,
      status: "ready",
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_SPECULATIVE_EDITS",
    turn_id: "turn_1" as TurnId,
    state: {
      edits: [
        {
          id: nextId("spec"),
          file_path: "src/utils/helpers.ts",
          original_text: "function getData() {",
          proposed_text: "async function getData(): Promise<Data> {",
          line_start: 12,
          line_end: 12,
          confidence: 0.88,
          risk_level: "safe",
          status: "pending",
        },
      ],
      status: "ready",
      model_id: "claude-sonnet-4-6",
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "UPSERT_BACKGROUND_JOB",
    job: {
      id: nextId("job"),
      label: "린트 자동 수정",
      phase: "running",
      progress: 60,
      agent_model: "claude-sonnet-4-6",
      created_at_ms: now,
      current_step: "src/widgets/ 분석 중...",
      steps_completed: 3,
      steps_total: 5,
      files_changed: 4,
      cloud: false,
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_REPLAY_SESSION",
    session: {
      steps: [
        {
          id: nextId("rs"),
          index: 0,
          type: "tool_call",
          summary: "파일 읽기",
          files_affected: ["src/app/App.tsx"],
          timestamp_ms: now,
          duration_ms: 200,
          can_branch: true,
        },
      ],
      current_index: 0,
      total_steps: 1,
      source_turn_id: t1,
      status: "paused",
      playback_speed: 1,
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_DEBATE_SESSION",
    turn_id: "turn_1" as TurnId,
    session: {
      id: nextId("debate"),
      prompt: "버그 근본 원인?",
      agents: [
        {
          id: nextId("agent"),
          model_id: "claude-opus-4-6",
          label: "Opus",
          status: "done",
          confidence: 0.85,
          files_changed: 2,
          tokens_used: 3200,
          duration_ms: 4500,
        },
      ],
      status: "running",
      created_at_ms: now,
    },
  });

  // eslint-disable-next-line no-console
  console.log("[sim] 2. SOTA scenario complete (7 event types)");
}

// ─── Core State: Turns, Tools, Timeline, Bookmarks, Checkpoints, etc. ──

export async function simScenarioCoreState() {
  const now = Date.now();
  const turnId = nextTurnId();
  const msgId = nextMsgId();
  const tcId = nextId("tc");
  // eslint-disable-next-line no-console
  console.log("[sim]  Starting core state scenario...");

  postServerEvent({
    t: "UPSERT_MESSAGE",
    msg: {
      id: msgId,
      turn_id: turnId,
      role: "user",
      created_at_ms: now,
      text: "Core state 시나리오 테스트",
      status: "final",
    },
  });
  postServerEvent({
    t: "UPSERT_TURN",
    turn: {
      id: turnId,
      phases: [
        {
          phase: "user_message",
          message_ids: [msgId],
          tool_call_ids: [],
          summary: "Core state test",
          collapsed: false,
          status: "success",
        },
      ],
      status: "success",
      created_at_ms: now,
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "UPSERT_TOOL_CALL",
    tool_call: {
      id: tcId,
      turn_id: turnId,
      tool_name: "Read",
      category: "read",
      args_summary: "src/app/App.tsx",
      status: "success",
      result_summary: "OK",
      duration_ms: 45,
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "UPSERT_FILE_CHANGE",
    file_change: {
      file_path: "src/test-core.ts",
      turn_id: turnId,
      status: "added",
      insertions: 10,
      deletions: 0,
      approval_status: "accepted",
    } satisfies FileChange,
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "UPDATE_TURN_METRICS",
    turn_id: turnId,
    ttft_ms: 100,
    latency_ms: 500,
    token_usage: { input_tokens: 1000, output_tokens: 200 },
    estimated_cost_usd: 0.005,
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "TOGGLE_TURN_BOOKMARK",
    turn_id: turnId,
    bookmarked: true,
    bookmark_label: "important",
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "ADD_CHECKPOINT",
    checkpoint: {
      id: nextId("cp"),
      turn_id: turnId,
      label: "Core state checkpoint",
      timestamp_ms: now,
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "CLASSIFY_ERROR",
    id: msgId,
    error: {
      category: "rate_limit",
      message: "Rate limit exceeded",
      retry_strategy: "retry_with_backoff",
      retry_after_ms: 30000,
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "PUSH_TIMELINE",
    event: {
      id: nextId("evt"),
      turn_id: turnId,
      type: "tool_call_start",
      timestamp_ms: now,
      summary: "Read: src/app/App.tsx",
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_BOOMERANG_TASKS",
    tasks: [
      {
        id: nextId("boom"),
        parent_turn_id: turnId,
        label: "하위 작업 테스트",
        status: "running",
        agent_id: "agent-1",
      },
    ],
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_SYMBOL_MENTIONS",
    symbols: [
      {
        name: "testFunction",
        kind: "function",
        file_path: "src/test-core.ts",
        line: 5,
        turn_id: turnId,
      },
    ],
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SUGGEST_AUTO_MEMORY",
    suggestion: {
      id: nextId("auto-mem"),
      title: "Core state 패턴",
      content: "Core state 시나리오 패턴 발견",
      confidence: 0.85,
      source_turn_id: turnId,
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "LOG_COMPACTION",
    event: {
      id: nextId("compact"),
      timestamp_ms: now,
      tokens_before: 180000,
      tokens_after: 45000,
      summary: "Context compacted: 180k→45k",
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_SESSION_LIST",
    sessions: [
      {
        session_id: "session-main" as SessionId,
        title: "Core state 테스트",
        model_label: "Claude Opus 4.6",
        status: "idle",
        created_at_ms: now,
        cost_usd: 0.01,
        turn_count: 1,
        last_message_preview: "Core state test",
      },
    ],
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SYNC_PROJECT_TODOS",
    todos: [
      {
        id: nextId("todo") as ProjectTodoId,
        label: "Core state todo",
        status: "pending",
        priority: "medium",
        source_session_ids: [],
        created_at_ms: now,
        updated_at_ms: now,
      },
    ],
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_SEARCH_RESULTS",
    query: "core state",
    results: [
      {
        file_path: "src/test-core.ts",
        line_number: 5,
        snippet: "function testFunction() {",
        score: 0.9,
      },
    ],
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_MISSION_CONTROL_AGENTS",
    agents: [
      {
        id: "agent-seed-1" as AgentInstanceId,
        name: "Test Agent",
        status: "running",
        current_task: "core state test",
        progress_pct: 50,
        risk_level: "safe",
      },
    ],
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "UPSERT_PLAN_CHECKLIST",
    turn_id: turnId,
    items: [{ id: nextId("plan"), label: "Core state 검증", status: "completed" }],
  });

  // eslint-disable-next-line no-console
  console.log("[sim]  Core state scenario complete (17 event types)");
}

// ─── Panels State: all SET_* panel events ──

export async function simScenarioPanels() {
  const now = Date.now();
  // eslint-disable-next-line no-console
  console.log("[sim]  Starting panels state scenario...");

  postServerEvent({
    t: "SET_AVAILABLE_MODELS",
    models: [
      {
        id: "claude-opus-4-6",
        label: "Claude Opus 4.6",
        provider: "Anthropic",
        supports_thinking: true,
      },
      {
        id: "claude-sonnet-4-6",
        label: "Claude Sonnet 4.6",
        provider: "Anthropic",
        supports_thinking: true,
      },
    ],
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_ARCHITECT_STATE",
    state: {
      active_role: "coder",
      model_name: "Claude Opus 4.6",
      task_description: "Panel state 테스트",
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_MODEL_ROUTES",
    routes: [
      {
        task_type: "code_generation",
        model: "claude-opus-4-6",
        reason: "Complex",
        timestamp_ms: now,
      },
    ],
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_PRIVACY_STATE",
    state: { mode: "local", details: "All data stays on your machine" },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_NOTEPADS",
    notepads: [
      {
        id: nextId("pad"),
        title: "Panel 테스트 노트",
        content: "시나리오에서 생성된 노트",
        updated_at_ms: now,
      },
    ],
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_USAGE_STATS",
    stats: {
      total_sessions: 50,
      total_cost_usd: 4.0,
      total_tokens: 1000000,
      per_model: [{ model: "Claude Opus 4.6", tokens: 600000, cost_usd: 2.8 }],
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_GANTT_ENTRIES",
    entries: [
      {
        id: nextId("g"),
        tool_name: "Read",
        start_ms: now - 1000,
        end_ms: now,
        status: "success",
        tool_type: "read",
      },
    ],
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_THREE_MODEL_STATE",
    state: {
      planner: { model: "Opus", status: "done", output: "계획 완료" },
      coder: { model: "Sonnet", status: "active", output: "코딩 중..." },
      critic: { model: "Haiku", status: "idle", output: "" },
    },
  });
  await sleep(STAGE_DELAY);

  postServerEvent({
    t: "SET_WIKI_PAGES",
    pages: [
      {
        id: nextId("wiki"),
        title: "Panel 테스트",
        content: "# Test\n\n시나리오 생성 위키",
        updated_at_ms: now,
      },
    ],
  });
  await sleep(STAGE_DELAY);

  // Remaining panel events (fired in batch for speed)
  postServerEvent({
    t: "SET_PREVIEW_STATE",
    state: { url: "http://localhost:3000", status: "connected", last_update_ms: now },
  });
  postServerEvent({ t: "SET_VOICE_INPUT_STATE", state: { status: "idle" } });
  postServerEvent({
    t: "SET_MACHINE_SNAPSHOTS",
    snapshots: [
      {
        id: nextId("snap"),
        label: "Panel 테스트 스냅샷",
        created_at_ms: now,
        size_mb: 250,
        status: "ready",
      },
    ],
  });
  postServerEvent({
    t: "SET_MODE_GALLERY",
    entries: [
      {
        id: nextId("mode"),
        name: "Code",
        description: "일반 모드",
        author: "anthropic",
        rating: 4.9,
        install_count: 50000,
        installed: true,
        categories: ["default"],
      },
    ],
  });
  postServerEvent({
    t: "SET_PLAYBOOK_MARKET",
    entries: [
      {
        id: nextId("pb"),
        name: "REST API",
        description: "REST API 패턴",
        version: "1.0",
        author: "anthropic",
        rating: 4.8,
        installed: true,
        category: "backend",
      },
    ],
  });
  postServerEvent({
    t: "SET_CONTEXT_SPACES",
    spaces: [
      {
        id: nextId("cs"),
        name: "Test Space",
        description: "패널 테스트",
        files: ["src/app/App.tsx"],
        rules: [],
        active: true,
      },
    ],
  });
  postServerEvent({
    t: "SET_INTEGRATIONS",
    connections: [
      {
        id: nextId("int"),
        platform: "slack",
        channel: "#dev",
        status: "connected",
        last_sync_ms: now,
      },
    ],
  });
  postServerEvent({
    t: "SET_LINKED_TICKET",
    ticket: {
      id: nextId("ticket"),
      key: "TEST-1",
      title: "Panel 테스트 티켓",
      status: "In Progress",
      platform: "linear",
      url: "https://linear.app/TEST-1",
    },
  });
  postServerEvent({
    t: "SET_AGENT_MESSAGES",
    messages: [
      {
        id: nextId("am"),
        from_agent: "Test",
        to_agent: "Lint",
        content: "Panel 테스트 메시지",
        timestamp_ms: now,
        message_type: "request",
      },
    ],
  });
  postServerEvent({
    t: "SET_TEAM_CONFIG",
    items: [
      {
        key: "model",
        local_value: "claude-opus-4-6",
        team_value: "claude-sonnet-4-6",
        status: "different",
      },
    ],
  });
  postServerEvent({
    t: "SET_PROMPT_TEMPLATES",
    templates: [
      {
        id: nextId("pt"),
        name: "테스트 템플릿",
        description: "시나리오 생성",
        template: "{{test}}",
        scope: "personal",
        category: "test",
      },
    ],
  });
  postServerEvent({
    t: "SET_COMPLETION_STATS",
    stats: { shown_today: 42, accepted_today: 31, acceptance_rate: 0.738 },
  });
  postServerEvent({ t: "SET_SCOPE_GUARD", includes: ["src/**"], excludes: ["node_modules/**"] });
  postServerEvent({
    t: "SET_PROJECT_FILES",
    workspace_name: "semantica-ide",
    files: ["src/app/App.tsx", "src/shared/protocol/types.ts", "package.json"],
  });
  postServerEvent({
    t: "SET_PATCH_SIMULATION",
    turn_id: "turn_1" as TurnId,
    file_path: "src/app/App.tsx",
    conflict_risk: "low",
    affected_files: ["src/app/App.tsx"],
  });
  postServerEvent({
    t: "SET_PR_SUMMARY",
    summary: {
      title: "feat: Panel state 테스트",
      intent: "패널 상태 시나리오 확인",
      changes: [],
      todos: ["확인 필요"],
    },
  });
  postServerEvent({
    t: "SET_MCP_REGISTRY",
    entries: [
      {
        id: nextId("reg"),
        name: "filesystem",
        description: "File system ops",
        author: "anthropic",
        rating: 4.8,
        install_count: 15000,
        installed: true,
        categories: ["file"],
        compatibility: ">=1.0",
      },
    ],
  });
  postServerEvent({
    t: "SET_BROWSER_ACTIONS",
    actions: [
      { id: nextId("ba"), type: "navigate", value: "http://localhost:3000", timestamp_ms: now },
    ],
  });
  postServerEvent({
    t: "SET_ELEMENT_MAPPINGS",
    mappings: [
      {
        selector: "#app",
        file_path: "src/app/App.tsx",
        line: 1,
        column: 1,
      } satisfies ElementMapping,
    ],
  });

  // eslint-disable-next-line no-console
  console.log("[sim]  Panels state scenario complete (27 event types)");
}

// ─── Re-seed All ──

export async function simScenarioReseed() {
  // eslint-disable-next-line no-console
  console.log("[sim]  Re-running seedAll()...");
  const { t1, t2, t1Files } = seedSession();
  seedFeatures(t1, t2, t1Files);
  seedUiState(t1);
  await sleep(100);
  // eslint-disable-next-line no-console
  console.log("[sim]  Re-seed complete — all features populated");
}
