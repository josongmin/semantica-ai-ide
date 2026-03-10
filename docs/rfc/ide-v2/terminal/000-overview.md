# RFC-TERMINAL-000: AI-native Terminal for Tauri DevOS — 제품 정의 & 전체 기능 스펙

| Field | Value |
|-------|-------|
| ID | RFC-TERMINAL-000-OVERVIEW |
| Status | Draft |
| Date | 2026-03-08 |
| Owner | Semantica DevOS |
| Audience | IDE Team, Engine Team, Agent Team |
| Parent | RFC-001-V2 Frontend Integration Kernel |
| Depends On | RFC-015 Monorepo Structure, RFC-016 Floating Console (분리 확정) |
| Scope | Terminal 제품 정의, SOTA 기능 스펙, 데이터 모델, 우선순위 |
| Non-Goals | tmux 대체, SSH orchestration, K8s dashboard, full debugger UI |

---

## 1. 핵심 방향

AI-native IDE에서 terminal은 단순 shell text view가 아니다.
4개 시스템이 합쳐진 **구조화된 실행 표면**이다.

```
PTY 실행기
+ 스트림 파서
+ 구조화 이벤트 버스
+ IDE/Agent 통합 UI
```

목표 진화 경로:

```
plain terminal
→ semantic terminal
→ agent-observable terminal
→ replayable execution surface
```

핵심 한 줄:

> **shell text stream → structured execution surface** 로 승격시키는 게 본질이다.

---

## 2. Terminal의 역할

Tauri 기반 DevOS에서 terminal은 다음을 담당한다.

| 영역 | 세부 |
|------|------|
| **Shell 실행** | 실제 shell/bash/zsh/fish/cmd/powershell 실행, stdin/stdout/stderr 스트리밍 |
| **명령 추적** | 명령 실행 단위 추적, exit code, 실행 시간, cwd/env snapshot |
| **출력 의미 해석** | file:line 링크, 테스트 결과, 빌드 에러, 런타임 에러, 스택 트레이스 |
| **IDE 연결** | 파일/라인 클릭 → 에디터 열기, Problems panel 연동, Test panel 연동 |
| **Agent 연결** | agent가 실행한 command 표시, provenance 표시, replay/approve/intercept |
| **세션 관리** | 다중 탭, 히스토리, 스냅샷, 재시작 후 복원 |

---

## 3. Terminal이 아닌 것

| Non-Goal | 이유 |
|----------|------|
| 완전한 tmux 대체 | multiplexer는 별도 도구의 영역 |
| SSH orchestration 플랫폼 | remote dev는 별도 surface |
| Kubernetes dashboard | infra 모니터링은 별도 |
| Full debugger UI | debugger는 별도 surface |
| 모든 로그를 terminal 하나로 통합 | 아래 분리 필요 |

**Surface 분리 원칙:**

| Surface | 역할 |
|---------|------|
| **Terminal** | shell process / PTY 실행 |
| **Console** | engine / app / system log viewer (RFC-016) |
| **Agent Timeline** | AI 계획 / 행동 / 툴 호출 기록 |
| **Problems** | 에러 / 경고 구조화 패널 |

Terminal은 이 중 **execution surface**다.

---

## 4. SOTA 목표 상태 — 10개 축

| # | 축 | 설명 |
|---|-----|------|
| 1 | PTY 기반 실제 터미널 | 진짜 shell 실행, ANSI/UTF-8 처리 |
| 2 | 다중 세션/탭 | 세션별 shell/cwd/env 분리, 탭 관리 |
| 3 | 구조화 명령 단위 모델 | command start/end/exit code 추적 |
| 4 | Semantic output parsing | build error, test result, stack trace 구조화 |
| 5 | Clickable output | file:line, URL, port → IDE 액션 연결 |
| 6 | Agent-aware execution | provenance, approval, rerun |
| 7 | Replay / rerun / clone | command 재실행, sequence replay |
| 8 | Task/progress understanding | dev server, watch mode, progress 감지 |
| 9 | IDE surface federation | Problems/Test/Preview panel 연동 |
| 10 | Persistence / snapshot / observability | 세션 복원, 히스토리, 스냅샷 |

---

## 5. 전체 기능 스펙

### 5.1 Core Terminal Runtime

**필수 스펙:**

| 항목 | 스펙 |
|------|------|
| OS 지원 | macOS: zsh/bash, Linux: bash/zsh/sh, Windows: PowerShell/cmd |
| 인코딩 | UTF-8 |
| 스트림 | raw stream 기반 (line-buffered 아님) |
| ANSI | 전체 ANSI escape sequence 처리 |
| PTY | window resize 지원 |
| 프로세스 | stdin/stdout/stderr 연결, kill/restart, exit code 수집 |
| 환경 | cwd 변경, env 주입 |

**핵심 원칙:**

> Tauri 프론트가 직접 shell 실행하면 안 된다.
> Rust side에 PTY host가 있어야 한다.

---

### 5.2 Multi Session / Multi Tab

**기능:**

- 여러 terminal session 동시 실행
- 탭별 이름 지정
- 세션 pin / 복제
- 세션별 shell/cwd/env 분리
- background running 표시

**세션 메타데이터:**

```typescript
interface TerminalSessionMeta {
  id: string;
  title: string;
  shell: "zsh" | "bash" | "pwsh" | "cmd" | "sh";
  cwd: string;
  createdAt: number;
  updatedAt: number;
  status: "starting" | "running" | "exited" | "failed";
  exitCode?: number;
  source: "user" | "agent" | "task" | "system";
  pinned?: boolean;
  /** agent 연결 — 002-agent-integration 참조 */
  ownerAgentRunId?: string;
  purpose?: "lint" | "test" | "build" | "dev-server" | "custom";
}
```

**UX:**

- 하단 panel 또는 floating terminal window 둘 다 가능
- 탭바 우클릭: rename, duplicate, kill, reveal cwd, export output

---

### 5.3 Command Boundary Tracking

> **이게 SOTA 핵심이다.**
> 일반 terminal은 바이트 스트림이다.
> AI-native terminal은 **"어떤 명령이 언제 시작해서 언제 끝났는지"**를 알아야 한다.

**기능:**

| 기능 | 설명 |
|------|------|
| command 시작/종료 감지 | shell integration marker 기반 |
| exit code 연결 | 성공/실패 즉시 판별 |
| 실행 시간 계산 | startedAt → endedAt duration |
| cwd/env snapshot 연결 | 실행 시점의 컨텍스트 보존 |
| command source 연결 | user typed / agent executed / task runner executed |

**모델:**

```typescript
interface TerminalCommand {
  id: string;
  sessionId: string;
  text: string;
  normalizedText: string;
  source: "user" | "agent" | "task" | "system";
  startedAt: number;
  endedAt?: number;
  exitCode?: number;
  cwd: string;
  envPatch?: Record<string, string>;
  status: "running" | "succeeded" | "failed" | "cancelled";
  trigger?: {
    agentRunId?: string;
    toolCallId?: string;
    taskId?: string;
    planStepId?: string;
  };
}
```

**구현 핵심 — Shell Integration Marker:**

단순 stdout parsing만으로는 불안정하다.
가장 좋은 방식은 **shell integration marker**를 넣는 것이다.

- zsh/bash: `preexec`/`precmd` hook 삽입
- PowerShell: prompt wrapper 삽입
- hook이 command start/end marker를 PTY output으로 emit

```
__SEM_TERM_CMD_START__:<json>
__SEM_TERM_CMD_END__:<json>
```

이 마커는 UI에는 보이지 않게 parser 단계에서 제거한다.

---

### 5.4 Structured Output Parsing

> **plain terminal과 semantic terminal의 차이.**

stdout/stderr text를 **구조화 이벤트로 승격**한다.

**모델:**

```typescript
interface ParsedTerminalEvent {
  id: string;
  sessionId: string;
  commandId?: string;
  kind:
    | "raw-line"
    | "file-link"
    | "stack-frame"
    | "test-result"
    | "build-error"
    | "progress"
    | "url"
    | "port"
    | "task-summary";
  level?: "info" | "warn" | "error" | "debug";
  text: string;
  payload?: Record<string, unknown>;
  timestamp: number;
}
```

**파서 플러그인 목록:**

| 카테고리 | 대상 |
|----------|------|
| TypeScript | tsc, eslint |
| Test | Jest, Vitest, pytest, go test, cargo test |
| Build | cargo/rustc, gcc/clang, webpack, vite |
| Runtime | Node stacktrace, Python traceback, Java stacktrace, Rust panic |
| Dev server | next.js, vite, pnpm dev |
| Package | npm/pnpm/yarn, docker compose |

**파싱 예시:**

```
src/foo.ts:42:13 - error TS2322

→ {
    kind: "build-error",
    level: "error",
    payload: {
      file: "src/foo.ts",
      line: 42,
      column: 13,
      code: "TS2322"
    }
  }
```

---

### 5.5 Clickable Terminal Output

| 패턴 | 액션 |
|------|------|
| `path:line` / `path:line:column` | 에디터에서 파일 열기 |
| Python traceback / Node stack / Java stack | 파일/라인으로 이동 |
| Rust panic path | 파일/라인으로 이동 |
| `http://localhost:xxxx` | preview/browser 연결 |
| URL | 브라우저 열기 |
| test failure | test source 열기 |

**구현:** Terminal line render 시 tokenization 후 inline link span 생성.

---

### 5.6 Agent-aware Terminal

> **AI IDE에서 거의 필수.**
> 상세는 [002-agent-integration.md](./002-agent-integration.md) 참조.

**기능:**

- agent가 실행한 command 표시 (badge + provenance)
- agent run / tool call과 연결
- command approval mode (auto-run / safe mode)
- user takeover: stop / retry / edit-and-rerun
- "why ran this?" tooltip
- rerun as user / copy to shell

**표시 예:**

```
[Agent] npm test          ← agent badge
[Agent] cargo build       ← provenance hover 가능
[You]   git status        ← user command
```

**Provenance 모델:**

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

### 5.7 Replay / Rerun / Clone

| 기능 | 설명 |
|------|------|
| 이전 command 재실행 | line hover → rerun |
| command block 복제 | 같은 cwd/env로 다시 실행 |
| 실패 command만 재실행 | failed test → rerun failed only |
| 전체 sequence replay | build + test → "rerun pipeline" |
| agent-run command chain replay | agent가 실행한 체인 전체 replay |

**모델:**

```typescript
interface ReplaySpec {
  sessionId: string;
  commands: string[];
  cwd: string;
  envPatch?: Record<string, string>;
  mode: "interactive" | "detached" | "agent-supervised";
}
```

---

### 5.8 Long-running Task / Progress Awareness

IDE는 `pnpm dev`를 그냥 text로 보지 않고 다음을 이해해야 한다:

- dev server running
- port 3000 open
- preview available
- restart available

**모델:**

```typescript
interface TerminalTaskState {
  commandId: string;
  taskKind?: "dev-server" | "test-run" | "build" | "watch" | "package-install";
  progress?: number;
  portBindings?: number[];
  isWatchMode?: boolean;
  isInteractive?: boolean;
}
```

---

### 5.9 Search / Filter / Fold

| 기능 | 설명 |
|------|------|
| terminal 내 검색 | text search |
| command별 필터 | error only, warnings only, current command only, source(agent/user) |
| command block fold/unfold | 긴 출력 접기 |
| raw/parsed view 전환 | semantic overlay on/off |

> 전체 로그를 다 보여주면 시끄럽다.
> **command block 단위 접기 필수**, 에러/테스트 실패만 보는 모드 필요.

---

### 5.10 Persistence / History / Snapshot

**저장 대상:**

- 탭 목록, 최근 cwd, session title
- command history, collapsed state
- parser-derived summaries

**저장하지 않을 것:**

- 민감 env 전체
- raw stdin secrets
- shell complete state 전체

---

### 5.11 IDE Surface 연동

Terminal은 독립 surface지만 IDE의 다른 surface와 연동되어야 한다.

| Terminal 출력 | 연동 대상 |
|---------------|-----------|
| build error | Problems panel |
| test fail | Test panel |
| dev server start | Preview panel |
| stack trace | Debug/Trace panel |
| package install | dependency graph refresh |

> 이 연동이 없으면 terminal이 그냥 예쁜 로그창에서 끝난다.

---

### 5.12 Security / Safety

| 기능 | 설명 |
|------|------|
| dangerous command detection | rm -rf, git push, sudo 등 감지 |
| 승인 정책 | write/delete/network/install command에 대한 policy |
| workspace boundary | 작업 디렉토리 밖 실행 제한 |
| allowlist / denylist | 명령어 화이트/블랙 리스트 |
| environment redaction | 민감 env 마스킹 |
| secret masking | 출력에 포함된 시크릿 마스킹 |

**AI가 실행할 때 특히 중요한 차단/승인 대상:**

```
rm -rf          git push        curl ... | sh
sudo            brew install    npm publish
docker system prune
```

> UI 조건문으로 막지 말고 **runtime policy 엔진**으로 막아야 한다.

---

## 6. 데이터 모델 요약

> **Note:** 아래 모델은 초기 설계 스냅샷이다.
> **정식 SSOT는 [013-event-state-ssot.md](./013-event-state-ssot.md)를 참조**할 것.
> 필드명/타입이 다를 경우 013이 우선한다.

```typescript
// ── Session ──
interface TerminalSessionMeta {
  id: string;
  title: string;
  shell: string;
  cwd: string;
  status: "starting" | "running" | "exited" | "failed";
  source: "user" | "agent" | "task" | "system";
  createdAt: number;
  updatedAt: number;
  exitCode?: number;
  ownerAgentRunId?: string;
  purpose?: "lint" | "test" | "build" | "dev-server" | "custom";
}

// ── Command ──
interface TerminalCommand {
  id: string;
  sessionId: string;
  text: string;
  normalizedText: string;
  source: "user" | "agent" | "task" | "system";
  cwd: string;
  startedAt: number;
  endedAt?: number;
  exitCode?: number;
  status: "running" | "succeeded" | "failed" | "cancelled";
  trigger?: {
    agentRunId?: string;
    toolCallId?: string;
    planStepId?: string;
  };
}

// ── Line ──
interface TerminalLine {
  id: string;
  sessionId: string;
  commandId?: string;
  ts: number;
  kind: "stdout" | "stderr" | "system";
  text: string;
  ansiFragments?: Array<{ text: string; className?: string }>;
}

// ── Parsed Event ──
interface ParsedTerminalEvent {
  id: string;
  sessionId: string;
  commandId?: string;
  kind: "raw-line" | "file-link" | "stack-frame" | "test-result"
      | "build-error" | "progress" | "url" | "port" | "task-summary";
  level?: "info" | "warn" | "error" | "debug";
  text: string;
  payload?: Record<string, unknown>;
  timestamp: number;
}
```

---

## 7. 우선순위

### P0 — 없으면 terminal이 아님

- PTY shell 실행
- tabs / sessions
- resize / kill
- xterm.js 렌더링
- command start/end tracking
- exit code
- file:line clickable
- raw output streaming

### P1 — semantic terminal 핵심

- parser registry (tsc, jest, cargo 등)
- test/build error extraction
- problem panel 연동
- agent provenance
- replay one command
- session persistence

### P2 — agent-native 핵심

- approval mode
- progress / task detection
- dev server / port detection
- command block fold
- search / filter / error-only

### P3 — SOTA 완성

- full sequence replay
- snapshot export
- semantic summaries
- command graph view
- AI explanation for errors

---

## 8. 설계상 중요한 판단 7개

| # | 판단 | 이유 |
|---|------|------|
| 1 | **Console과 Terminal은 분리** | 합치면 나중에 무조건 꼬인다 |
| 2 | **Command tracking은 shell marker 기반** | stdout 추정만으로 하면 정확도 낮다 |
| 3 | **Raw terminal과 semantic overlay 분리** | 둘을 한 렌더러에 넣으면 복잡도 폭발 |
| 4 | **xterm.js 먼저 쓰기** | terminal renderer 직접 만드는 건 ROI 너무 낮다 |
| 5 | **Parser는 plugin registry** | 언어/도구별 추가가 쉬워야 한다 |
| 6 | **Agent provenance는 처음부터 모델에 넣기** | 나중에 얹으면 command history schema가 또 바뀐다 |
| 7 | **Security approval layer는 분리된 policy 엔진** | UI 조건문으로 막지 말고 runtime policy로 막아야 한다 |

---

## 관련 문서

### 설계 문서 (000–005)

- [001-architecture.md](./001-architecture.md) — Tauri 구현 아키텍처 (Rust runtime + Frontend + IPC)
- [002-agent-integration.md](./002-agent-integration.md) — Agent Panel ↔ Terminal 통합
- [003-agent-terminal-bridge.md](./003-agent-terminal-bridge.md) — Agent Bridge + Command Card + Activity Bar
- [004-warp-level-ux.md](./004-warp-level-ux.md) — Warp-Level UX (Block, Input Editor, Search, Workflow, Completions)
- [005-compatibility-and-components.md](./005-compatibility-and-components.md) — 호환성 계약, 2-Layer 렌더링, 최종 컴포넌트 구조

### Lock 문서 (010–014) — 구현 전 필수 고정

- [010-constitution.md](./010-constitution.md) — **헌법**: 비가역 원칙, 제품 경계, 모드 계약, Fallback 철학
- [011-scope-lock.md](./011-scope-lock.md) — V1 / V1.5 / V2 범위 분리
- [012-compatibility-contract.md](./012-compatibility-contract.md) — 호환성 게이트, 테스트 매트릭스, 호환 대상
- [013-event-state-ssot.md](./013-event-state-ssot.md) — FE/Rust/Agent 공통 스키마 & 이벤트 SSOT
- [014-gates-and-acceptance.md](./014-gates-and-acceptance.md) — Gate 체계, Acceptance 기준, 설정, Merge 조건

### 외부 참조

- [RFC-016 Floating Console](../rfc-ide-console-001.md) — Console (engine/system log) — Terminal과 분리
