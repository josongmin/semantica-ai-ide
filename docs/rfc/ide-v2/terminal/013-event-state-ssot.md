# RFC-TERMINAL-013: Event & State SSOT — FE / Rust / Agent 공통 스키마

| Field | Value |
|-------|-------|
| ID | RFC-TERMINAL-013-EVENT-STATE-SSOT |
| Status | Draft |
| Date | 2026-03-09 |
| Owner | Semantica DevOS |
| Audience | IDE Team, Engine Team, Agent Team |
| Parent | RFC-TERMINAL-010-CONSTITUTION |
| Scope | 도메인 스키마 SSOT, 이벤트 분류 체계, 상태 모델 |

---

## 1. 원칙

헌법 §7 (Event Architecture)의 구체적 이행 문서이다.

> FE, Rust, Agent는 **동일한 session/command/event schema**를 사용해야 한다.
> schema 불일치는 버그의 근원이다.

---

## 2. SSOT 도메인 목록

| 도메인 | SSOT 필요 | 정의 위치 | 소비자 |
|--------|----------|----------|--------|
| **TerminalSessionMeta** | 필수 | Rust → FE event | FE atoms, Agent bridge |
| **TerminalCommand** | 필수 | Rust → FE event | FE blocks, Agent completion |
| **ParsedTerminalEvent** | 필수 | Rust parser → FE | FE overlay, Problems panel |
| **TerminalTaskState** | 필수 | Rust detector → FE | FE progress, Agent awareness |
| **CompatibilityState** | 필수 | Rust detector → FE | FE overlay toggle |
| **OverlayState** | 필수 | FE only | FE rendering |
| **AgentTerminalExecRequest** | 필수 | Agent → Rust | Rust executor, FE card |
| **AgentTerminalExecutionResult** | 필수 | Rust → Agent | Agent loop |

---

## 3. 핵심 스키마 정의

### 3.1 TerminalSessionMeta

```typescript
interface TerminalSessionMeta {
  sessionId: string;
  title: string;
  shellType: "zsh" | "bash" | "pwsh" | "fish" | "unknown";
  pid: number;
  cwd: string;
  createdAt: number;            // unix ms
  status: "starting" | "running" | "exited" | "failed";
  exitCode?: number;
  provenance: SessionProvenance;
  mode: "classic" | "hybrid" | "semantic";
  markerSupport: boolean;       // shell marker 삽입 성공 여부
  purpose?: "lint" | "test" | "build" | "dev-server" | "run" | "custom";
}

type SessionProvenance =
  | { source: "user" }
  | { source: "agent"; agentId: string; taskId?: string }
  | { source: "task"; taskId: string }
  | { source: "system" };
```

### 3.2 TerminalCommand

```typescript
interface TerminalCommand {
  commandId: string;
  sessionId: string;
  command: string;              // raw command text
  // NOTE: normalizedText from 000 is derived at FE layer, not part of SSOT
  cwd: string;
  startedAt: number;
  completedAt?: number;
  exitCode?: number;
  status: "running" | "succeeded" | "failed" | "cancelled" | "unknown";
  duration?: number;            // ms
  provenance: CommandProvenance;
  outputLineRange?: { start: number; end: number };
  parsedEvents?: ParsedTerminalEvent[];
}

type CommandProvenance =
  | { source: "user" }
  | { source: "agent"; agentId: string; requestId: string }
  | { source: "rerun"; originalCommandId: string };
```

### 3.3 ParsedTerminalEvent

```typescript
interface ParsedTerminalEvent {
  eventId: string;
  commandId: string;
  sessionId: string;
  kind: ParsedEventKind;
  timestamp: number;
  data: ParsedEventData;
}

type ParsedEventKind =
  | "diagnostic"      // compiler error/warning
  | "test-result"     // test pass/fail/skip
  | "file-link"       // file:line reference
  | "url"             // http(s) URL
  | "port-binding"    // localhost:PORT detected
  | "progress"        // percentage/step progress
  | "task-lifecycle"  // dev-server started/stopped
  | "summary";        // final summary line

type ParsedEventData =
  | DiagnosticEvent
  | TestResultEvent
  | FileLinkEvent
  | UrlEvent
  | PortBindingEvent
  | ProgressEvent
  | TaskLifecycleEvent
  | SummaryEvent;

interface DiagnosticEvent {
  severity: "error" | "warning" | "info";
  file: string;
  line: number;
  column?: number;
  message: string;
  source?: string;    // "tsc" | "eslint" | "cargo" | ...
}

interface TestResultEvent {
  testName: string;
  status: "pass" | "fail" | "skip";
  duration?: number;
  message?: string;
}

interface FileLinkEvent {
  file: string;
  line: number;
  column?: number;
  text: string;
}

interface UrlEvent {
  url: string;
  text: string;
}

interface PortBindingEvent {
  port: number;
  host: string;
  protocol?: string;
}

interface ProgressEvent {
  current: number;
  total?: number;
  percentage?: number;
  label?: string;
}

interface TaskLifecycleEvent {
  taskType: "dev-server" | "watch" | "build" | "test";
  phase: "started" | "ready" | "stopped" | "crashed";
  label?: string;
}

interface SummaryEvent {
  text: string;
  counts?: { passed?: number; failed?: number; skipped?: number; total?: number };
}
```

### 3.4 TerminalTaskState

```typescript
interface TerminalTaskState {
  sessionId: string;
  commandId: string;
  taskType: "dev-server" | "watch" | "build" | "test" | "install" | "unknown";
  phase: "started" | "running" | "ready" | "stopped" | "crashed";
  progress?: { current: number; total?: number; percentage?: number };
  label?: string;
}
```

### 3.5 CompatibilityState

```typescript
interface CompatibilityState {
  sessionId: string;
  altScreen: boolean;
  mouseCapture: boolean;
  fullscreenTui: boolean;
  unknownControlBurst: boolean;
  effectiveMode: "classic" | "hybrid" | "semantic";
  overlayEnabled: boolean;
  reason?: string;              // 강등 사유
}
```

### 3.6 AgentTerminalExecRequest

```typescript
interface AgentTerminalExecRequest {
  requestId: string;
  agentId: string;
  taskId?: string;
  command: string;
  cwd?: string;
  env?: Record<string, string>;
  sessionMode: "reuse-current" | "reuse-by-id" | "dedicated" | "detached";
  purpose?: "lint" | "test" | "build" | "run" | "dev-server" | "format" | "install" | "custom";
  title?: string;
  trigger?: { agentRunId: string; toolCallId?: string; stepId?: string };
  sessionId?: string;           // reuse-current 시 지정
  revealPolicy: "on-failure" | "always" | "never";
  approvalRequired?: boolean;   // dangerous command 시 true
  timeout?: number;             // ms
}
```

### 3.7 AgentTerminalExecutionResult

```typescript
interface AgentTerminalExecutionResult {
  requestId: string;
  sessionId: string;
  commandId: string;
  status: "succeeded" | "failed" | "cancelled" | "timeout";
  exitCode?: number;
  duration: number;
  parsedErrors?: DiagnosticEvent[];
  outputPreview?: string;       // 마지막 N줄
  outputLineCount: number;
}
```

---

## 4. 이벤트 분류 체계

이벤트는 5개 그룹으로 분리한다. 이 분류를 고정하면 확장 시에도 안정적이다.

### 4.1 Session Events

| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `terminal://session-created` | Rust → FE | 세션 생성 |
| `terminal://session-exited` | Rust → FE | 세션 종료 |
| `terminal://session-mode-changed` | Rust → FE | 모드 변경 (classic/hybrid/semantic) |
| `terminal://session-cwd-changed` | Rust → FE | 작업 디렉토리 변경 |

### 4.2 Command Events

| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `terminal://command-started` | Rust → FE | 명령 시작 (marker 기반) |
| `terminal://command-completed` | Rust → FE | 명령 완료 + exit code |
| `terminal://command-cancelled` | Rust → FE | 명령 취소 (Ctrl+C 등) |

### 4.3 Output / Parsing Events

| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `terminal://output` | Rust → FE | raw PTY 출력 스트림 |
| `terminal://parsed-event` | Rust → FE | 파싱된 구조화 이벤트 |
| `terminal://task-state-changed` | Rust → FE | 태스크 상태 변경 |

### 4.4 Compatibility / Fallback Events

| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `terminal://compatibility-state` | Rust → FE | 호환성 상태 변경 |
| `terminal://overlay-mode-changed` | Rust → FE | overlay 활성/비활성 |
| `terminal://fallback-triggered` | Rust → FE | 안전 강등 발생 |

### 4.5 Agent Bridge Events

| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `terminal://agent-exec-started` | Rust → FE | agent 명령 실행 시작 |
| `terminal://agent-exec-completed` | Rust → FE | agent 명령 실행 완료 |
| `terminal://agent-approval-required` | Rust → FE | 위험 명령 승인 요구 |

---

## 5. Tauri IPC Commands (SSOT)

Rust가 노출하는 Tauri command 목록. FE는 이 인터페이스만 사용한다.

| Command | 인자 | 반환 | 설명 |
|---------|------|------|------|
| `terminal:create_session` | `{ shellType?, cwd?, provenance }` | `TerminalSessionMeta` | 세션 생성 |
| `terminal:kill_session` | `{ sessionId }` | `void` | 세션 종료 |
| `terminal:write` | `{ sessionId, data }` | `void` | PTY stdin 쓰기 |
| `terminal:resize` | `{ sessionId, cols, rows }` | `void` | PTY resize |
| `terminal:get_sessions` | `void` | `TerminalSessionMeta[]` | 전체 세션 조회 |
| `terminal:get_commands` | `{ sessionId }` | `TerminalCommand[]` | 세션 명령 목록 |
| `terminal:exec` | `AgentTerminalExecRequest` | `{ commandId }` | agent 명령 실행 |
| `terminal:cancel_exec` | `{ requestId }` | `void` | agent 명령 취소 |
| `terminal:approve_command` | `{ requestId, approved }` | `void` | 위험 명령 승인/거부 |

---

## 6. FE Jotai Atom SSOT

FE에서 terminal 상태를 관리하는 atom 구조. 단일 진실 원천으로 잠근다.

```typescript
// 세션 목록
const terminalSessionsAtom = atom<Map<string, TerminalSessionMeta>>(new Map());

// 활성 세션 ID
const activeTerminalSessionIdAtom = atom<string | null>(null);

// 세션별 명령 목록
const terminalCommandsAtom = atom<Map<string, TerminalCommand[]>>(new Map());

// 세션별 파싱 이벤트
const terminalParsedEventsAtom = atom<Map<string, ParsedTerminalEvent[]>>(new Map());

// 세션별 태스크 상태
const terminalTaskStateAtom = atom<Map<string, TerminalTaskState>>(new Map());

// 세션별 호환성 상태
const terminalCompatibilityAtom = atom<Map<string, CompatibilityState>>(new Map());

// Agent 실행 요청/결과
const agentTerminalExecutionsAtom = atom<Map<string, AgentTerminalExecutionResult>>(new Map());

// UI 상태 (overlay, mode 등)
const terminalUIStateAtom = atom<{
  bottomPanelOpen: boolean;
  activeTab: string;
  splitLayout: "single" | "horizontal" | "vertical";
}>();
```

---

## 7. Schema 버전 관리

- 모든 schema는 `version` 필드를 포함하지 않는다 (초기 단계)
- schema 변경 시 **breaking change는 전 계층 동시 업데이트** (Rust, FE, Agent)
- non-breaking 추가 (optional 필드)는 단독 배포 가능
- RFC 000/001/002/003에서 정의한 기존 타입은 이 문서의 정의로 통합한다

---

## 관련 문서

- [010-constitution.md](./010-constitution.md) — 비가역 원칙 (상위)
- [001-architecture.md](./001-architecture.md) — Rust/FE 아키텍처 상세
- [003-agent-terminal-bridge.md](./003-agent-terminal-bridge.md) — Agent Bridge 프로토콜
- [014-gates-and-acceptance.md](./014-gates-and-acceptance.md) — Gate & Acceptance 기준
