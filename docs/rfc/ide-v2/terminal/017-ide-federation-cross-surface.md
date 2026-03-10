# RFC-TERMINAL-017: IDE Federation & Cross-Surface Actions

| Field | Value |
|-------|-------|
| ID | RFC-TERMINAL-017-IDE-FEDERATION |
| Status | Draft |
| Date | 2026-03-09 |
| Owner | Semantica DevOS |
| Audience | IDE Team, Agent Team, Design Team |
| Parent | RFC-TERMINAL-010-CONSTITUTION |
| Depends On | RFC-TERMINAL-015 (Parser), RFC-TERMINAL-016 (AI Intelligence) |
| Scope | Terminal ↔ Editor navigation, Terminal → Agent thread, Terminal → Problems panel, Block actions, Cross-surface intent protocol |
| Non-Goals | Editor/Graph surface 내부 구현, Agent runtime 내부 |

---

## 1. 문제 정의

터미널은 단독 surface가 아니라 **IDE의 일부**다.
현재 `FileLinkChip.onClick`, `DiagnosticChip.onClick` 콜백이 존재하지만,
**실제로 에디터를 열거나 Agent panel로 전환하는 연결이 없다.**

이 RFC는 터미널에서 발생하는 모든 cross-surface 인텐트를 정의하고,
각 인텐트가 어떤 surface/panel을 활성화하는지 명세한다.

---

## 2. 인텐트 목록

### 2.1 전체 Cross-Surface Intent

| Intent | From | To | 트리거 |
|--------|------|----|--------|
| `open-file` | Terminal | Editor Surface | FileLinkChip 클릭, DiagnosticChip 클릭 |
| `open-problems` | Terminal | Problems Panel | Failed block → "Open Problems" |
| `ask-agent` | Terminal | Agent Panel (Chat) | Block → "Ask Agent" / "Fix with Agent" |
| `attach-to-thread` | Terminal | Agent Panel (Chat) | Block → "Attach to thread" |
| `reveal-terminal` | Agent Panel | Terminal Panel | Agent command card 클릭 |
| `open-in-graph` | Terminal | Graph Surface | Block → "Show in graph" (의존성 시각화) |
| `copy-to-editor` | Terminal | Editor Surface | Block output → "Open in editor" (scratchpad) |

### 2.2 Intent Protocol

```typescript
/**
 * Cross-surface navigation intent.
 * Terminal 또는 다른 surface에서 발생하여 intent router가 처리.
 */
interface SurfaceIntent {
  readonly type: string;
  readonly source: SurfaceSource;
  readonly payload: unknown;
  readonly timestamp: number;
}

type SurfaceSource =
  | { surface: "terminal"; sessionId: string; commandId?: string }
  | { surface: "editor"; fileId: string }
  | { surface: "agent"; threadId: string }
  | { surface: "graph"; nodeId: string };
```

---

## 3. Intent 상세 명세

### 3.1 `open-file` — 파일 열기 + 라인 점프

**가장 핵심적인 cross-surface 액션.**

#### 트리거 소스

1. `FileLinkChip` 클릭 → `{ file, line, column }`
2. `DiagnosticChip` 클릭 → `{ file, line, column, message }`
3. Stack trace의 file:line 클릭
4. 터미널 output에서 감지된 `file:line:col` 패턴

#### Intent 페이로드

```typescript
interface OpenFileIntent extends SurfaceIntent {
  type: "open-file";
  payload: {
    file: string;          // 절대 경로 또는 workspace 상대 경로
    line: number;
    column?: number;
    /** 열린 후 하이라이트할 범위 (선택) */
    highlight?: {
      startLine: number;
      endLine: number;
    };
    /** 에디터 사이드에 표시할 인라인 힌트 */
    inlineHint?: {
      severity: "error" | "warning" | "info";
      message: string;
    };
    /** 이미 열려있으면 포커스만, 아니면 새 탭 */
    revealMode: "focus" | "peek" | "side";
  };
}
```

#### 경로 해석 전략

```typescript
function resolveFilePath(rawPath: string, sessionCwd: string, workspaceRoot: string): string {
  // 1. 절대 경로 → 그대로
  if (path.isAbsolute(rawPath)) return rawPath;

  // 2. 세션 cwd 기준 상대 경로 → 절대화
  const fromCwd = path.resolve(sessionCwd, rawPath);
  if (fs.existsSync(fromCwd)) return fromCwd;

  // 3. workspace root 기준 상대 경로
  const fromRoot = path.resolve(workspaceRoot, rawPath);
  if (fs.existsSync(fromRoot)) return fromRoot;

  // 4. Fuzzy match (file name only)
  return fuzzyResolve(rawPath, workspaceRoot) ?? rawPath;
}
```

#### Handler 구현 (IntentRouter)

```typescript
// src/app/shell/useIntentRouter.ts — 기존 intent router에 추가

case "open-file": {
  const { file, line, column, revealMode, inlineHint } = intent.payload;
  const resolved = resolveFilePath(file, sessionCwd, workspaceRoot);

  // Editor surface에서 파일 열기
  openEditorSurface(resolved, {
    line,
    column,
    revealMode,
  });

  // 인라인 힌트가 있으면 에디터에 전달
  if (inlineHint) {
    addEditorDecoration(resolved, line, inlineHint);
  }
  break;
}
```

#### VSCode Extension 환경에서

```typescript
// VSCode API 사용 시
import * as vscode from "vscode";

async function openFileInVSCode(file: string, line: number, column?: number) {
  const uri = vscode.Uri.file(file);
  const position = new vscode.Position(line - 1, (column ?? 1) - 1);
  const doc = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(doc, {
    selection: new vscode.Range(position, position),
    viewColumn: vscode.ViewColumn.One,
  });
}
```

#### Tauri Desktop 환경에서

```typescript
// Tauri에서는 자체 EditorSurface로 열기
function openFileInTauri(file: string, line: number, column?: number) {
  const surfaceId = `editor:${file}`;
  dispatch({
    type: "surface.open",
    surfaceId,
    params: { file, line, column },
  });
  // 또는 이미 열려있으면 포커스 + 스크롤
}
```

### 3.2 `open-problems` — Problems Panel 연동

#### 트리거

Failed block → "Open Problems" 버튼

#### 플로우

```
Terminal Block (failed, 2 errors)
     │
     ▼ "Open Problems" 클릭
     │
Problems Panel 활성화
     │
     ▼ 필터: 이 command에서 나온 diagnostics만 표시
     │
┌─ Problems ──────────────────────────────────────┐
│ Filter: pnpm lint (session:abc, cmd:xyz)         │
│ ─────────────────────────────────────────────────│
│ ✗ src/foo.ts:42:13  TS2322  Type 'string'...    │
│ ✗ src/bar.ts:18:5   TS2345  Argument of...      │
└──────────────────────────────────────────────────┘
```

#### Intent 페이로드

```typescript
interface OpenProblemsIntent extends SurfaceIntent {
  type: "open-problems";
  payload: {
    filter: {
      sessionId: string;
      commandId: string;
    };
    diagnostics: DiagnosticEvent[];
  };
}
```

### 3.3 `ask-agent` — Agent Panel로 블록 전달

#### 트리거

- Block → "Ask Agent" / "Fix with Agent"
- `Cmd+Shift+A` (block focused)

#### Intent 페이로드

```typescript
interface AskAgentIntent extends SurfaceIntent {
  type: "ask-agent";
  payload: {
    attachment: TerminalBlockAttachment;   // RFC-016에서 정의
    intent: "explain" | "fix" | "debug" | "custom";
    customMessage?: string;
    /** 기존 thread에 첨부할 경우 */
    threadId?: string;
    /** 새 thread 생성 시 자동 메시지 */
    autoMessage?: string;
  };
}
```

#### Handler

```typescript
case "ask-agent": {
  const { attachment, intent: agentIntent, threadId, autoMessage } = intent.payload;

  // 1. Agent panel 활성화
  activatePanel("agent-chat");

  // 2. Block attachment를 Agent chat에 주입
  if (threadId) {
    appendToThread(threadId, {
      type: "terminal-block",
      data: attachment,
    });
  } else {
    // 새 thread 생성
    createThread({
      initialAttachment: { type: "terminal-block", data: attachment },
      autoMessage: autoMessage ?? generateAutoMessage(attachment, agentIntent),
    });
  }
  break;
}

function generateAutoMessage(
  attachment: TerminalBlockAttachment,
  intent: string,
): string {
  switch (intent) {
    case "fix":
      return `\`${attachment.command}\` 실행이 실패했습니다. ${attachment.diagnostics.length}개 에러를 수정해주세요.`;
    case "explain":
      return `\`${attachment.command}\` 출력을 설명해주세요.`;
    case "debug":
      return `\`${attachment.command}\`이 예상과 다른 결과입니다. 디버깅해주세요.`;
    default:
      return `터미널 블록을 확인해주세요: \`${attachment.command}\``;
  }
}
```

### 3.4 `reveal-terminal` — Agent → Terminal 역방향

Agent command card에서 터미널 블록으로 점프.

```typescript
interface RevealTerminalIntent extends SurfaceIntent {
  type: "reveal-terminal";
  payload: {
    sessionId: string;
    commandId: string;
    scrollTo: boolean;
  };
}
```

Handler:
1. Bottom panel 열기 (terminal)
2. 해당 session tab 활성화
3. 해당 command block으로 스크롤

### 3.5 `copy-to-editor` — 출력을 에디터에서 열기

Block output을 scratchpad 에디터에서 열기 (full ANSI → plain text).

```typescript
interface CopyToEditorIntent extends SurfaceIntent {
  type: "copy-to-editor";
  payload: {
    title: string;          // "pnpm lint output"
    content: string;        // plain text output
    language?: string;       // syntax highlight hint
  };
}
```

---

## 4. Block Action 바인딩

### 4.1 CommandBlock 확장

현재 `CommandBlock.tsx`에 `onRerun`만 있다. 다음을 추가:

```typescript
export interface CommandBlockProps {
  command: TerminalCommand;
  outputLineCount?: number;
  parsedEvents?: ParsedTerminalEvent[];
  summary?: SummaryEvent;

  // Actions
  onRerun?: (command: TerminalCommand) => void;
  onCopyCommand?: (command: TerminalCommand) => void;
  onCopyOutput?: (command: TerminalCommand) => void;
  onOpenFile?: (link: FileLinkEvent) => void;
  onOpenProblems?: (command: TerminalCommand, diagnostics: DiagnosticEvent[]) => void;
  onAskAgent?: (command: TerminalCommand, intent: "explain" | "fix" | "debug") => void;
  onExplain?: (command: TerminalCommand) => void;

  className?: string;
  defaultCollapsed?: boolean;
}
```

### 4.2 Block Action Bar

```
┌─ Block Actions (failed block) ──────────────────────────┐
│ [↻ Rerun] [⎘ Copy] [📂 Problems] [Explain] [Fix Agent] │
└──────────────────────────────────────────────────────────┘

┌─ Block Actions (success block) ─────────────────────────┐
│ [↻ Rerun] [⎘ Copy]                                      │
└──────────────────────────────────────────────────────────┘
```

```typescript
const BlockActions = memo(function BlockActions({
  command,
  diagnostics,
  onRerun,
  onCopyCommand,
  onOpenProblems,
  onAskAgent,
  onExplain,
}: BlockActionsProps) {
  const hasDiagnostics = diagnostics.length > 0;
  const isFailed = command.status === "failed";

  return (
    <div className="flex items-center gap-1 px-2 py-1 border-t border-vsc-border/20">
      <ActionButton icon="debug-restart" label="Rerun" onClick={() => onRerun?.(command)} />
      <ActionButton icon="copy" label="Copy" onClick={() => onCopyCommand?.(command)} />
      {hasDiagnostics && (
        <ActionButton icon="warning" label="Problems"
          onClick={() => onOpenProblems?.(command, diagnostics)} />
      )}
      {isFailed && (
        <>
          <ActionButton icon="lightbulb" label="Explain"
            onClick={() => onExplain?.(command)} />
          <ActionButton icon="hubot" label="Fix with Agent"
            onClick={() => onAskAgent?.(command, "fix")} />
        </>
      )}
    </div>
  );
});
```

---

## 5. Intent Router 통합

### 5.1 기존 IntentRouter 확장

[useIntentRouter.ts](../../src/app/shell/useIntentRouter.ts)에 terminal intent handlers 추가:

```typescript
// Terminal-specific intents
function handleTerminalIntent(intent: SurfaceIntent) {
  switch (intent.type) {
    case "open-file":
      handleOpenFile(intent.payload);
      break;
    case "open-problems":
      handleOpenProblems(intent.payload);
      break;
    case "ask-agent":
      handleAskAgent(intent.payload);
      break;
    case "reveal-terminal":
      handleRevealTerminal(intent.payload);
      break;
    case "copy-to-editor":
      handleCopyToEditor(intent.payload);
      break;
  }
}
```

### 5.2 Intent Dispatch 함수

TerminalPanel에서 사용할 dispatch 유틸:

```typescript
export function useTerminalIntentDispatch() {
  const dispatch = useIntentDispatch();
  const session = useAtomValue(activeTerminalSessionAtom);

  return useMemo(() => ({
    openFile: (link: FileLinkEvent) => dispatch({
      type: "open-file",
      source: { surface: "terminal", sessionId: session?.sessionId ?? "" },
      payload: {
        file: link.file,
        line: link.line,
        column: link.column,
        revealMode: "focus",
      },
      timestamp: Date.now(),
    }),

    openDiagnostic: (diag: DiagnosticEvent) => dispatch({
      type: "open-file",
      source: { surface: "terminal", sessionId: session?.sessionId ?? "" },
      payload: {
        file: diag.file,
        line: diag.line,
        column: diag.column,
        revealMode: "focus",
        inlineHint: {
          severity: diag.severity,
          message: diag.message,
        },
      },
      timestamp: Date.now(),
    }),

    askAgent: (command: TerminalCommand, intent: "explain" | "fix" | "debug") =>
      dispatch({
        type: "ask-agent",
        source: { surface: "terminal", sessionId: session?.sessionId ?? "" },
        payload: buildBlockAttachment(command, intent),
        timestamp: Date.now(),
      }),

    // ... other intents
  }), [dispatch, session]);
}
```

---

## 6. Wiring: OverlayRoot → IntentRouter

### 6.1 현재 (끊어진 연결)

```
ParsedDecorations → onFileLinkClick → ??? (아무것도 안 함)
```

### 6.2 목표 (연결 완료)

```
ParsedDecorations
  → onFileLinkClick
  → useTerminalIntentDispatch().openFile(link)
  → IntentRouter.handleOpenFile()
  → EditorSurface.openFile(resolved, line, col)
```

### 6.3 OverlayRoot에서의 바인딩

```typescript
// OverlayRoot.tsx
function OverlayRoot() {
  const intents = useTerminalIntentDispatch();

  return (
    <div className="overlay-root">
      {commands.map((cmd) => (
        <CommandBlock
          key={cmd.commandId}
          command={cmd}
          parsedEvents={eventsForCommand(cmd.commandId)}
          onRerun={handleRerun}
          onOpenFile={intents.openFile}
          onOpenProblems={(cmd, diags) => intents.openProblems(cmd, diags)}
          onAskAgent={(cmd, intent) => intents.askAgent(cmd, intent)}
          onExplain={(cmd) => intents.explainError(cmd)}
        />
      ))}
    </div>
  );
}
```

---

## 7. 구현 순서

| 순서 | 작업 | 의존성 | Scope |
|------|------|--------|-------|
| 1 | `SurfaceIntent` type + `useTerminalIntentDispatch` hook | 기존 IntentRouter | V1 |
| 2 | `open-file` handler (경로 해석 + EditorSurface 열기) | 1 | V1 |
| 3 | OverlayRoot → FileLinkChip/DiagnosticChip 바인딩 | 1, 2 | V1 |
| 4 | `BlockActions` 컴포넌트 (Rerun, Copy, Problems, Ask Agent) | CommandBlock | V1 |
| 5 | `ask-agent` handler (Agent panel 활성화 + attachment 주입) | 1, Agent panel | V1 |
| 6 | `reveal-terminal` handler (Agent → Terminal 역방향) | 1 | V1 |
| 7 | `open-problems` handler + Problems panel 필터링 | 1 | V1.5 |
| 8 | `copy-to-editor` handler (scratchpad) | 1 | V1.5 |
| 9 | VSCode extension `open-file` adapter | 2 | V1 (if VSCode) |

---

## 관련 문서

- [004-warp-level-ux.md](./004-warp-level-ux.md) — Block action UX 스펙
- [015-semantic-output-parser-pipeline.md](./015-semantic-output-parser-pipeline.md) — Parsed event 생성
- [016-ai-terminal-intelligence.md](./016-ai-terminal-intelligence.md) — AI 기능 (Explain, Ask Agent)
- [003-agent-terminal-bridge.md](./003-agent-terminal-bridge.md) — Agent → Terminal 실행
