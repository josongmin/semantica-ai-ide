import type {
  AppNotification,
  AuthStatus,
  BugbotStatus,
  DebugState,
  QuotaStatus,
  SandboxStatus,
  TestResults,
  TurnId,
} from "../../../shared/protocol";
import { nextId, postServerEvent, postServerEvents } from "../devUtils";

/**
 * Seeds P0, P1, P2, and SOTA feature data: terminal output, test results,
 * diagnostics, quota, notifications, auth, hooks, worktree, file changes,
 * CI/CD, security, deploy, prompt suggestions, debug state, sandbox, plugins,
 * agent wave, verifier, living spec, session schedule, agent steer, bugbot,
 * agent rules, auto context, speculative edits, background job, replay session,
 * and debate session.
 */
export function seedP0P1P2(t1: TurnId) {
  const now = Date.now();

  // ─── P0: Terminal Output ──────────────────────────────────
  postServerEvent({
    t: "APPEND_TERMINAL_OUTPUT",
    chunk: {
      tool_call_id: "tc-seed-1",
      stream: "stdout",
      chunk:
        "$ vitest run\n \u2713 src/features/streaming/__tests__/dispatchServerEvent.test.ts (42 tests) 1240ms\n \u2713 src/shared/protocol/__tests__/isServerEvent.test.ts (8 tests) 120ms\n\nTest Files  2 passed (2)\nTests       50 passed (50)\n",
      timestamp_ms: now,
    },
  });

  // ─── P0: Test Results ────────────────────────────────────
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
          name: "should dispatch UPSERT_MESSAGE",
          suite: "dispatchServerEvent",
          status: "pass",
          duration_ms: 8,
        },
        {
          name: "should dispatch APPEND_TEXT",
          suite: "dispatchServerEvent",
          status: "pass",
          duration_ms: 5,
        },
        {
          name: "should reset all stores",
          suite: "dispatchServerEvent",
          status: "pass",
          duration_ms: 15,
        },
        { name: "skipped: integration test", suite: "e2e", status: "skip", duration_ms: 0 },
      ],
      command: "vitest run",
    } satisfies TestResults,
  });

  // ─── P0: Diagnostics ─────────────────────────────────────
  postServerEvent({
    t: "SET_DIAGNOSTICS",
    file_path: "src/widgets/message-row/MessageRow.tsx",
    diagnostics: [
      {
        id: nextId("diag"),
        file_path: "src/widgets/message-row/MessageRow.tsx",
        line: 45,
        column: 12,
        severity: "warning",
        source: "type_checker",
        code: "TS2345",
        message: "Argument of type 'string' is not assignable to parameter of type 'MessageId'",
      },
      {
        id: nextId("diag"),
        file_path: "src/widgets/message-row/MessageRow.tsx",
        line: 78,
        severity: "info",
        source: "linter",
        code: "no-console",
        message: "Unexpected console statement",
      },
    ],
  });

  // ─── P0: Quota Status ────────────────────────────────────
  postServerEvent({
    t: "SET_QUOTA_STATUS",
    status: {
      alert_level: "normal",
      budget_usd: 20,
      spent_usd: 3.42,
      remaining_usd: 16.58,
      rate_limit_remaining: 45,
      rate_limit_reset_ms: now + 60_000,
    } satisfies QuotaStatus,
  });

  // ─── P0: Notifications ───────────────────────────────────
  postServerEvents([
    {
      t: "PUSH_NOTIFICATION",
      notification: {
        id: nextId("notif"),
        type: "agent_complete",
        urgency: "normal",
        title: "에이전트 완료",
        message: "리팩토링 작업이 성공적으로 완료되었습니다",
        timestamp_ms: now - 30_000,
        auto_dismiss_ms: 10_000,
      } satisfies AppNotification,
    },
    {
      t: "PUSH_NOTIFICATION",
      notification: {
        id: nextId("notif"),
        type: "warning",
        urgency: "high",
        title: "보안 경고",
        message: "의존성 취약점 1건 발견 (lodash < 4.17.21)",
        timestamp_ms: now - 15_000,
      } satisfies AppNotification,
    },
  ]);

  // ─── P0: Auth Status ─────────────────────────────────────
  postServerEvent({
    t: "SET_AUTH_STATUS",
    status: {
      state: "authenticated",
      provider: "github",
      user_email: "dev@example.com",
      expires_at_ms: now + 3_600_000,
    } satisfies AuthStatus,
  });

  // ─── P1: Hook Event ──────────────────────────────────────
  postServerEvent({
    t: "SET_HOOK_EVENT",
    event: {
      id: nextId("hook"),
      hook_name: "PostToolUse",
      phase: "completed",
      tool_name: "write_file",
      decision: "allow",
      duration_ms: 12,
      timestamp_ms: now - 5_000,
    },
  });

  // ─── P1: Worktree Status ─────────────────────────────────
  postServerEvent({
    t: "SET_WORKTREE_STATUS",
    worktree: {
      id: nextId("wt"),
      branch: "feat/new-pipeline",
      path: "/tmp/worktrees/feat-new-pipeline",
      phase: "active",
      created_at_ms: now - 300_000,
      base_branch: "main",
    },
  });

  // ─── P1: External File Change ────────────────────────────
  postServerEvent({
    t: "FILE_CHANGE_EXTERNAL",
    change: {
      file_path: "package.json",
      change_type: "modified",
      timestamp_ms: now - 10_000,
      detail: "npm install completed",
    },
  });

  // ─── P1: CI/CD Status ────────────────────────────────────
  postServerEvent({
    t: "SET_CI_CD_STATUS",
    pipeline: {
      id: nextId("ci"),
      name: "Build & Test",
      phase: "pass",
      url: "https://github.com/user/repo/actions/runs/12345",
      branch: "feat/new-pipeline",
      commit_sha: "abc1234",
      started_at_ms: now - 120_000,
      finished_at_ms: now - 60_000,
      steps: [
        { name: "Install", phase: "pass", duration_ms: 12_000 },
        { name: "Lint", phase: "pass", duration_ms: 8_000 },
        { name: "Test", phase: "pass", duration_ms: 35_000 },
        { name: "Build", phase: "pass", duration_ms: 18_000 },
      ],
    },
  });

  // ─── P1: Security Scan ───────────────────────────────────
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
          description: "Prototype pollution vulnerability (CVE-2021-23337)",
          cve: "CVE-2021-23337",
          remediation: "npm update lodash",
        },
      ],
      summary: { critical: 0, high: 0, medium: 1, low: 0 },
      timestamp_ms: now - 60_000,
    },
  });

  // ─── P1: Deploy Status ───────────────────────────────────
  postServerEvent({
    t: "SET_DEPLOY_STATUS",
    deploy: {
      id: nextId("deploy"),
      target: "preview",
      phase: "live",
      url: "https://preview-abc123.vercel.app",
      health_check_passed: true,
      started_at_ms: now - 90_000,
      finished_at_ms: now - 45_000,
    },
  });

  // ─── P1: Prompt Suggestions ──────────────────────────────
  postServerEvents([
    {
      t: "PUSH_PROMPT_SUGGESTION",
      suggestion: {
        id: nextId("sug"),
        text: "이 코드의 테스트를 작성해줘",
        context: "post-turn",
        confidence: 0.9,
      },
    },
    {
      t: "PUSH_PROMPT_SUGGESTION",
      suggestion: {
        id: nextId("sug"),
        text: "성능 최적화 방법을 제안해줘",
        context: "post-turn",
        confidence: 0.75,
      },
    },
    {
      t: "PUSH_PROMPT_SUGGESTION",
      suggestion: {
        id: nextId("sug"),
        text: "보안 취약점을 점검해줘",
        context: "post-turn",
        confidence: 0.65,
      },
    },
  ]);

  // ─── P1: Debug State ─────────────────────────────────────
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
          evidence: "Chrome DevTools heap snapshot에서 detached DOM 노드 발견",
        },
        {
          id: nextId("hyp"),
          description: "Race condition: 비동기 상태 업데이트 충돌",
          status: "refuted",
          confidence: 0.3,
        },
      ],
    } satisfies DebugState,
  });

  // ─── P2: Sandbox Status ──────────────────────────────────
  postServerEvent({
    t: "SET_SANDBOX_STATUS",
    status: {
      enabled: true,
      network_policy: "allowlist",
      allowed_hosts: ["registry.npmjs.org", "api.github.com"],
      denied_hosts: [],
      violations: [
        {
          type: "network",
          target: "analytics.google.com",
          blocked: true,
          timestamp_ms: now - 20_000,
        },
      ],
    } satisfies SandboxStatus,
  });

  // ─── P2: Plugin Status ───────────────────────────────────
  postServerEvent({
    t: "SET_PLUGIN_STATUS",
    plugins: [
      { id: "plugin-eslint", name: "ESLint Integration", version: "3.2.1", phase: "installed" },
      { id: "plugin-prettier", name: "Prettier Formatter", version: "2.0.0", phase: "installed" },
      { id: "plugin-docker", name: "Docker Runner", version: "1.0.0-beta", phase: "available" },
    ],
  });

  // ─── P2: Agent Wave ──────────────────────────────────────
  postServerEvent({
    t: "SET_AGENT_WAVE",
    wave: {
      wave_id: nextId("wave"),
      wave_number: 1,
      phase: "completed",
      agent_ids: ["agent-lint", "agent-test", "agent-type-check"],
      completed_count: 3,
      total_count: 3,
      started_at_ms: now - 180_000,
    },
  });

  // ─── P2: Verifier Result ─────────────────────────────────
  postServerEvent({
    t: "SET_VERIFIER_RESULT",
    result: {
      id: nextId("vr"),
      spec_section: "Pipeline invariant: all file changes must be approved",
      outcome: "pass",
      message: "모든 파일 변경이 승인 프로세스를 통과했습니다",
      inconsistencies: [],
      timestamp_ms: now - 30_000,
    },
  });

  // ─── P2: Living Spec ─────────────────────────────────────
  postServerEvent({
    t: "UPDATE_LIVING_SPEC",
    spec: {
      id: nextId("spec"),
      title: "Semantica Code Agent Architecture",
      content:
        "# Architecture\n\n## Feature-Sliced Design\napp → pages → widgets → features → entities → shared\n\n## ServerEvent Protocol\nDiscriminated union on `t` field...",
      version: 3,
      last_updated_ms: now - 60_000,
      sections_completed: 12,
      sections_total: 15,
    },
  });

  // ─── P2: Session Schedule ────────────────────────────────
  postServerEvent({
    t: "SET_SESSION_SCHEDULE",
    schedules: [
      {
        id: nextId("sched"),
        label: "매일 보안 스캔",
        frequency: "daily",
        next_run_ms: now + 86_400_000,
        last_run_ms: now - 86_400_000,
        enabled: true,
        prompt: "전체 코드베이스 보안 취약점 스캔 실행",
      },
      {
        id: nextId("sched"),
        label: "주간 의존성 업데이트",
        frequency: "weekly",
        next_run_ms: now + 604_800_000,
        enabled: true,
        prompt: "npm audit fix 실행 및 주요 의존성 업데이트 확인",
      },
    ],
  });

  // ─── P2: Agent Steer ─────────────────────────────────────
  postServerEvent({
    t: "STEER_AGENT",
    steer: {
      agent_id: "agent-test",
      action: "redirect",
      reason: "테스트 범위를 integration으로 확장",
      redirect_prompt: "unit 테스트 외에 integration 테스트도 추가해주세요",
      timestamp_ms: now - 10_000,
    },
  });

  // ─── P2: Bugbot Status ───────────────────────────────────
  postServerEvent({
    t: "SET_BUGBOT_STATUS",
    status: {
      phase: "idle",
      issues: [
        {
          id: nextId("bug"),
          title: "메모리 누수: EventListener cleanup 누락",
          file_path: "src/widgets/message-row/MessageRow.tsx",
          line: 92,
          severity: "warning",
          auto_fixable: true,
        },
        {
          id: nextId("bug"),
          title: "Null 참조 가능성",
          file_path: "src/features/streaming/model/dispatchServerEvent.ts",
          line: 310,
          severity: "info",
          auto_fixable: false,
        },
      ],
      last_scan_ms: now - 600_000,
    } satisfies BugbotStatus,
  });

  // ─── SOTA: Agent Rules ─────────────────────────────────
  const consoleLogRuleId = nextId("rule");
  postServerEvent({
    t: "SET_AGENT_RULES",
    rules: [
      {
        id: nextId("rule"),
        title: "TypeScript strict 모드 사용",
        content: "strictNullChecks 항상 활성화",
        source: "file",
        file_path: ".cursorrules",
        status: "active",
        violation_count: 0,
      },
      {
        id: consoleLogRuleId,
        title: "콘솔 로그 금지",
        content: "프로덕션에서 console.log 사용 금지",
        source: "user",
        status: "active",
        violation_count: 2,
      },
      {
        id: nextId("rule"),
        title: "Named export 사용",
        content: "default export 대신 named export 사용",
        source: "team",
        status: "active",
        violation_count: 0,
      },
    ],
  });
  postServerEvent({
    t: "PUSH_RULE_VIOLATION",
    violation: {
      id: nextId("rv"),
      rule_id: consoleLogRuleId,
      turn_id: t1 as string,
      description: "console.log('debug') 발견: src/utils/helpers.ts:42",
      severity: "warning",
      timestamp_ms: now - 120_000,
    },
  });
  postServerEvent({
    t: "PUSH_RULE_VIOLATION",
    violation: {
      id: nextId("rv"),
      rule_id: consoleLogRuleId,
      turn_id: t1 as string,
      description: "console.warn('temp') 발견: src/app/config.ts:18",
      severity: "error",
      timestamp_ms: now - 60_000,
    },
  });

  // ─── SOTA: Auto Context ──────────────────────────────────
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
        {
          id: nextId("ctx"),
          file_path: "src/features/streaming/model/dispatchServerEvent.ts",
          relevance_score: 0.82,
          reason: "이벤트 디스패처",
          token_cost: 1800,
          accepted: true,
        },
        {
          id: nextId("ctx"),
          file_path: "src/pages/chat/ChatPage.tsx",
          relevance_score: 0.65,
          reason: "메인 레이아웃",
          token_cost: 900,
          accepted: false,
        },
      ],
      total_token_cost: 5100,
      budget_tokens: 8000,
      status: "ready",
    },
  });

  // ─── SOTA: Speculative Edits ─────────────────────────────
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
        {
          id: nextId("spec"),
          file_path: "src/app/config.ts",
          original_text: "const timeout = 5000;",
          proposed_text: "const timeout = 10_000;",
          line_start: 7,
          line_end: 7,
          confidence: 0.72,
          risk_level: "moderate",
          status: "pending",
        },
      ],
      status: "ready",
      model_id: "claude-sonnet-4-6",
    },
  });

  // ─── SOTA: Background Job ────────────────────────────────
  postServerEvent({
    t: "UPSERT_BACKGROUND_JOB",
    job: {
      id: nextId("job"),
      label: "린트 자동 수정",
      phase: "running",
      progress: 60,
      agent_model: "claude-sonnet-4-6",
      created_at_ms: now - 30_000,
      current_step: "src/widgets/ 분석 중...",
      steps_completed: 3,
      steps_total: 5,
      files_changed: 4,
      cloud: false,
    },
  });

  // ─── SOTA: Replay Session ─────────────────────────────
  postServerEvent({
    t: "SET_REPLAY_SESSION",
    session: {
      steps: [
        {
          id: nextId("rs"),
          index: 0,
          type: "tool_call",
          summary: "파일 읽기: src/app/App.tsx",
          files_affected: ["src/app/App.tsx"],
          timestamp_ms: now - 5000,
          duration_ms: 200,
          can_branch: true,
        },
        {
          id: nextId("rs"),
          index: 1,
          type: "model_response",
          summary: "App.tsx 수정: 라우트 추가",
          files_affected: ["src/app/App.tsx"],
          timestamp_ms: now - 4000,
          duration_ms: 500,
          can_branch: true,
        },
        {
          id: nextId("rs"),
          index: 2,
          type: "tool_call",
          summary: "테스트 실행",
          files_affected: [],
          timestamp_ms: now - 3000,
          duration_ms: 1500,
          can_branch: false,
        },
      ],
      current_index: 1,
      total_steps: 3,
      source_turn_id: t1,
      status: "paused",
      playback_speed: 1,
    },
  });

  // ─── SOTA: Debate Session ─────────────────────────────
  postServerEvent({
    t: "SET_DEBATE_SESSION",
    turn_id: "turn_1" as TurnId,
    session: {
      id: nextId("debate"),
      prompt: "이 버그의 근본 원인은 무엇인가?",
      agents: [
        {
          id: nextId("agent"),
          model_id: "claude-opus-4-6",
          label: "Opus (보수적)",
          status: "done",
          confidence: 0.85,
          files_changed: 2,
          tokens_used: 3200,
          duration_ms: 4500,
        },
        {
          id: nextId("agent"),
          model_id: "claude-sonnet-4-6",
          label: "Sonnet (공격적)",
          status: "done",
          confidence: 0.72,
          files_changed: 4,
          tokens_used: 2100,
          duration_ms: 2800,
        },
      ],
      status: "decided",
      consensus: {
        winner_id: "agent-1",
        method: "auto_judge",
        scores: [
          {
            agent_id: "agent-1",
            score: 0.85,
            reasoning: "race condition 진단이 정확하고 보수적 접근이 안전",
          },
          { agent_id: "agent-2", score: 0.72, reasoning: "수정 범위가 넓어 사이드 이펙트 우려" },
        ],
        merged: false,
      },
      created_at_ms: now - 10_000,
    },
  });
}
