# RFC-017-V2: Agent Panel ↔ Terminal Execution Bridge

| Field | Value |
|-------|-------|
| ID | RFC-017-V2-AGENT-TERMINAL-BRIDGE |
| Status | Draft |
| Date | 2026-03-08 |
| Owner | Semantica DevOS |
| Audience | IDE Team, Agent Team, Runtime Team |
| Depends On | RFC-016-V2 Floating Console, RFC-TERMINAL-001 Architecture, Agent Runtime, Engine Rust Runtime |
| Scope | Agent-driven terminal session creation, command execution, lifecycle events, provenance, reveal policy, execution result bridge |
| Non-Goals | full task planner spec, debugger protocol integration, remote SSH orchestration, terminal renderer implementation |

---

## 1. Summary

AI agent가 IDE 내부에서 lint/test/build/dev/run 같은 shell 기반 작업을 실행할 수 있도록,
**Agent Panel과 Terminal Runtime 사이에 표준 execution bridge**를 정의한다.

이 bridge는 다음을 보장한다:

- Agent가 새 terminal session을 생성하거나 기존 세션을 재사용할 수 있다
- Agent 실행 명령은 **provenance**와 함께 기록된다
- Terminal stdout/stderr는 UI에 표시되고, 동시에 agent runtime이 관찰할 수 있다
- 명령 완료 시 **exit code, parsed diagnostics, summary**가 agent loop로 반환된다
- **reveal/focus/approval 정책**을 통해 UX와 안전성을 통제한다

---

## 2. Design Goals

### 2.1 Goals

- Agent → Terminal 실행 경로를 표준화
- lint/test/build/dev server를 동일한 abstraction으로 실행
- user-owned session과 agent-owned session을 구분
- terminal output을 raw text + semantic events로 동시에 소비
- command completion을 agent workflow에 다시 연결
- replay/retry/fix-and-rerun이 가능한 구조 마련

### 2.2 Non-Goals

- 자연어 task planning 전체 정의
- container/remote runtime orchestration 전체
- shell completion/autocomplete
- terminal renderer 상세 구현
- tmux 수준 multiplexing

---

## 3. High-Level Architecture

### 3.1 실행 방향

```
Agent Panel
   ↓
Agent Runtime
   ↓
AgentTerminalBridge
   ↓
Terminal Orchestrator
   ↓
Terminal Runtime / PTY Host
   ↓
Shell Process
```

### 3.2 이벤트 방향 (역방향)

```
Shell Output / Exit / Parsed Events
   ↓
Terminal Runtime
   ↓
Terminal Orchestrator
   ↓
AgentTerminalBridge
   ↓
Agent Runtime
   ↓
Agent Panel / Planner / Tool Loop
```

**핵심:** Agent Panel이 PTY를 직접 알지 않아야 한다.
중간에 `AgentTerminalBridge`와 `Terminal Orchestrator`가 있어야 한다.

---

## 4. Core Concepts

### 4.1 Session Ownership

세션은 소유 주체를 가진다.

```typescript
type TerminalSessionSource = "user" | "agent" | "task" | "system";
```

| Source | 설명 |
|--------|------|
| `user` | 사용자가 직접 만든 세션 |
| `agent` | agent가 생성한 전용 세션 |
| `task` | task runner 성격의 세션 |
| `system` | IDE 내부 운영 세션 |

### 4.2 Session Modes

```typescript
type TerminalSessionMode =
  | "reuse-current"
  | "reuse-by-id"
  | "dedicated"
  | "detached";
```

| Mode | 설명 | 용도 |
|------|------|------|
| `reuse-current` | 현재 활성 terminal 사용 | 간단한 확인 명령 |
| `reuse-by-id` | 특정 sessionId에 명령 주입 | 기존 agent 세션 재사용 |
| `dedicated` | 새 agent 전용 세션 생성 | **lint/test/build (기본 추천)** |
| `detached` | task-like 백그라운드 세션 | dev/watch server |

### 4.3 Purpose

명령 의도를 purpose로 명시한다.

```typescript
type TerminalPurpose =
  | "lint"
  | "test"
  | "build"
  | "run"
  | "dev-server"
  | "format"
  | "install"
  | "custom";
```

이게 있어야 UI/정책/파서/요약이 좋아진다.

### 4.4 Reveal Policy

```typescript
type RevealPolicy =
  | "always"
  | "never"
  | "on-failure"
  | "on-output"
  | "if-visible";
```

| 작업 | 권장 기본 |
|------|-----------|
| lint / test | `on-failure` |
| build | `on-output` 또는 `on-failure` |
| dev-server | `always` |

### 4.5 Approval Policy

```typescript
type ApprovalPolicy =
  | "not-required"
  | "required"
  | "required-for-dangerous"
  | "inherit-workspace-policy";
```

| 예시 | 판단 |
|------|------|
| `pnpm lint` | 보통 승인 불필요 |
| `rm -rf` / `git push` / `npm publish` | 승인 필요 |

---

## 5. Request / Response Spec

### 5.1 AgentTerminalExecRequest

```typescript
interface AgentTerminalExecRequest {
  // ── Session selection ──
  sessionMode: TerminalSessionMode;
  sessionId?: string;
  reuseStrategy?: "prefer-idle-agent-session" | "prefer-current" | "must-create-new";

  // ── Identity ──
  source: "agent";
  purpose: TerminalPurpose;
  title?: string;

  // ── Execution ──
  cwd: string;
  command: string;
  args?: string[];
  envPatch?: Record<string, string>;
  shell?: "default" | "bash" | "zsh" | "sh" | "pwsh" | "cmd";

  // ── UX policy ──
  revealPolicy?: RevealPolicy;
  focus?: boolean;
  approvalPolicy?: ApprovalPolicy;

  // ── Provenance ──
  trigger: {
    agentRunId: string;
    toolCallId?: string;
    stepId?: string;
    panelInvocationId?: string;
  };

  // ── Parser hints ──
  parseMode?: "default" | "raw-only" | "semantic-preferred";
  expectedKinds?: Array<
    | "diagnostic"
    | "test-result"
    | "build-result"
    | "port-binding"
    | "progress"
    | "raw-output"
  >;

  // ── Lifecycle ──
  timeoutMs?: number;
  cancellationKey?: string;
}
```

### 5.2 AgentTerminalExecResponse

실행 **시작 승인**이지, 완료 결과가 아니다.
완료 결과는 이벤트로 오거나 awaitable completion API로 받는다.

```typescript
interface AgentTerminalExecResponse {
  executionId: string;
  sessionId: string;
  commandId: string;

  createdSession: boolean;
  revealed: boolean;
  focused: boolean;

  approvalState: "approved" | "pending" | "rejected" | "not-required";

  sessionMeta: {
    title: string;
    source: "agent";
    purpose: TerminalPurpose;
  };
}
```

---

## 6. Completion Spec

### 6.1 TerminalCommandCompletedEvent

```typescript
interface TerminalCommandCompletedEvent {
  executionId: string;
  sessionId: string;
  commandId: string;

  status: "succeeded" | "failed" | "cancelled" | "timed-out";
  exitCode?: number;
  signal?: string;

  startedAt: number;
  endedAt: number;
  durationMs: number;

  outputSummary: {
    stdoutLineCount: number;
    stderrLineCount: number;
    errorCount: number;
    warningCount: number;
  };

  parsed: {
    diagnostics?: ParsedDiagnostic[];
    testSummary?: TestSummary;
    buildSummary?: BuildSummary;
    portBindings?: number[];
    taskSummary?: TaskSummary;
  };

  /** 마지막 N줄 (agent가 빠르게 맥락 파악용) */
  tailOutput?: string[];
}
```

### 6.2 Agent-visible Awaitable Result

Agent runtime 입장에서는 이런 식으로 받고 싶다:

```typescript
interface AgentTerminalExecutionResult {
  executionId: string;
  sessionId: string;
  commandId: string;

  finalStatus: "succeeded" | "failed" | "cancelled" | "timed-out";
  exitCode?: number;
  durationMs: number;

  diagnostics: ParsedDiagnostic[];
  testSummary?: TestSummary;
  buildSummary?: BuildSummary;
  taskSummary?: TaskSummary;

  tailOutput: string[];
}
```

내부적으로는 이벤트 기반이어도, agent 쪽에는 `await runTerminalCommand(...)` 같은 느낌으로 감쌀 수 있다.

---

## 7. Event Contract

### 7.1 Event Types

```typescript
type AgentTerminalEvent =
  | SessionCreatedEvent
  | SessionStatusChangedEvent
  | CommandStartedEvent
  | CommandOutputEvent
  | ParsedSemanticEvent
  | CommandCompletedEvent
  | ApprovalRequiredEvent
  | ExecutionRevealEvent;
```

### 7.2 CommandStartedEvent

```typescript
interface CommandStartedEvent {
  executionId: string;
  sessionId: string;
  commandId: string;
  command: string;
  cwd: string;
  purpose: TerminalPurpose;

  trigger: {
    agentRunId: string;
    toolCallId?: string;
    stepId?: string;
  };

  startedAt: number;
}
```

### 7.3 CommandOutputEvent

```typescript
interface CommandOutputEvent {
  executionId: string;
  sessionId: string;
  commandId: string;

  stream: "stdout" | "stderr";
  chunk: string;
  timestamp: number;
}
```

Agent가 모든 raw output을 다 받을 필요는 없다.
정책적으로 tail / batch / semantic summary만 받을 수도 있다.

### 7.4 ParsedSemanticEvent

```typescript
interface ParsedSemanticEvent {
  executionId: string;
  sessionId: string;
  commandId: string;

  kind:
    | "diagnostic"
    | "test-result"
    | "build-result"
    | "progress"
    | "port-binding"
    | "url"
    | "stack-frame";

  payload: Record<string, unknown>;
  timestamp: number;
}
```

### 7.5 ApprovalRequiredEvent

```typescript
interface ApprovalRequiredEvent {
  executionId: string;
  proposedCommand: string;
  reason:
    | "dangerous-command"
    | "workspace-write"
    | "network-access"
    | "git-push"
    | "publish"
    | "unknown-policy";
}
```

---

## 8. Frontend Bridge API

프론트엔드에서 agent panel이 직접 쓰는 façade:

```typescript
interface AgentTerminalBridge {
  /** 명령 실행 요청 */
  execute(request: AgentTerminalExecRequest): Promise<AgentTerminalExecResponse>;

  /** 명령 완료 대기 (agent loop에서 await) */
  awaitCompletion(executionId: string): Promise<AgentTerminalExecutionResult>;

  /** 실행 취소 */
  cancelExecution(executionId: string): Promise<void>;

  /** terminal 세션 표시 */
  revealSession(sessionId: string): void;

  /** terminal 세션 포커스 */
  focusSession(sessionId: string): void;

  /** executionId → sessionId/commandId 매핑 조회 */
  getExecutionLink(executionId: string): {
    sessionId: string;
    commandId: string;
  };

  /** 이벤트 구독 */
  subscribe(listener: (event: AgentTerminalEvent) => void): () => void;
}
```

이 인터페이스를 쓰면 **agent panel은 terminal 구현 세부를 몰라도 된다**.

---

## 9. Terminal Orchestrator Spec

이 레이어가 실질적인 정책 판단을 한다.

**역할:**

| 역할 | 설명 |
|------|------|
| 세션 선택 | mode + reuseStrategy 기반 |
| reveal/focus 판단 | policy + status 기반 |
| approval policy 검사 | PolicyGuard 호출 |
| terminal runtime 호출 | PTY host에 exec 전달 |
| output/parsed event fanout | agent runtime + UI 양쪽으로 |
| command completion aggregation | exit code + parsed → result 조합 |

**인터페이스:**

```typescript
interface TerminalOrchestrator {
  execute(request: AgentTerminalExecRequest): Promise<AgentTerminalExecResponse>;
  cancel(executionId: string): Promise<void>;
  replay(
    commandId: string,
    overrides?: Partial<AgentTerminalExecRequest>,
  ): Promise<AgentTerminalExecResponse>;
}
```

---

## 10. Session Selection Rules

세션 선택은 **deterministic**해야 한다.

### `reuse-current`

조건:
1. 현재 활성 terminal이 있고
2. running interactive command가 없고
3. source가 user/agent 재사용 허용일 때만 사용

아니면 실패하거나 `dedicated`로 fallback.

### `reuse-by-id`

조건:
1. 지정 session 존재
2. alive 상태
3. locked 상태 아님

### `dedicated`

- 항상 새 세션 생성
- title 자동 생성: `Agent Lint`, `Agent Test`, `Agent Build`

### `detached`

- 세션은 생성하지만 foreground focus 강제 안 함
- dev server / watch 용도 적합

---

## 11. Agent UX Spec — Command Card (인라인 썸네일)

### 11.1 핵심 UX 원칙

Agent가 terminal에서 명령을 실행하면, Agent Panel 대화 흐름 안에
**Command Card**가 인라인 썸네일로 삽입된다.

이 카드는:
- 실행 중인 명령의 **실시간 출력 프리뷰**를 보여준다 (마지막 3~5줄)
- 상태(running/succeeded/failed/cancelled)를 시각적으로 표시한다
- **우측 상단 버튼**을 누르면 해당 terminal 세션으로 즉시 이동한다
- 접기(▿) 가능하고, 펼치면 더 많은 출력을 볼 수 있다

> 사용자는 Agent Panel을 떠나지 않고도 실행 상황을 파악할 수 있어야 하고,
> 필요할 때만 terminal 세션으로 점프할 수 있어야 한다.

### 11.2 Command Card 레이아웃

**실행 중 (Running):**

```
┌──────────────────────────────────────────────────┐
│ ◌ Running command: source, pytest             [↗] [×] │
│ ─────────────────────────────────────────────────│
│ $ source .venv/bin/activate && pytest            │
│     apps/mcp/tests/test_fluent_query.py -k …     │
│                                                   │
│   Expected: query_by_payload_from_key(…           │
│     Actual: query_by_payload_from_key(…           │
│   1 failed, 1 passed, 12 deselected in 0.24s     │
│                                           [▿ more]│
└──────────────────────────────────────────────────┘
```

**완료 (Ran / Failed / Cancelled):**

```
┌──────────────────────────────────────────────────┐
│ Ran command: source, pytest                   [↗] │
│ ─────────────────────────────────────────────────│
│ $ source .venv/bin/activate && pytest            │
│     apps/mcp/tests/test_fluent_query.py -k …     │
│                                                   │
│   1 failed, 1 passed, 12 deselected in 0.24s     │
│                                           [▿ more]│
└──────────────────────────────────────────────────┘
```

**병렬 실행 (여러 카드 동시 표시):**

```
┌──────────────────────────────────────────────────┐
│ ◌ Running command: source, cargo test         [↗] [×] │
│ ─────────────────────────────────────────────────│
│ $ source scripts/source-sota-env.sh &&           │
│     cargo test -p quanta-planner …               │
│   Blocking waiting for file lock on build dir    │
│                                           [▿ more]│
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│ ◌ Running command: source, cargo test         [↗] [×] │
│ ─────────────────────────────────────────────────│
│ $ source scripts/source-sota-env.sh &&           │
│     cargo test -p codegraph-core-runtime …       │
│   Compiling codegraph-core-smt v0.1.0            │
│   Compiling codegraph-core-dfg v0.1.0            │
│                                           [▿ more]│
└──────────────────────────────────────────────────┘
```

### 11.3 Card 구성 요소

| 요소 | 위치 | 설명 |
|------|------|------|
| **Status indicator** | 헤더 왼쪽 | `◌` spinning (running), `✓` (succeeded), `✗` (failed), `⊘` (cancelled) |
| **Title** | 헤더 | `Running command: <keywords>` / `Ran command: <keywords>` / `Cancelled command: <keywords>` |
| **Jump button** `[↗]` | 헤더 우측 | 클릭 시 해당 terminal 세션으로 이동 (reveal + focus) |
| **Cancel button** `[×]` | 헤더 우측 (running일 때만) | 실행 취소 |
| **Command line** | 본문 상단 | `$ <full command>` — 볼드 키워드 강조 |
| **Output preview** | 본문 | 마지막 3~5줄 tail output, ANSI 색상 유지 |
| **Expand toggle** `[▿]` | 본문 하단 | 접기/펼치기 — 펼치면 더 많은 출력 표시 |
| **Exit code badge** | 헤더 또는 하단 | 완료 시 `exit 0` (green) / `exit 1` (red) |

### 11.4 Jump Button (`[↗]`) 동작

우측 상단 `[↗]` 버튼은 **해당 terminal 세션으로 즉시 이동**한다.

내부 동작:

```typescript
function handleJumpToTerminal(executionId: string) {
  const link = bridge.getExecutionLink(executionId);

  // 1. Bottom panel에 terminal이 있으면 → bottom panel 열기 + 해당 세션 탭 활성화
  setBottomPanelVisible(true);
  setActiveBottomPanel("terminal");
  setActiveTerminalSession(link.sessionId);

  // 2. Terminal이 surface로 승격된 경우 → surface 전환
  // setActiveSurface("terminal");

  // 3. 해당 command block으로 스크롤
  scrollToCommand(link.commandId);
}
```

**UX 규칙:**
- Running 상태: jump하면 실시간 출력 하단으로 auto-scroll
- Completed 상태: jump하면 해당 command block 위치로 스크롤
- 여러 카드가 같은 세션일 경우: 해당 command block으로 정확히 이동

### 11.5 Card 상태별 스타일

| 상태 | 헤더 텍스트 | 보더/배경 | 아이콘 |
|------|------------|-----------|--------|
| `running` | `Running command: ...` | 기본 border, subtle pulse | `◌` spinning |
| `succeeded` | `Ran command: ...` | 기본 border | 없음 (조용한 성공) |
| `failed` | `Ran command: ...` | `border-vsc-error/30` | 없음 (output에서 에러 보임) |
| `cancelled` | `Cancelled command: ...` | `opacity-60` | `⊘` |

### 11.6 Output Preview 규칙

| 규칙 | 설명 |
|------|------|
| 기본 줄 수 | 마지막 **4줄** |
| 펼침 시 | 마지막 **20줄** (full output은 terminal에서) |
| ANSI 처리 | 색상 유지 — xterm.js mini renderer 또는 CSS class 변환 |
| 긴 줄 | 가로 스크롤 또는 `text-overflow: ellipsis` |
| Running 중 | 실시간 업데이트 — 마지막 줄이 계속 갱신됨 |
| Empty output | `(no output yet)` placeholder |

### 11.7 Command Card 데이터 모델

```typescript
interface AgentCommandCard {
  executionId: string;
  sessionId: string;
  commandId: string;

  /** 카드 제목에 쓸 키워드 (command에서 추출) */
  titleKeywords: string;
  /** 전체 명령어 */
  fullCommand: string;
  /** 상태 */
  status: "running" | "succeeded" | "failed" | "cancelled";

  /** 출력 프리뷰 (tail N줄) */
  outputTail: string[];
  /** 출력 전체 줄 수 (펼침 가능 여부 판단용) */
  totalOutputLines: number;

  /** exit code (완료 시) */
  exitCode?: number;
  /** 실행 시간 */
  startedAt: number;
  endedAt?: number;

  /** UI 상태 */
  collapsed: boolean;
  expanded: boolean; // 더 많은 줄 보기
}
```

### 11.8 Title Keyword 추출

전체 명령어에서 의미 있는 키워드를 추출하여 헤더에 표시:

```typescript
function extractTitleKeywords(command: string): string {
  // "source scripts/source-sota-env.sh && cg_use_main_target >/dev/null && cargo test -p quanta-planner"
  // → "source, cg_use_main_target, cargo test"

  // 규칙:
  // 1. && / || / ; 로 split
  // 2. 각 segment에서 첫 단어(명령어) 추출
  // 3. source/cd/export 같은 setup 명령은 첫 단어만
  // 4. >/dev/null 같은 redirect 제거
  // 5. 콤마로 join
}
```

### 11.9 Agent Panel 내 카드 배치

Agent 대화 흐름에서 command card는 **메시지 블록 사이에 인라인**으로 삽입된다:

```
┌─ Agent Message ─────────────────────────┐
│ 테스트를 실행하겠습니다.                   │
└──────────────────────────────────────────┘

┌─ Command Card ───────────────────────────┐
│ ◌ Running command: pytest             [↗]│
│ $ pytest apps/mcp/tests/ -k …            │
│   ...                                     │
└──────────────────────────────────────────┘

┌─ Command Card ───────────────────────────┐
│ ◌ Running command: cargo test         [↗]│
│ $ cargo test -p codegraph-core …         │
│   Compiling ...                           │
└──────────────────────────────────────────┘

┌─ Agent Message ─────────────────────────┐
│ pytest 1건 실패했습니다. 수정하겠습니다.   │
└──────────────────────────────────────────┘
```

Agent가 동시에 여러 명령을 실행하면 카드가 연속으로 나열된다.

### 11.10 Terminal 탭 표시

Terminal bottom panel의 탭에도 agent 세션이 구분되어 표시:

```
┌──────────────────────────────────────────────────────┐
│ [You] zsh  │  [🤖] Lint #12   │  [🤖] Test #12      │
│            │  ✗ exit 1        │  ✓ exit 0            │
└──────────────────────────────────────────────────────┘
```

### 11.11 User Actions (per card)

| Action | 위치 | 설명 |
|--------|------|------|
| **Jump to Terminal** `[↗]` | 헤더 우측 | 해당 세션 terminal로 이동, command block 스크롤 |
| **Cancel** `[×]` | 헤더 우측 (running만) | 실행 취소 (SIGTERM) |
| **Expand output** `[▿]` | 본문 하단 | 더 많은 출력 줄 표시 |
| **Rerun** | context menu | 같은 명령 재실행 |
| **Copy Command** | context menu | 명령어 클립보드 복사 |

### 11.12 Failure Flow

lint 실패 시 자연스러운 흐름:

1. Command card에 `failed` 스타일 + 에러 출력 프리뷰
2. Agent가 카드 아래에 "수정하겠습니다" 메시지
3. 수정 후 새 command card (rerun)
4. 사용자는 `[↗]`로 terminal에서 전체 로그 확인 가능
5. 이 루프가 agent 대화 흐름 안에서 자연스럽게 이어져야 한다

### 11.13 구현 컴포넌트

```
src/widgets/agent-command-card/
├── index.ts
├── AgentCommandCard.tsx           # 메인 카드 컴포넌트
├── CommandCardHeader.tsx          # status + title + [↗][×] 버튼
├── CommandCardOutput.tsx          # tail output 프리뷰 (ANSI 렌더링)
├── CommandCardActions.tsx         # expand/collapse, context menu
└── useCommandCardStream.ts        # executionId → 실시간 output tail 구독
```

```typescript
// AgentCommandCard props
interface AgentCommandCardProps {
  executionId: string;
  /** card를 대화 흐름에 인라인으로 삽입 */
  inline?: boolean;
}
```

### 11.14 Atom 연동

```typescript
// 실행 중인 카드 목록 (agent message와 interleave)
export const activeCommandCardsAtom = atom<AgentCommandCard[]>([]);

// executionId → 실시간 output tail 구독
export const commandCardOutputFamily = atomFamily((executionId: string) =>
  atom<string[]>([])
);

// 카드 UI 상태
export const commandCardUiFamily = atomFamily((executionId: string) =>
  atom({ collapsed: false, expanded: false })
);
```

### 11.15 Activity Bar 하단 Terminal 버튼

Terminal 접근 진입점은 **Activity Bar (icon strip) 하단 고정 영역**에 배치한다.

현재 `ShellSidebar.tsx`의 icon strip은 sidebar panel 버튼만 나열하고 하단 고정 영역이 없다.
다음과 같이 **상단(패널 전환) / 하단(유틸리티)** 2-zone 구조로 변경한다.

```
┌──────────┐
│ [files]  │  ← sidebar panels (panelRegistry zone:"sidebar")
│ [search] │
│ [symbol] │
│ [finding]│
│          │
│  (flex)  │  ← spacer
│          │
│ [term]   │  ← 🆕 terminal toggle (bottom panel 열기 + terminal 탭 활성화)
│ [console]│  ← 🆕 floating console toggle (RFC-016)
│ [alert]  │  ← 🆕 problems/notifications
│ [gear]   │  ← 🆕 settings surface 이동
└──────────┘
```

**구현 변경 — `ShellSidebar.tsx`:**

```tsx
<div className="flex flex-col items-center w-10 shrink-0 bg-vsc-sidebar border-r border-vsc-border/20 py-1 gap-0.5">
  {/* ── 상단: Sidebar panel 전환 버튼들 ── */}
  {panels.map((panel) => (
    <ActivityBarButton key={panel.id} ... />
  ))}

  {/* ── Spacer ── */}
  <div className="flex-1" />

  {/* ── 하단: 유틸리티 버튼들 (고정) ── */}
  <ActivityBarButton
    icon="terminal"
    title="Terminal"
    shortcut="Cmd+`"
    isActive={bottomPanelVisible && activeBottomPanel === "terminal"}
    onClick={toggleTerminalPanel}
  />
  <ActivityBarButton
    icon="output"
    title="Console"
    onClick={toggleConsole}
  />
  <ActivityBarButton
    icon="warning"
    title="Problems"
    badge={errorCount > 0 ? errorCount : undefined}
    onClick={toggleProblemsPanel}
  />
  <ActivityBarButton
    icon="settings-gear"
    title="Settings"
    onClick={() => setActiveSurface("settings")}
  />
</div>
```

**`toggleTerminalPanel` 동작:**

```typescript
function toggleTerminalPanel() {
  if (bottomPanelVisible && activeBottomPanel === "terminal") {
    // 이미 terminal이 열려 있으면 → bottom panel 닫기
    setBottomPanelVisible(false);
  } else {
    // terminal 열기
    setBottomPanelVisible(true);
    setActiveBottomPanel("terminal");
  }
}
```

**UX 규칙:**
- Terminal 버튼은 bottom panel의 terminal 탭을 토글
- Agent가 명령 실행 중이면 terminal 아이콘에 subtle spinner/dot indicator
- Problems 버튼에는 에러 카운트 badge 표시 가능
- 하단 버튼들은 `stagger-children` 애니메이션에서 제외 (항상 즉시 표시)

---

## 12. Agent Loop Integration

Agent runtime에서 필요한 건 결국 이 패턴이다:

```typescript
// Agent Runtime 내부
const exec = await bridge.execute({
  sessionMode: "dedicated",
  source: "agent",
  purpose: "lint",
  cwd: workspaceRoot,
  command: "pnpm lint",
  revealPolicy: "on-failure",
  trigger: { agentRunId, toolCallId, stepId },
});

const result = await bridge.awaitCompletion(exec.executionId);

if (result.finalStatus === "failed") {
  // diagnostics 분석
  for (const diag of result.diagnostics) {
    // 파일 읽기 → 수정 → 저장
  }
  // rerun
  const retry = await bridge.execute({
    sessionMode: "reuse-by-id",
    sessionId: exec.sessionId,
    source: "agent",
    purpose: "lint",
    cwd: workspaceRoot,
    command: "pnpm lint",
    revealPolicy: "on-failure",
    trigger: { agentRunId, toolCallId, stepId: nextStepId },
  });
  const retryResult = await bridge.awaitCompletion(retry.executionId);
  // ...
}
```

**이게 돼야 진짜 AI-native다.**

---

## 13. Tauri Command Spec

### 13.1 Commands

```rust
#[tauri::command]
async fn agent_terminal_execute(
    req: AgentTerminalExecRequestDto,
) -> Result<AgentTerminalExecResponseDto, String>;

#[tauri::command]
async fn agent_terminal_cancel(
    execution_id: String,
) -> Result<(), String>;

#[tauri::command]
async fn terminal_reveal_session(
    session_id: String,
) -> Result<(), String>;
```

### 13.2 Events

```
terminal://session-created
terminal://command-started
terminal://command-output
terminal://parsed-event
terminal://command-completed
terminal://approval-required
```

### 13.3 추천 구조

Terminal 전용 command와 agent façade command를 둘 다 두는 것보다,
**내부 Rust에서는 terminal runtime 하나**를 두고 **frontend에서 bridge façade**를 만드는 방식이 깔끔하다.

```
AgentPanel
  → AgentTerminalBridge.ts
      → invoke("terminal_create_session")
      → invoke("terminal_exec")
      → listen("terminal://...")
```

---

## 14. Provenance Model

처음부터 schema에 들어가야 한다.

```typescript
interface CommandProvenance {
  source: "user" | "agent" | "task";
  agentRunId?: string;
  toolCallId?: string;
  stepId?: string;
  invocationSurface?: "agent-panel" | "terminal-toolbar" | "quick-action";
}
```

Terminal command, session, parsed event에 이 provenance가 들어가면:

- Agent가 실행한 명령만 필터
- 특정 agent run과 연결
- Replay provenance 유지
- Audit trail 생성

---

## 15. Safety / Policy Layer

### 15.1 Policy Engine 입력

```typescript
interface TerminalPolicyCheckInput {
  command: string;
  cwd: string;
  purpose: TerminalPurpose;
  source: "agent";
}
```

### 15.2 판단 결과

```typescript
interface TerminalPolicyDecision {
  allowed: boolean;
  requiresApproval: boolean;
  reason?: string;
}
```

### 15.3 예시 정책

| 명령 | 판단 |
|------|------|
| `pnpm lint` | allow |
| `pytest` | allow |
| `pnpm test` | allow |
| `git push` | approval |
| `rm -rf` | approval or deny |
| `curl ... \| sh` | approval |
| `npm publish` | approval |
| `sudo ...` | deny |
| workspace 밖 경로 조작 | deny or approval |

---

## 16. Recommended Defaults

| 작업 | mode | reveal | focus | approval |
|------|------|--------|-------|----------|
| lint | `dedicated` | `on-failure` | `false` | `not-required` |
| test | `dedicated` | `on-failure` | `false` | `not-required` |
| build | `dedicated` | `on-output` | `false` | `not-required` |
| dev server | `detached` | `always` | `false` | `not-required` |
| format | `dedicated` | `never` | `false` | `not-required` |
| install | `dedicated` | `on-output` | `false` | `required-for-dangerous` |
| custom one-shot | `reuse-current` 허용 | `always` | `true` | `inherit-workspace-policy` |

---

## 17. Implementation File Structure

### 17.1 Frontend

```
src/features/terminal-bridge/
  bridge/
    AgentTerminalBridge.ts         # façade interface + implementation
    AgentTerminalBridgeTypes.ts    # request/response/event types
    terminalOrchestrator.ts        # session selection, policy, fanout
    completionAwaiter.ts           # executionId → Promise<Result>
  model/
    terminalProvenanceAtom.ts      # provenance store
    agentTerminalAtoms.ts          # agent execution state

src/widgets/agent-command-card/
    index.ts                       # barrel export
    AgentCommandCard.tsx           # 메인 인라인 카드 (agent panel 대화에 삽입)
    CommandCardHeader.tsx          # status indicator + title + [↗] jump + [×] cancel
    CommandCardOutput.tsx          # tail output 프리뷰 (ANSI 색상 유지)
    CommandCardActions.tsx         # expand/collapse, context menu
    useCommandCardStream.ts        # executionId → 실시간 output tail 구독

src/widgets/terminal-bridge/
    TerminalAgentBadge.tsx         # terminal 탭의 [🤖] agent badge
```

### 17.2 Rust (Tauri)

```
apps/desktop/src-tauri/src/terminal/
  agent_bridge.rs                  # agent exec request handler
  policy_guard.rs                  # command safety policy
  execution_tracker.rs             # execution lifecycle tracking
```

---

## 18. Data Flow Summary

```
User: "이 변경 lint 돌려봐"
   ↓
Agent Runtime
   ↓
AgentTerminalBridge.execute({
  sessionMode: "dedicated",
  purpose: "lint",
  command: "pnpm lint",
  trigger: { agentRunId, toolCallId },
  revealPolicy: "on-failure",
})
   ↓
Terminal Orchestrator
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
   ├─ Agent Runtime: awaitCompletion → exitCode, parsedErrors
   ├─ Problems Panel: diagnostic events
   ├─ Terminal UI: command block + decorations
   └─ Agent Panel: result summary card
   ↓
Agent: exitCode !== 0
   → diagnostics 분석
   → "foo.ts:42 수정할게"
   → fix code
   → rerun lint (reuse-by-id, same session)
   → exitCode === 0
   → "lint 통과"
```

---

## 19. Practical Priority Cut

지금 바로 구현한다면:

### P0 — 최소 동작

- Dedicated agent terminal session 생성
- `execute(command, cwd)` API
- stdout/stderr 스트림 표시
- `command-completed` event
- exit code 반환
- Reveal on failure
- Provenance: `agentRunId`, `toolCallId`
- **Agent Command Card** — 인라인 썸네일 (status + output tail + `[↗]` jump button)

### P1 — Semantic 연동

- Parsed diagnostics
- Rerun same command
- Reveal/focus controls
- Cancel execution
- Session title/purpose

### P2 — 안전성 + 고급 기능

- Approval policy
- Detached dev server
- Replay pipeline
- Convert agent session to user session
- Raw output tail for agent consumption

---

## 20. Open Questions

| # | 질문 | 상태 |
|---|------|------|
| 1 | Agent 전용 세션을 작업별로 하나씩 만들지, run별로 묶을지 | 미결 |
| 2 | Detached dev server를 terminal 탭으로만 둘지, 별도 task surface로 승격할지 | 미결 |
| 3 | Approval UI를 agent panel 안에 둘지, global modal로 둘지 | 미결 |
| 4 | Raw output 전체를 agent가 소비할지, semantic summary만 소비할지 | 미결 |
| 5 | User가 agent session을 takeover할 때 provenance를 어떻게 이어갈지 | 미결 |

---

## 21. 결론

> **Agent Panel은 terminal을 직접 제어하지 않고, `AgentTerminalBridge`를 통해 "세션 선택 + 명령 실행 + 완료 관찰"을 수행해야 한다.**

이 bridge가 있으면:

- AI agent panel에서 특정 terminal 세션을 만들고
- 그 세션에서 lint/test/build/dev server를 곧바로 실행하고
- 그 결과가 다시 agent loop로 돌아와서
  - 실패 감지
  - diagnostics 해석
  - 코드 수정
  - rerun
- 까지 이어진다

---

## 관련 문서

- [000-overview.md](./000-overview.md) — Terminal 제품 정의 & 전체 기능 스펙
- [001-architecture.md](./001-architecture.md) — Tauri 구현 아키텍처
- [002-agent-integration.md](./002-agent-integration.md) — Agent ↔ Terminal 통합 개요
- [RFC-016 Floating Console](../rfc-ide-console-001.md) — Console (engine/system log) — Terminal과 분리
