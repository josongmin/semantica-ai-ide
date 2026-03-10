# RFC-TERMINAL-001: Tauri 구현 아키텍처 — Rust Runtime + Frontend + IPC

| Field | Value |
|-------|-------|
| ID | RFC-TERMINAL-001-ARCHITECTURE |
| Status | Draft |
| Date | 2026-03-08 |
| Owner | Semantica DevOS |
| Audience | IDE Team, Engine Team |
| Parent | RFC-TERMINAL-000 Overview |
| Scope | Rust PTY host, ANSI decoder, command tracker, parser registry, Tauri IPC, 프론트엔드 상태/컴포넌트, 렌더링 전략 |

---

## 1. 전체 구조

```
React UI
  ├ TerminalPanel
  ├ SessionTabs
  ├ CommandBlocks
  ├ ParsedDecorations
  └ Search/Filter UI

Jotai Store / Event Bus
  ├ terminalSessionsAtom
  ├ terminalBufferAtom
  ├ terminalCommandsAtom
  ├ terminalParsedEventsAtom
  └ terminalUiStateAtom

Tauri IPC
  ├ terminal:create_session
  ├ terminal:write_input
  ├ terminal:resize
  ├ terminal:kill
  ├ terminal:exec          ← agent integration 핵심
  ├ terminal:replay
  └ events: terminal://output, terminal://command, terminal://status

Rust Terminal Runtime
  ├ TerminalManager
  ├ PtyHost
  ├ ShellIntegration
  ├ AnsiDecoder
  ├ CommandTracker
  ├ OutputParserRegistry
  ├ TaskDetector
  ├ PolicyGuard
  └ TerminalEventEmitter
```

---

## 2. Rust Side 상세

### 2.1 디렉토리 구조

```
apps/desktop/src-tauri/src/terminal/
  mod.rs
  terminal_manager.rs
  terminal_session.rs
  pty_host.rs
  shell_profile.rs
  shell_integration.rs
  ansi_decoder.rs
  command_tracker.rs
  output_parser.rs
  output_parsers/
    mod.rs
    typescript.rs
    jest.rs
    cargo.rs
    python.rs
    generic.rs
  task_detector.rs
  policy_guard.rs
  terminal_events.rs
  terminal_types.rs
```

### 2.2 TerminalManager

세션 lifecycle 총괄.

```rust
pub struct TerminalManager {
    sessions: DashMap<TerminalSessionId, TerminalSessionHandle>,
}

impl TerminalManager {
    pub fn create_session(&self, req: CreateSessionRequest) -> Result<TerminalSessionMeta>;
    pub fn write_input(&self, session_id: &str, data: &str) -> Result<()>;
    pub fn resize(&self, session_id: &str, cols: u16, rows: u16) -> Result<()>;
    pub fn kill(&self, session_id: &str) -> Result<()>;
    pub fn exec(&self, req: ExecRequest) -> Result<ExecResponse>;
    pub fn replay(&self, req: ReplayRequest) -> Result<()>;
    pub fn snapshot_meta(&self, session_id: &str) -> Result<TerminalSessionMeta>;
    pub fn list_sessions(&self) -> Vec<TerminalSessionMeta>;
}
```

### 2.3 TerminalSession

세션별 PTY + 상태.

```rust
pub struct TerminalSession {
    pub id: TerminalSessionId,
    pub shell: ShellProfile,
    pub cwd: PathBuf,
    pub status: TerminalStatus,
    pub cols: u16,
    pub rows: u16,
    pub source: SessionSource,        // User | Agent | Task | System
    pub owner_agent_run_id: Option<String>,
    pub purpose: Option<SessionPurpose>,
    pub created_at: u64,
    pub updated_at: u64,
}
```

### 2.4 PtyHost

OS별 PTY abstraction.

```rust
pub struct PtyHost {
    pty: Box<dyn MasterPty>,
    child: Box<dyn Child>,
    reader: Box<dyn Read + Send>,
    writer: Box<dyn Write + Send>,
}

impl PtyHost {
    pub fn spawn(shell: &ShellProfile, cwd: &Path, env: &HashMap<String, String>) -> Result<Self>;
    pub fn read_output(&mut self, buf: &mut [u8]) -> Result<usize>;
    pub fn write_input(&mut self, data: &[u8]) -> Result<()>;
    pub fn resize(&self, cols: u16, rows: u16) -> Result<()>;
    pub fn kill(&self) -> Result<()>;
}
```

**권장 크레이트:**

- `portable-pty` — 크로스 플랫폼 PTY
- `tokio` + `portable-pty` 조합
- `crossterm`은 UI 성격이 강해서 host용보다는 보조

### 2.5 ShellIntegration

Command boundary 잡는 핵심 계층.

```rust
pub struct ShellIntegration {
    shell_type: ShellType,
}

impl ShellIntegration {
    /// 해당 shell의 rc에 삽입할 hook 스크립트 생성
    pub fn generate_hook_script(&self) -> String;

    /// PTY output에서 marker를 감지하고 추출
    pub fn extract_marker(&self, line: &str) -> Option<ShellMarker>;
}
```

**Marker Protocol:**

```
__SEM_TERM_CMD_START__:{"cmd":"npm test","cwd":"/project","ts":1770000000}
__SEM_TERM_CMD_END__:{"exitCode":0,"ts":1770000005}
__SEM_TERM_CWD__:{"cwd":"/project/src"}
```

**Shell별 hook:**

| Shell | Hook 방식 |
|-------|-----------|
| zsh | `preexec()` / `precmd()` in `.zshrc` 또는 `ZDOTDIR` override |
| bash | `trap DEBUG` / `PROMPT_COMMAND` |
| PowerShell | `prompt` function wrapper |
| fish | `fish_preexec` / `fish_postexec` |

### 2.6 AnsiDecoder

ANSI color / control sequence 처리.

```rust
pub struct AnsiDecoder {
    state: ParserState,
}

impl AnsiDecoder {
    /// Raw bytes → styled fragments (UI renderer용)
    pub fn decode_styled(&mut self, input: &[u8]) -> Vec<StyledFragment>;

    /// Raw bytes → normalized plain text (parser용)
    pub fn decode_plain(&mut self, input: &[u8]) -> String;
}
```

**중요한 분리:**

- **Parser**는 ANSI 제거된 normalized line을 본다
- **UI renderer**는 styled fragment를 본다

### 2.7 CommandTracker

Marker 기반으로 command state 관리.

```rust
pub struct CommandTracker {
    active_command: Option<ActiveCommand>,
    history: Vec<CompletedCommand>,
}

impl CommandTracker {
    pub fn on_command_start(&mut self, marker: CommandStartMarker) -> TerminalCommand;
    pub fn on_command_end(&mut self, marker: CommandEndMarker) -> TerminalCommand;
    pub fn current_command(&self) -> Option<&ActiveCommand>;
    pub fn associate_output(&mut self, line_id: &str);
}
```

**역할:**

- command start/end 관리
- exit code 연결
- duration 계산
- orphan output 처리 (marker 없는 출력)

### 2.8 OutputParserRegistry

플러그인 기반 semantic parser.

```rust
pub trait OutputParser: Send + Sync {
    fn name(&self) -> &str;
    fn try_parse_line(&self, line: &str) -> Option<ParsedTerminalEvent>;
    /// block parser — 여러 줄에 걸친 패턴 (traceback, test summary 등)
    fn try_parse_block(&self, lines: &[&str]) -> Option<ParsedTerminalEvent>;
}

pub struct OutputParserRegistry {
    parsers: Vec<Box<dyn OutputParser>>,
}

impl OutputParserRegistry {
    pub fn register(&mut self, parser: Box<dyn OutputParser>);
    pub fn parse(&self, line: &str) -> Vec<ParsedTerminalEvent>;
    pub fn parse_block(&self, lines: &[&str]) -> Vec<ParsedTerminalEvent>;
}
```

**권장:** line parser + block parser 둘 다 지원.
- 일부는 한 줄로 충분 (`src/foo.ts:42:13 - error TS2322`)
- traceback / test summary는 block parser 필요

### 2.9 TaskDetector

장기 실행 프로세스 감지.

```rust
pub struct TaskDetector;

impl TaskDetector {
    pub fn detect(&self, command: &str, output: &[&str]) -> Option<TerminalTaskState>;
}
```

감지 대상: dev server, watch mode, port binding, progress bar 패턴.

### 2.10 PolicyGuard

보안/안전 정책 엔진.

```rust
pub struct PolicyGuard {
    rules: Vec<PolicyRule>,
}

impl PolicyGuard {
    pub fn check(&self, command: &str, source: SessionSource) -> PolicyDecision;
}

pub enum PolicyDecision {
    Allow,
    RequireApproval { reason: String },
    Deny { reason: String },
}
```

### 2.11 TerminalEventEmitter

Tauri 프론트로 이벤트 송출.

**이벤트 종류:**

| Event | Payload |
|-------|---------|
| `terminal://session-created` | `TerminalSessionMeta` |
| `terminal://session-status` | `{ sessionId, status, exitCode? }` |
| `terminal://output` | `{ sessionId, chunkId, stream, text, timestamp }` |
| `terminal://command-started` | `TerminalCommand` |
| `terminal://command-ended` | `TerminalCommand` |
| `terminal://parsed-event` | `ParsedTerminalEvent` |
| `terminal://task-state` | `TerminalTaskState` |
| `terminal://policy-check` | `{ commandText, decision, reason? }` |

**Output event 예시:**

```json
{
  "sessionId": "term_1",
  "chunkId": "chunk_123",
  "stream": "stdout",
  "text": "src/foo.ts:42:13 - error TS2322\n",
  "timestamp": 1770000000000
}
```

---

## 3. Tauri IPC 설계

> **Note:** 아래 IPC command/event 이름은 초기 설계 스냅샷이다.
> **정식 SSOT는 [013-event-state-ssot.md](./013-event-state-ssot.md) §5를 참조**할 것.
> 네이밍이 다를 경우 013이 우선한다.

### 3.1 Commands

```rust
#[tauri::command]
fn terminal_create_session(req: CreateTerminalSessionRequest) -> Result<TerminalSessionMeta, String>;

#[tauri::command]
fn terminal_write_input(session_id: String, data: String) -> Result<(), String>;

#[tauri::command]
fn terminal_resize(session_id: String, cols: u16, rows: u16) -> Result<(), String>;

#[tauri::command]
fn terminal_kill(session_id: String) -> Result<(), String>;

#[tauri::command]
fn terminal_exec(req: TerminalExecRequest) -> Result<TerminalExecResponse, String>;

#[tauri::command]
fn terminal_replay(req: ReplayRequest) -> Result<(), String>;

#[tauri::command]
fn terminal_list_sessions() -> Result<Vec<TerminalSessionMeta>, String>;
```

### 3.2 Exec Request (Agent Integration 핵심)

```rust
#[derive(Deserialize)]
pub struct TerminalExecRequest {
    pub session_id: Option<String>,
    pub create_if_missing: Option<bool>,
    pub source: String,          // "user" | "agent" | "task"
    pub purpose: Option<String>, // "lint" | "test" | "build" | "run" | "custom"
    pub cwd: Option<String>,
    pub command: String,
    pub env_patch: Option<HashMap<String, String>>,
    pub trigger: Option<CommandTrigger>,
    pub reveal: Option<bool>,
    pub focus: Option<bool>,
}

#[derive(Deserialize)]
pub struct CommandTrigger {
    pub agent_run_id: Option<String>,
    pub tool_call_id: Option<String>,
    pub plan_step_id: Option<String>,
}
```

---

## 4. Frontend 상세

### 4.1 디렉토리 구조

```
src/features/terminal/
  model/
    terminalAtoms.ts        # Jotai atoms
    terminalTypes.ts        # TypeScript 타입
    terminalSelectors.ts    # 파생 selectors
    terminalActions.ts      # write atoms / action dispatchers
  lib/
    terminalEventBus.ts     # Tauri event listener 등록
    terminalParserHints.ts  # 프론트 측 보조 파서 (URL 등)
    terminalSearch.ts       # 검색 로직
  ui/
    TerminalPanel.tsx        # 메인 패널 (surface 또는 bottom panel)
    TerminalTabs.tsx         # 세션 탭바
    TerminalViewport.tsx     # xterm.js wrapper
    TerminalCommandBlock.tsx # command 단위 semantic overlay
    TerminalLine.tsx         # 개별 라인 (clickable decorations)
    TerminalDecorations.tsx  # parsed event decorations
    TerminalToolbar.tsx      # 검색/필터/액션 바
    TerminalSearchBar.tsx    # 검색 UI
    TerminalSessionStatus.tsx # 세션 상태 표시
```

### 4.2 상태 모델 (Jotai Atoms)

```typescript
// ── Sessions ──
export const terminalSessionsAtom = atom<Map<string, TerminalSessionMeta>>(new Map());
export const activeTerminalSessionAtom = atom<string | null>(null);

// ── Commands ──
export const terminalCommandsAtom = atom<Map<string, TerminalCommand>>(new Map());

// ── Parsed Events ──
export const terminalParsedEventsAtom = atom<Map<string, ParsedTerminalEvent[]>>(new Map());

// ── UI State (per session) ──
export const terminalUiStateAtom = atom<Map<string, TerminalSessionUiState>>(new Map());

interface TerminalSessionUiState {
  searchQuery: string;
  showOnlyErrors: boolean;
  foldedCommands: Record<string, boolean>;
  scrollAtBottom: boolean;
}

// ── Actions ──
export const createTerminalSessionAtom = atom(null, async (get, set, req: CreateSessionRequest) => {
  const meta = await invoke<TerminalSessionMeta>("terminal_create_session", { req });
  set(terminalSessionsAtom, (prev) => new Map(prev).set(meta.id, meta));
  set(activeTerminalSessionAtom, meta.id);
  return meta;
});

export const execInTerminalAtom = atom(null, async (get, set, req: TerminalExecRequest) => {
  const resp = await invoke<TerminalExecResponse>("terminal_exec", { req });
  // session이 새로 만들어졌으면 store 갱신
  if (resp.sessionCreated) {
    set(terminalSessionsAtom, (prev) => new Map(prev).set(resp.sessionId, resp.meta));
  }
  if (req.reveal) {
    set(activeTerminalSessionAtom, resp.sessionId);
  }
  return resp;
});
```

### 4.3 Event Bus

```typescript
// src/features/terminal/lib/terminalEventBus.ts

import { listen } from "@tauri-apps/api/event";

export function initTerminalEventBus(store: JotaiStore) {
  listen<OutputChunk>("terminal://output", ({ payload }) => {
    // xterm.js에 raw data 전달 + buffer atom 갱신
  });

  listen<TerminalCommand>("terminal://command-started", ({ payload }) => {
    store.set(terminalCommandsAtom, (prev) => new Map(prev).set(payload.id, payload));
  });

  listen<TerminalCommand>("terminal://command-ended", ({ payload }) => {
    store.set(terminalCommandsAtom, (prev) => new Map(prev).set(payload.id, payload));
  });

  listen<ParsedTerminalEvent>("terminal://parsed-event", ({ payload }) => {
    store.set(terminalParsedEventsAtom, (prev) => {
      const next = new Map(prev);
      const key = payload.commandId ?? payload.sessionId;
      const list = next.get(key) ?? [];
      next.set(key, [...list, payload]);
      return next;
    });
  });

  listen<TerminalSessionMeta>("terminal://session-status", ({ payload }) => {
    store.set(terminalSessionsAtom, (prev) => new Map(prev).set(payload.id, payload));
  });

  listen<TerminalTaskState>("terminal://task-state", ({ payload }) => {
    // task detection → UI badge 갱신
  });
}
```

---

## 5. 렌더링 전략

### 5.1 xterm.js 판단

| 방안 | 결론 |
|------|------|
| xterm.js 기반 | **추천** — ANSI/PTY 처리 안정적, selection/cursor/scrollback 기본기 좋음 |
| 완전 커스텀 renderer | **비추천** — ANSI, selection, IME, copy/paste, resize, alt buffer, cursor 처리 지옥 |

### 5.2 2-Layer 렌더링 모델

```
┌─────────────────────────────────────┐
│ Layer B: Semantic Overlay / Sidecar │  ← command block, parsed error,
│                                     │     agent provenance, click actions
├─────────────────────────────────────┤
│ Layer A: Raw Terminal View          │  ← 실제 PTY output 렌더,
│ (xterm.js)                          │     cursor, selection, shell interaction
└─────────────────────────────────────┘
```

| Layer | 역할 | 구현 |
|-------|------|------|
| **A: Raw terminal** | PTY output 렌더, cursor, selection, shell interaction | xterm.js |
| **B: Semantic overlay** | command block UI, parsed error/test/progress, agent provenance, click actions | React overlay |

> 이렇게 해야 interactive shell 능력과 semantic 기능을 동시에 가져간다.

### 5.3 Phase별 렌더링 전략

```
Phase 1: xterm.js + Tauri PTY
Phase 2: command tracking + parser sidecar
Phase 3: semantic overlay + agent provenance
Phase 4: replay/approval/task graph
```

---

## 6. 구현 로드맵

### Phase 1. PTY Terminal MVP

**목표:** shell 실행, input/output, resize, tabs, kill

**산출물:**

| 파일 | 설명 |
|------|------|
| `src-tauri/src/terminal/pty_host.rs` | OS별 PTY spawn/read/write |
| `src-tauri/src/terminal/terminal_manager.rs` | 세션 lifecycle |
| `src-tauri/src/terminal/terminal_session.rs` | 세션 상태 |
| `src-tauri/src/terminal/terminal_events.rs` | Tauri event emit |
| `src/features/terminal/ui/TerminalPanel.tsx` | xterm.js panel |
| `src/features/terminal/ui/TerminalTabs.tsx` | 세션 탭바 |
| `src/features/terminal/model/terminalAtoms.ts` | Jotai atoms |
| `src/features/terminal/lib/terminalEventBus.ts` | event listener |

### Phase 2. Command-aware Terminal

**목표:** shell marker integration, command start/end 추적, exit code, elapsed time

**산출물:**

| 파일 | 설명 |
|------|------|
| `src-tauri/src/terminal/shell_integration.rs` | hook script 생성 |
| `src-tauri/src/terminal/command_tracker.rs` | marker → command state |
| `src/features/terminal/ui/TerminalCommandBlock.tsx` | command block UI |

### Phase 3. Semantic Terminal

**목표:** file/stack trace parsing, clickable output, build/test error extraction, problem panel 연동

**산출물:**

| 파일 | 설명 |
|------|------|
| `src-tauri/src/terminal/output_parser.rs` | parser trait + registry |
| `src-tauri/src/terminal/output_parsers/*.rs` | 언어별 파서 |
| `src/features/terminal/ui/TerminalLine.tsx` | clickable links |
| `src/features/terminal/ui/TerminalDecorations.tsx` | parsed event overlay |

### Phase 4. Agent-native Terminal

**목표:** agent provenance, approval flow, rerun/replay, why-this-command UI

**산출물:**

- Provenance model 연동
- Agent terminal bridge
- Command approval UX
- 상세: [002-agent-integration.md](./002-agent-integration.md)

### Phase 5. SOTA Task Terminal

**목표:** dev server detection, progress/task summaries, sequence replay, session snapshot, error-only view, fold/search/filter

**산출물:**

| 파일 | 설명 |
|------|------|
| `src-tauri/src/terminal/task_detector.rs` | task/progress 감지 |
| `src/features/terminal/ui/TerminalToolbar.tsx` | search/filter/replay |
| `src/features/terminal/ui/TerminalSearchBar.tsx` | 검색 UI |

---

## 7. 최종 구조 요약

```
Semantica DevOS Terminal

UI
 ├ TerminalPanel
 ├ SessionTabs
 ├ RawTerminalViewport (xterm.js)
 ├ CommandOverlay
 ├ ParsedDecorations
 └ Search/Filter/Replay Toolbar

Frontend State (Jotai)
 ├ TerminalSessionStore
 ├ CommandStore
 ├ ParsedEventStore
 ├ UiStateStore
 └ AgentProvenanceStore

Bridge (Tauri IPC)
 ├ Commands (create, write, resize, kill, exec, replay)
 └ Event Stream (output, command, parsed, status, task)

Rust Runtime
 ├ TerminalManager
 ├ PTY Host
 ├ Shell Integration
 ├ ANSI Decoder
 ├ Command Tracker
 ├ Output Parser Registry
 ├ Task Detector
 ├ Policy Guard
 └ Event Emitter
```

---

## 관련 문서

- [000-overview.md](./000-overview.md) — 제품 정의 & 전체 기능 스펙
- [002-agent-integration.md](./002-agent-integration.md) — Agent Panel ↔ Terminal 통합
