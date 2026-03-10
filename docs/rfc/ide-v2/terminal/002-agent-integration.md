# RFC-TERMINAL-002: Agent Panel ↔ Terminal 통합

| Field | Value |
|-------|-------|
| ID | RFC-TERMINAL-002-AGENT-INTEGRATION |
| Status | Draft |
| Date | 2026-03-08 |
| Owner | Semantica DevOS |
| Audience | IDE Team, Agent Team |
| Parent | RFC-TERMINAL-000 Overview |
| Depends On | RFC-TERMINAL-001 Architecture |
| Scope | Agent → Terminal 실행 흐름, 세션 모드, provenance, approval, completion callback, reveal policy |

---

## 1. 핵심 구조

Agent Panel이 직접 터미널 UI를 만지는 게 아니라,
**Terminal Runtime / Session Manager에 대해 명령을 내리는 구조**로 잡는다.

```
Agent Panel
   ↓
Agent Runtime
   ↓
Terminal Orchestrator
   ├ create session
   ├ exec command
   ├ observe lifecycle
   └ return result summary
   ↓
PTY Terminal Runtime
   ↓
Shell Process
```

Agent Panel은 PTY 세부사항을 몰라도 된다.
**Terminal Orchestrator**가 중간에서 세션 관리, 실행, 결과 수집을 전부 처리한다.

---

## 2. 실행 모드 3개

### 2.1 Reuse Current Terminal Session

사용자가 보고 있는 terminal 세션에 그대로 명령 주입.

| 항목 | 내용 |
|------|------|
| 장점 | 사용자가 흐름을 바로 본다, 디버깅 쉽다 |
| 단점 | 사용자가 입력 중이면 충돌 가능, 세션 상태가 더럽혀질 수 있다 |
| 용도 | 간단한 lint, 사용자가 직접 보고 싶은 실행 |

### 2.2 Create Dedicated Agent Session (**기본 추천**)

Agent 전용 terminal session 생성 후 그 안에서 실행.

| 항목 | 내용 |
|------|------|
| 장점 | user session과 격리, provenance 명확, lint/test/build 전용 세션 운용 가능 |
| 단점 | 세션 수가 많아질 수 있음 |
| 용도 | lint, test, build — 대부분의 agent 실행 |

탭 표시 예:

```
[You] zsh        [Agent] Lint #12        [Agent] Test #12        [Agent] Build #12
```

### 2.3 Detached Task Session

UI상 terminal 세션처럼 보이지만 실제론 task runner처럼 동작.

| 항목 | 내용 |
|------|------|
| 장점 | long-running task에 적합 |
| 용도 | `pnpm dev`, `vite`, `next dev`, `cargo watch` |

---

## 3. 핵심 API: TerminalExecRequest

단순 `write_input`만 있으면 부족하다.
**exec abstraction**이 있어야 agent panel에서 바로 호출 가능하다.

```typescript
interface TerminalExecRequest {
  /** 기존 세션에 실행할 경우. 없으면 새 세션 생성 */
  sessionId?: string;
  /** sessionId 없을 때 자동 생성 여부 */
  createIfMissing?: boolean;
  /** 실행 주체 */
  source: "user" | "agent" | "task";
  /** 실행 목적 (세션 이름/아이콘에 활용) */
  purpose?: "lint" | "test" | "build" | "run" | "dev-server" | "custom";
  /** 작업 디렉토리 */
  cwd?: string;
  /** 실행할 명령 */
  command: string;
  /** 추가 환경변수 */
  envPatch?: Record<string, string>;
  /** Agent provenance 연결 */
  trigger?: {
    agentRunId?: string;
    toolCallId?: string;
    planStepId?: string;
  };
  /** terminal 패널을 보여줄지 */
  reveal?: boolean;
  /** terminal 에 포커스할지 */
  focus?: boolean;
}
```

### 사용 예시

Agent가 "이 변경 lint 돌려봐"라고 요청받으면:

```typescript
// Agent Runtime 내부
await execInTerminal({
  source: "agent",
  purpose: "lint",
  cwd: "/project",
  command: "pnpm lint",
  createIfMissing: true,
  trigger: {
    agentRunId: currentRun.id,
    toolCallId: currentToolCall.id,
  },
  reveal: false,  // 백그라운드, 실패 시에만 reveal
});
```

그러면 terminal에서는:

1. Agent 전용 세션 생성 (또는 기존 agent 세션 재사용)
2. 실행 중 표시
3. stdout/stderr 스트리밍
4. exit code 수집
5. 에러 파싱
6. Problems panel 연동

까지 바로 된다.

---

## 4. 고수준 Task Wrapper

lint/test/build 같은 건 전부 같은 패턴이라서,
terminal raw exec 위에 **task wrapper**를 두면 더 좋다.

```typescript
interface AgentTaskExecRequest {
  kind: "lint" | "test" | "build" | "typecheck" | "format";
  cwd: string;
  target?: string[];              // 특정 파일/디렉토리만
  sessionMode: "reuse" | "dedicated" | "detached";
  revealPolicy: "always" | "never" | "on-failure";
}
```

내부적으로 이걸 shell command로 바꿔서 terminal에 태운다.

```typescript
// 내부 변환 예시
function resolveCommand(req: AgentTaskExecRequest): string {
  switch (req.kind) {
    case "lint":
      return req.target?.length
        ? `pnpm lint ${req.target.join(" ")}`
        : "pnpm lint";
    case "test":
      return req.target?.length
        ? `pnpm test -- ${req.target.join(" ")}`
        : "pnpm test";
    case "build":
      return "pnpm build";
    case "typecheck":
      return "pnpm tsc --noEmit";
    case "format":
      return "pnpm format";
  }
}
```

장점: agent가 `run lint` 같이 더 높은 수준으로 요청할 수 있다.

---

## 5. Session Provenance

세션이 누구 소유인지 있어야 한다.

```typescript
interface TerminalSessionMeta {
  id: string;
  title: string;
  source: "user" | "agent" | "task" | "system";
  ownerAgentRunId?: string;
  purpose?: "lint" | "test" | "build" | "dev-server" | "custom";
}
```

이게 있어야:

- Agent panel에서 **이 작업이 어느 terminal에서 돌고 있는지** 바로 링크 가능
- Terminal 탭에 **agent badge** 표시 가능
- Agent run 종료 시 관련 세션 정리 정책 적용 가능

---

## 6. Command Provenance & UX

### 6.1 표시

Agent command는 일반 명령과 **다르게 보여야** 한다.

| 요소 | 설명 |
|------|------|
| Badge | `[Agent]` prefix 또는 아이콘 |
| Provenance hover | "Agent Run #12, Tool Call: exec_command" 등 |
| "Why ran this?" tooltip | 이 명령이 어떤 계획 단계에서 나왔는지 |
| Rerun as user | agent 명령을 user로 다시 실행 |
| Copy to shell | 명령어를 현재 user terminal에 복사 |

### 6.2 Provenance 모델

```typescript
interface CommandProvenance {
  source: "user" | "agent" | "task";
  agentRunId?: string;
  toolCallId?: string;
  planStepId?: string;
  approvalState?: "not-needed" | "pending" | "approved" | "rejected";
}
```

---

## 7. Reveal/Focus Policy

Agent가 명령을 실행했을 때 terminal을 어떻게 보여줄지 정책이 필요하다.

| 작업 | 기본 정책 |
|------|-----------|
| lint / test | 백그라운드 실행 + **실패 시에만 reveal** |
| build | 실행 시 reveal 가능 |
| dev server | 항상 별도 세션 + visible |
| one-off command | reveal + focus |

```typescript
type RevealPolicy = "always" | "never" | "on-failure";

interface RevealConfig {
  lint: RevealPolicy;
  test: RevealPolicy;
  build: RevealPolicy;
  "dev-server": RevealPolicy;
  custom: RevealPolicy;
}

const DEFAULT_REVEAL_CONFIG: RevealConfig = {
  lint: "on-failure",
  test: "on-failure",
  build: "on-failure",
  "dev-server": "always",
  custom: "always",
};
```

---

## 8. Command Completion Callback

Agent는 명령 끝난 걸 알아야 다음 스텝으로 간다.

Terminal runtime이 다음 event를 쏴줘야 한다:

| Event | 데이터 |
|-------|--------|
| `command-started` | command id, text, session id |
| `command-ended` | command id, exit code, duration |
| `parsed-errors` | 파싱된 에러 목록 |

이 event들이 있어야 agent가 **feedback loop**를 탈 수 있다:

```
Agent: "lint 돌려봐"
  → exec lint
  → command-ended { exitCode: 1 }
  → parsed-errors: [ { file: "src/foo.ts", line: 42, ... } ]
  → Agent: "foo.ts:42 수정"
  → exec lint (재실행)
  → command-ended { exitCode: 0 }
  → Agent: "lint 통과"
```

### Completion Promise

Agent runtime이 exec 후 completion을 await할 수 있어야 한다:

```typescript
interface TerminalExecResponse {
  sessionId: string;
  commandId: string;
  sessionCreated: boolean;
  meta?: TerminalSessionMeta;
}

// Agent runtime에서 사용
const resp = await execInTerminal(req);

// completion 대기
const result = await waitForCommandCompletion(resp.commandId);
// result: { exitCode: number, duration: number, parsedErrors: ParsedTerminalEvent[] }
```

---

## 9. IDE Surface 연동 흐름

Terminal은 실행만 하고, 결과는 IDE의 다른 surface로 흘린다.

```
Terminal output
   ↓
Output Parser
   ↓
┌──────────────────────────────────────────┐
│  build error  → Problems panel           │
│  test fail    → Test panel               │
│  dev server   → Preview panel            │
│  stack trace  → Debug/Trace panel        │
│  pkg install  → dependency graph refresh │
└──────────────────────────────────────────┘
```

Agent가 lint를 돌리면 단순 로그만 보여주는 게 아니라:

- **어떤 파일**에서
- **몇 줄**에
- **어떤 에러**가 났는지

IDE가 바로 이해하게 된다.

---

## 10. Security / Approval Flow

AI가 terminal에서 명령을 실행할 때 보안이 특히 중요하다.

### 10.1 Approval Mode

| 모드 | 설명 |
|------|------|
| **Auto-run** | safe 명령은 자동 실행 (lint, test, build, typecheck) |
| **Safe mode** | 모든 agent 명령에 사용자 승인 필요 |
| **Allowlist** | 허용된 명령 패턴만 자동 실행 |

### 10.2 Dangerous Command 감지

다음 명령은 agent 실행 시 무조건 승인 필요:

```
rm -rf          git push --force    curl ... | sh
sudo            brew install        npm publish
docker system prune                 chmod 777
```

### 10.3 Policy 구조

```typescript
interface TerminalPolicy {
  /** agent 실행 기본 모드 */
  agentExecMode: "auto" | "safe" | "allowlist";
  /** 자동 허용 명령 패턴 */
  allowPatterns: string[];
  /** 무조건 차단 패턴 */
  denyPatterns: string[];
  /** workspace 밖 실행 차단 */
  enforceWorkspaceBoundary: boolean;
  /** 환경변수 마스킹 패턴 */
  secretPatterns: string[];
}
```

> UI 조건문으로 막지 말고 **런타임 policy 엔진** (Rust side `PolicyGuard`)으로 막아야 한다.

---

## 11. 추천 UX

### Agent Panel에서 실행 버튼

Agent가 명령을 제안하면 3가지 옵션:

| 버튼 | 동작 |
|------|------|
| **Run in Agent Terminal** (기본) | agent 전용 세션에서 실행, 안전 |
| Run in Current Terminal | 현재 user 세션에 주입 |
| Run Detached | 백그라운드 task로 실행 |

### Agent Panel에서 결과 표시

```
┌─ Agent Message ─────────────────────────┐
│ lint를 실행했습니다.                      │
│                                          │
│ ┌─ Terminal: Lint #12 ───────────────┐  │
│ │ $ pnpm lint                        │  │
│ │ ✗ 3 errors, 1 warning             │  │
│ │ [View in Terminal] [Rerun]         │  │
│ └────────────────────────────────────┘  │
│                                          │
│ src/foo.ts:42 — 'bar' is not defined    │
│ src/foo.ts:55 — unused import           │
│ ...                                      │
└──────────────────────────────────────────┘
```

### Terminal 탭에서 Agent 표시

```
┌──────────────────────────────────────────┐
│ [You] zsh  │ [🤖] Lint #12  │ [🤖] Test #12  │
│            │ ✗ exit 1       │ ✓ exit 0       │
└──────────────────────────────────────────┘
```

---

## 12. 데이터 흐름 요약

```
User: "이 변경 lint 돌려봐"
   ↓
Agent Runtime
   ↓
Terminal Orchestrator
   ├─ resolveCommand("lint") → "pnpm lint"
   ├─ resolveSession("dedicated") → create new session
   ├─ policyGuard.check("pnpm lint", "agent") → Allow
   └─ terminal.exec(sessionId, "pnpm lint", trigger)
   ↓
PTY Shell: pnpm lint
   ↓
Terminal Runtime
   ├─ output streaming → xterm.js
   ├─ command tracking → command-started / command-ended events
   ├─ output parsing → ParsedTerminalEvent[]
   └─ task detection → TerminalTaskState
   ↓
Event Bus
   ├─ Agent Runtime: await completion → exitCode, parsedErrors
   ├─ Problems Panel: build-error events
   ├─ Terminal UI: command block + decorations
   └─ Agent Panel: result summary card
   ↓
Agent: exitCode !== 0
   → "foo.ts:42 수정할게"
   → fix code
   → rerun lint
   → exitCode === 0
   → "lint 통과"
```

---

## 관련 문서

- [000-overview.md](./000-overview.md) — 제품 정의 & 전체 기능 스펙
- [001-architecture.md](./001-architecture.md) — Tauri 구현 아키텍처
