# RFC-TERMINAL-016: AI Terminal Intelligence Layer

| Field | Value |
|-------|-------|
| ID | RFC-TERMINAL-016-AI-INTELLIGENCE |
| Status | Draft |
| Date | 2026-03-09 |
| Owner | Semantica DevOS |
| Audience | IDE Team, Agent Team, Design Team |
| Parent | RFC-TERMINAL-010-CONSTITUTION |
| Depends On | RFC-TERMINAL-003 (Agent Bridge), RFC-TERMINAL-015 (Parser Pipeline) |
| Scope | AI command suggestion, explain output, ask agent, ghost text, context-aware actions |
| Non-Goals | LLM 모델 선택/호스팅, Agent runtime 내부 구현 |

---

## 1. 문제 정의

현재 Agent Bridge (`AgentTerminalExecRequest`)는 **에이전트 → 터미널** 방향만 설계되어 있다.

SOTA 터미널이 되려면 **터미널 → AI** 방향도 필요하다:

```
현재:   Agent ──exec──→ Terminal ──result──→ Agent    (단방향 도구)
목표:   Agent ←──────→ Terminal ←──────→ Agent        (양방향 파트너)
```

### 1.1 Warp AI 기능 비교

| Warp | 우리 현재 | 우리 목표 |
|------|----------|-----------|
| Ctrl+` 자연어 → 명령어 | 없음 | AI Command Suggest |
| AI 에러 설명 | 없음 | Explain Error |
| AI 디버깅 제안 | 없음 | Ask Agent (block attach) |
| Command 자동완성 ghost | 없음 | Ghost Text |

### 1.2 Warp를 넘어서는 것

| 우리만의 차별점 | 설명 |
|----------------|------|
| **Parsed context** | raw text가 아니라 structured diagnostics/test results를 AI에 전달 |
| **IDE context** | 현재 열린 파일, git diff, 프로젝트 구조를 AI가 참조 |
| **Agent thread 연속성** | 터미널 block을 기존 에이전트 대화에 첨부 (context switch 없음) |
| **Provenance 연결** | 에이전트가 실행한 명령의 결과를 에이전트가 자동으로 인지 |
| **Multi-modal feedback** | 테스트 결과 + 빌드 에러 + 런타임 로그를 통합 피드백 |

---

## 2. 기능 명세

### 2.1 AI Command Suggest (자연어 → 명령어)

#### 트리거

- `Cmd+I` (terminal focused) — AI command input 모드
- 또는 input에 `?` prefix: `? 이 프로젝트 테스트 어떻게 돌려`

#### 플로우

```
사용자: "core 패키지만 테스트 돌려줘"
     │
     ▼
┌─ AI Context ──────────────────────────────────┐
│ • workspace: monorepo (pnpm)                   │
│ • packages: @semantica/core, /protocol, ...    │
│ • package.json scripts: { "test": "vitest" }   │
│ • recent commands: pnpm lint, pnpm build       │
│ • current cwd: /Users/x/project               │
│ • shell: zsh                                    │
└───────────────────────────────────────────────┘
     │
     ▼
AI 응답: "pnpm test --filter=@semantica/core"
     │
     ▼
┌─ Command Preview ─────────────────────────────┐
│ $ pnpm test --filter=@semantica/core           │
│                                                │
│ [Edit]  [Run]  [Cancel]                        │
│ AI: "core 패키지의 vitest를 실행합니다"          │
└───────────────────────────────────────────────┘
```

#### 데이터 모델

```typescript
interface AICommandSuggestRequest {
  query: string;                    // 자연어 입력
  context: TerminalAIContext;       // 프로젝트/세션 컨텍스트
}

interface AICommandSuggestResponse {
  command: string;                  // 생성된 명령어
  explanation: string;              // 왜 이 명령어인지
  confidence: number;               // 0-1
  alternatives?: string[];          // 대안 명령어
}

interface TerminalAIContext {
  cwd: string;
  shellType: ShellType;
  recentCommands: string[];         // 최근 10개
  projectType?: string;             // monorepo, single-package, etc.
  packageManager?: string;          // pnpm, npm, yarn, cargo
  availableScripts?: string[];      // package.json scripts
  gitBranch?: string;
  openFiles?: string[];             // 현재 에디터에 열린 파일
  lastError?: DiagnosticEvent[];    // 마지막 에러
}
```

### 2.2 Ghost Text (입력 중 AI 제안)

#### 트리거

- 사용자가 2글자 이상 입력 후 500ms debounce
- 최근 context 기반으로 AI가 명령어 완성 제안

#### 플로우

```
사용자 입력: "pnpm t"
     │
     ▼ (500ms debounce)
     │
AI 제안: "est --filter=@semantica/core"  ← ghost text (회색)
     │
     ▼
표시: $ pnpm t|est --filter=@semantica/core
               ~~~~~~~~~~~~~~~~~~~~~~~~~~~~  ← ghost (dimmed)
```

#### 수락 방식

| 키 | 동작 |
|----|------|
| `Tab` | 전체 제안 수락 |
| `→` (Right) | 한 단어만 수락 |
| `Esc` | 제안 무시 |
| 계속 타이핑 | 제안 갱신 |

#### 데이터 모델

```typescript
interface GhostTextRequest {
  partialInput: string;             // 현재까지 입력된 텍스트
  context: TerminalAIContext;
  sessionId: string;
}

interface GhostTextResponse {
  completion: string;               // 추가할 텍스트
  displayText: string;              // 표시용 전체 텍스트
  source: "history" | "ai" | "script";
}
```

#### 3-tier 제안 소스 (우선순위)

```
1. History match   — 세션 히스토리에서 prefix 매칭 (즉시, 0ms)
2. Script match    — package.json scripts 매칭 (즉시, 0ms)
3. AI completion   — LLM 기반 제안 (500ms debounce)
```

History/script 매칭이 있으면 AI 호출 생략 (비용 절약).

### 2.3 Explain Error (에러 설명)

#### 트리거

- Failed block의 `[Explain]` 버튼
- 또는 DiagnosticChip 우클릭 → "Explain"

#### 플로우

```
┌─ Block (FAILED) ─────────────────────────────────┐
│ $ pnpm lint                     ✗ exit 1   3.2s  │
│ ─────────────────────────────────────────────────│
│ src/foo.ts:42:13 - error TS2322: Type 'string'   │
│   is not assignable to type 'number'.            │
│ ─────────────────────────────────────────────────│
│ [Rerun] [Copy] [Explain] [Fix with Agent]        │
└──────────────────────────────────────────────────┘
     │
     ▼ [Explain] 클릭
     │
┌─ AI Explanation (inline popover) ────────────────┐
│ TypeScript가 `string` 타입의 값을 `number`        │
│ 타입 변수에 할당하려 해서 발생한 에러입니다.         │
│                                                   │
│ **foo.ts:42**에서 `processCount` 함수가 반환하는   │
│ 값이 `string`인데 `count: number`에 할당하고       │
│ 있습니다.                                          │
│                                                   │
│ 해결: `parseInt(processCount(...))` 또는           │
│ 함수 반환 타입을 수정하세요.                         │
│                                                   │
│ [Open foo.ts:42] [Fix with Agent] [Dismiss]       │
└──────────────────────────────────────────────────┘
```

#### 데이터 모델

```typescript
interface ExplainErrorRequest {
  diagnostics: DiagnosticEvent[];   // parsed 에러들
  command: string;                  // 실행한 명령어
  outputPreview: string;            // 출력 앞 50줄
  context: TerminalAIContext;
  /** 현재 파일 내용 (해당 파일이 열려있을 때) */
  fileContent?: { path: string; content: string; }[];
}

interface ExplainErrorResponse {
  explanation: string;              // markdown 설명
  suggestedFix?: string;           // 코드 수정 제안
  relatedFiles: FileLinkEvent[];    // 관련 파일 링크
  canAutoFix: boolean;              // agent가 자동 수정 가능한지
}
```

### 2.4 Ask Agent (블록 → 에이전트 대화 첨부)

#### 트리거

- Block action → "Ask Agent" / "Fix with Agent"
- 또는 `Cmd+Shift+A` (block focused)

#### 플로우

```
Terminal Block (failed `pnpm lint`)
     │
     ▼ [Fix with Agent]
     │
Agent Chat Panel 활성화
     │
     ▼ 자동 메시지 생성:
┌─ Agent Thread ─────────────────────────────────┐
│ [System] Terminal block attached:               │
│                                                 │
│ ┌─ Terminal Block ───────────────────────┐      │
│ │ $ pnpm lint  ✗ exit 1  3.2s           │      │
│ │ 2 errors:                              │      │
│ │ • TS2322 src/foo.ts:42                │      │
│ │ • TS2345 src/bar.ts:18                │      │
│ └────────────────────────────────────────┘      │
│                                                 │
│ "이 lint 에러들을 수정해주세요"                    │
│                                                 │
│ Agent: 두 파일의 타입 에러를 분석하겠습니다...     │
│ [executing: fix]                                 │
└─────────────────────────────────────────────────┘
```

#### 데이터 모델

```typescript
interface TerminalBlockAttachment {
  blockId: string;
  sessionId: string;
  command: string;
  status: CommandStatus;
  exitCode?: number;
  duration?: number;
  diagnostics: DiagnosticEvent[];
  testResults: TestResultEvent[];
  outputPreview: string;            // 마지막 50줄
  summary?: SummaryEvent;
}

interface AskAgentFromTerminalRequest {
  attachment: TerminalBlockAttachment;
  intent: "explain" | "fix" | "debug" | "custom";
  customMessage?: string;           // 사용자 추가 메시지
  threadId?: string;                // 기존 대화에 첨부 시
}
```

### 2.5 Agent Auto-React (자동 반응)

에이전트가 터미널 실행을 요청하고 결과를 자동으로 처리하는 루프.

```
Agent: "lint를 돌려서 확인하겠습니다"
  │
  ▼ execAgentCommand({ command: "pnpm lint", ... })
  │
Terminal: 실행 → 결과 수집
  │
  ▼ AgentTerminalExecutionResult
  │  { status: "failed", parsedErrors: [...], outputPreview: "..." }
  │
Agent: 자동으로 결과 분석
  │  "2개 에러 발견. src/foo.ts:42 수정하겠습니다"
  │
  ▼ 파일 수정 → 다시 lint 실행 → 통과 확인
```

이 루프는 이미 `AgentTerminalExecutionResult.parsedErrors`로 구조화되어 있다.
Agent runtime에서 result를 받아 다음 행동을 결정하는 것은 Agent 레이어 책임.

**여기서 추가할 것:** `parsedErrors`에 더 풍부한 context 포함:

```typescript
// 기존
parsedErrors?: DiagnosticEvent[];

// 확장
parsedErrors?: DiagnosticEvent[];
parsedTestResults?: TestResultEvent[];
parsedSummary?: SummaryEvent;
taskState?: TerminalTaskState;
```

---

## 3. UI 컴포넌트 구조

```
src/features/terminal/ui/
  ai/
    AICommandInput.tsx              # Cmd+I 자연어 입력 오버레이
    AIGhostText.tsx                 # 입력 중 ghost text 힌트
    AIExplainPopover.tsx            # 에러 설명 팝오버
    AIBlockActions.tsx              # Ask Agent, Explain 버튼 그룹
    TerminalBlockAttachPreview.tsx  # Agent chat에 첨부되는 block 미리보기
```

### 3.1 AICommandInput (Cmd+I 오버레이)

```
┌─ AI Command ─────────────────────────────────────────┐
│ 🔍 무엇을 실행할까요?                                  │
│ ┌──────────────────────────────────────────────────┐ │
│ │ core 패키지만 테스트 돌려줘                        │ │
│ └──────────────────────────────────────────────────┘ │
│                                                       │
│ ┌─ Preview ────────────────────────────────────────┐ │
│ │ $ pnpm test --filter=@semantica/core              │ │
│ │                                                   │ │
│ │ vitest를 core 패키지에서만 실행합니다              │ │
│ └───────────────────────────────────────────────────┘ │
│                                                       │
│ [Edit]  [Run ↵]  [Cancel Esc]                        │
└───────────────────────────────────────────────────────┘
```

z-30. 포커스 트랩. Esc로 닫기. Enter로 즉시 실행.

### 3.2 AIGhostText

xterm.js 위에 겹치는 absolute positioned span.
커서 위치 계산은 xterm의 `buffer.cursorX/cursorY` + cell dimensions.

```typescript
interface AIGhostTextProps {
  text: string;                     // 제안 텍스트
  cursorX: number;                  // xterm cell X
  cursorY: number;                  // xterm cell Y
  cellWidth: number;                // px per cell
  cellHeight: number;               // px per cell
  onAccept: () => void;             // Tab
  onAcceptWord: () => void;         // →
  onDismiss: () => void;            // Esc
}
```

### 3.3 AIExplainPopover

Block 하단 또는 DiagnosticChip 옆에 표시되는 설명 팝오버.

```typescript
interface AIExplainPopoverProps {
  explanation: ExplainErrorResponse;
  anchor: { x: number; y: number };
  onOpenFile: (link: FileLinkEvent) => void;
  onFixWithAgent: () => void;
  onDismiss: () => void;
}
```

---

## 4. Atom 설계

```typescript
// ─── AI State ─────────────────────────────────────────
export const terminalAICommandInputAtom = atom<{
  visible: boolean;
  query: string;
  loading: boolean;
  result: AICommandSuggestResponse | null;
}>({
  visible: false,
  query: "",
  loading: false,
  result: null,
});

export const terminalGhostTextAtom = atom<{
  sessionId: string;
  text: string;
  source: "history" | "ai" | "script";
} | null>(null);

export const terminalExplainAtom = atom<{
  commandId: string;
  loading: boolean;
  result: ExplainErrorResponse | null;
} | null>(null);
```

---

## 5. Agent ↔ Terminal Context Bus

AI 기능들이 공통으로 참조하는 **TerminalAIContext**를 실시간 구축:

```typescript
/** 현재 터미널 세션의 AI 컨텍스트를 실시간으로 도출 */
export const terminalAIContextAtom = atom<TerminalAIContext>((get) => {
  const session = get(activeTerminalSessionAtom);
  const commands = get(activeSessionCommandsAtom);
  // ... surfaceAtoms에서 openFiles, gitBranch 등 추출

  return {
    cwd: session?.cwd ?? process.cwd(),
    shellType: session?.shellType ?? "zsh",
    recentCommands: commands.slice(-10).map((c) => c.command),
    // ... project detection, package manager, scripts
  };
});
```

이 atom은 모든 AI 요청의 공통 context가 된다.

---

## 6. 비용 & 성능 제약

| 제약 | 값 | 이유 |
|------|-----|------|
| Ghost text debounce | 500ms | LLM 호출 빈도 제한 |
| Ghost text max tokens | 50 | 짧은 완성만 (비용 절약) |
| Explain max context | 파일 2개 + 출력 50줄 | 토큰 제한 |
| History match 우선 | 즉시, AI 호출 안 함 | 무료 |
| AI 기능 끄기 옵션 | Settings에서 toggle | 비용/프라이버시 |
| 로컬 모델 지원 | V2 | Ollama 등 로컬 추론 지원 |

---

## 7. 구현 순서

| 순서 | 작업 | Scope | 의존성 |
|------|------|-------|--------|
| 1 | `TerminalAIContext` atom 구현 | V1 | 기존 atoms |
| 2 | History-based ghost text (no AI) | V1 | 1 |
| 3 | Block action buttons (Explain, Ask Agent) | V1 | CommandBlock |
| 4 | `AskAgentFromTerminal` → Agent panel 연동 | V1 | Agent panel |
| 5 | `TerminalBlockAttachPreview` 컴포넌트 | V1 | 4 |
| 6 | AI Command Input (Cmd+I) | V1.5 | AI backend |
| 7 | AI Ghost Text (LLM) | V1.5 | AI backend |
| 8 | AI Explain Popover | V1.5 | 015 Parser + AI |
| 9 | Agent Auto-React 확장 결과 | V1 | 기존 bridge |
| 10 | 로컬 모델 지원 | V2 | Ollama integration |

---

## 8. Warp 대비 최종 포지션

```
Warp AI:
  • 자연어 → 명령어 (Ctrl+`)     → 우리: AI Command Input (Cmd+I)
  • AI 에러 설명                   → 우리: Explain + structured diagnostics
  • AI 디버깅 제안                  → 우리: Ask Agent + IDE context
  • Ghost text                     → 우리: 3-tier (history → script → AI)

우리만의 것 (Warp에 없는):
  • Block → Agent thread 첨부       → context switch 없는 디버깅
  • Parsed context 기반 AI          → raw text 대신 structured data
  • Agent 실행 결과 자동 인지         → 자동 반복 수정 루프
  • IDE 파일 context 참조            → 코드와 에러를 동시에 보는 AI
  • Multi-modal 피드백              → test + build + runtime 통합
```

---

## 관련 문서

- [003-agent-terminal-bridge.md](./003-agent-terminal-bridge.md) — Agent → Terminal 실행 프로토콜
- [015-semantic-output-parser-pipeline.md](./015-semantic-output-parser-pipeline.md) — Parsed event 생성
- [004-warp-level-ux.md](./004-warp-level-ux.md) — Block action UX 스펙
- [013-event-state-ssot.md](./013-event-state-ssot.md) — 이벤트/상태 스키마
