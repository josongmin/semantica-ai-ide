# RFC-TERMINAL-004: Warp-Level AI-native Terminal UX Surface

| Field | Value |
|-------|-------|
| ID | RFC-TERMINAL-004-WARP-LEVEL-UX |
| Status | Draft |
| Date | 2026-03-09 |
| Owner | Semantica DevOS |
| Audience | IDE Team, Design Team, Agent Team |
| Parent | RFC-TERMINAL-000 Overview |
| Depends On | RFC-TERMINAL-001 Architecture, RFC-TERMINAL-003 Agent Bridge |
| Scope | Block UX, editor-like input, command search, workflow, smart completion, scroll policy, block actions, classic/hybrid mode, shareable blocks |
| Non-Goals | PTY runtime 구현, Tauri IPC 상세, agent bridge protocol (→ 001, 003 참조) |

---

## 1. 기준선

기준선은 **Warp**다.

Warp의 핵심 차별점:
- Blocks — command/output을 clean, navigable block 단위로 관리
- IDE-style input editor — multi-line, syntax highlight, completions
- Command search — history + workflows + env + agent history 통합 검색
- Workflows — parameterized, searchable, shared command templates
- Smart completions — 400+ CLI completions, workspace-aware
- Block actions — rerun, copy, share, export per block

Semantica DevOS terminal은 여기에 **agent provenance + semantic parsing + IDE federation**을 더한다.

즉:

```
Warp = Blocks + Editor Input + Search + Workflows + Completions
DevOS = Warp + Agent Provenance + Semantic Parser + IDE Surface Federation
```

---

## 2. Block-first UX

### 2.1 Block = Command + Output 단위

모든 terminal 상호작용은 **Block** 단위로 표현된다.
Block은 하나의 command 실행과 그 output을 캡슐화한 시각적/논리적 단위다.

```
┌─ Block ──────────────────────────────────────────────┐
│ [header]  $ pnpm lint              ✗ exit 1  3.2s   │
│ ─────────────────────────────────────────────────────│
│ [output]                                              │
│   src/foo.ts:42:13 - error TS2322                    │
│   src/bar.ts:18:5 - error TS2345                     │
│   Found 2 errors in 2 files.                         │
│ ─────────────────────────────────────────────────────│
│ [summary]  2 errors · 0 warnings                     │
│ [actions]  ↻ Rerun  ⎘ Copy  ↗ Open in Editor        │
└──────────────────────────────────────────────────────┘
```

### 2.2 Block Header

| 요소 | 설명 |
|------|------|
| Command text | `$ pnpm lint` — 볼드 키워드 |
| Source badge | `[You]` / `[Agent]` / `[Task]` |
| Status | `●` running / `✓` success / `✗` failed / `⊘` cancelled |
| Exit code | `exit 0` (green) / `exit 1` (red) — 완료 시만 |
| Duration | `3.2s` — 완료 시 |
| cwd badge | 현재 cwd가 workspace root와 다르면 표시 |
| Timestamp | hover 시 시작 시각 |

Agent command인 경우 추가:

| 요소 | 설명 |
|------|------|
| Agent badge | `[Agent]` 또는 로봇 아이콘 |
| Reason | hover: "verify fix after editing foo.ts" |
| Step | hover: "fix-validation-3" |

### 2.3 Block Output

- ANSI 색상 유지
- 긴 출력은 기본 접힘 (마지막 N줄만 표시)
- 펼침 시 전체 출력 (가상 스크롤)
- file:line 클릭 → 에디터 열기
- URL 클릭 → 브라우저

### 2.4 Block Summary Footer

Semantic parser가 output을 분석하여 자동 요약:

```
3 errors · 2 warnings                          ← build/lint
1 failed · 12 passed · 3 skipped               ← test
localhost:3000 detected · HMR ready             ← dev server
Installed 42 packages in 8.3s                   ← install
```

이 요약은 block 하단에 작은 텍스트로 표시.
raw output 스크롤 안 해도 결과를 즉시 알 수 있게.

### 2.5 Block Actions

Block hover 또는 우클릭 시:

| Action | 단축키 | 설명 |
|--------|--------|------|
| **Rerun** | `Ctrl+R` (block focused) | 같은 command 재실행 |
| **Copy command** | | command text 클립보드 |
| **Copy output** | | output text 클립보드 |
| **Copy block** | | command + output markdown 형식 |
| **Reveal in editor** | | output에서 감지된 파일 열기 |
| **Export / Share** | | block snapshot (markdown / JSON) |
| **Create workflow** | | 이 command를 workflow template로 저장 |
| **Explain (AI)** | | agent에게 이 출력 설명 요청 |
| **Attach to thread** | | agent 대화에 이 block 첨부 |

Agent block 추가 액션:

| Action | 설명 |
|--------|------|
| **Rerun as user** | agent command를 user terminal에서 실행 |
| **Why ran this?** | provenance tooltip — 어떤 plan step에서 나왔는지 |

### 2.6 Block Navigation

| 단축키 | 동작 |
|--------|------|
| `Cmd+↑` / `Cmd+↓` | 이전/다음 block으로 이동 |
| `Cmd+Shift+↑` | 이전 failed block으로 이동 |
| `Cmd+Shift+↓` | 다음 failed block으로 이동 |
| `Cmd+End` | 최신 block (tail) |
| `Cmd+Home` | 첫 block |

**Block Outline (mini navigator):**

```
┌─ Block Outline ──────┐
│ ✓ pnpm install   2s  │
│ ✗ pnpm lint      3s  │  ← 클릭 시 해당 block으로 점프
│ ● pnpm test      …   │
└───────────────────────┘
```

Toolbar 또는 sidebar에서 접근 가능.

---

## 3. Editor-like Input

### 3.1 핵심 원칙

Terminal 입력은 **xterm raw prompt가 아니라 editor surface**로 처리한다.

```
입력 = Editor Surface + PTY transport
```

즉, 사용자가 입력하는 영역은 CodeMirror/Monaco 급 editor이고,
Enter 시 PTY에 text를 write하는 구조.

### 3.2 Input Editor 기능

| 기능 | 설명 |
|------|------|
| Multi-line editing | `Shift+Enter`로 줄바꿈, `Enter`로 실행 |
| Shell syntax highlight | bash/zsh/fish 문법 하이라이트 |
| Quote/bracket pair | 짝 맞추기 |
| Inline parse error | 잘못된 구문 밑줄 |
| History navigation | `↑`/`↓`로 이전 명령 탐색 |
| History search while typing | 타이핑 중 매칭되는 이전 명령 ghost 텍스트 |
| Completion popup | Tab/자동 완성 |
| Command template insert | workflow에서 삽입 |
| Cursor movement | word jump, line jump, selection |
| Copy/paste | 일반 에디터처럼 |

### 3.3 Input 영역 레이아웃

```
┌─ Terminal Input ─────────────────────────────────────┐
│ ~/project (main) $                                    │
│ pnpm test --filter=@semantica/core -- --watch        │
│                                                       │
│           [↑ history]  [Tab complete]  [Enter send]  │
└──────────────────────────────────────────────────────┘
```

| 요소 | 설명 |
|------|------|
| cwd prompt | `~/project` — 현재 디렉토리 |
| git branch | `(main)` — 현재 branch |
| `$` | shell indicator |
| Input area | multi-line editor |
| Hints | 하단에 키 힌트 (옵션) |

### 3.4 구현 전략

| Phase | 전략 |
|-------|------|
| Phase 1 | xterm.js 기본 입력 (classic mode) |
| Phase 2 | 분리된 input editor (textarea + syntax highlight) |
| Phase 3 | CodeMirror extension으로 shell 문법 지원 |

Phase 2부터 입력과 PTY를 분리:
- 사용자 입력 → input editor (React)
- Enter → `terminal.writeInput(sessionId, text + "\n")`
- PTY output → xterm.js viewport (read-only)

---

## 4. Command Search

### 4.1 통합 검색 대상

`Cmd+K` (terminal focused) 로 열리는 command search:

| 소스 | 설명 |
|------|------|
| **Recent commands** | 이 세션 + 이전 세션 명령 히스토리 |
| **Saved commands** | 즐겨찾기한 명령 |
| **Project-local commands** | `package.json` scripts, `Makefile` targets |
| **Agent-ran commands** | agent가 실행한 명령 (provenance 포함) |
| **Failed commands** | 최근 실패한 명령 (재시도 용도) |
| **Workflows** | parameterized command templates |

### 4.2 검색 결과 UX

```
┌─ Command Search (Cmd+K) ──────────────────────────────┐
│ 🔍 pnpm                                                │
│ ───────────────────────────────────────────────────────│
│ pnpm lint                        2m ago    ✗ failed    │
│ pnpm test -- --watch             8m ago    ✓ success   │
│ pnpm dev                         workspace preset      │
│ pnpm build                       12m ago   ✓ success   │
│ ───────────────────────────────────────────────────────│
│ [Agent] pnpm lint                14m ago   ✗ failed    │
│ [Agent] pnpm test -- foo.test    14m ago   ✓ success   │
│ ───────────────────────────────────────────────────────│
│ Workflows                                               │
│ 📋 Run target test    pytest {{target}} -k {{pattern}} │
└────────────────────────────────────────────────────────┘
```

| 표시 | 설명 |
|------|------|
| Command text | 하이라이트된 매칭 텍스트 |
| Time ago | 마지막 실행 시점 |
| Status | 마지막 실행 결과 |
| Source badge | `[Agent]` 등 |
| Section | Recent / Agent / Workflows 구분 |

### 4.3 검색 액션

| 키 | 동작 |
|----|------|
| `Enter` | 선택한 명령 즉시 실행 |
| `Tab` | 선택한 명령을 input editor에 삽입 (수정 후 실행) |
| `Cmd+Enter` | 새 세션에서 실행 |
| `→` | workflow인 경우 인자 입력 모드 |

### 4.4 데이터 모델

```typescript
interface CommandSearchEntry {
  id: string;
  command: string;
  source: "user" | "agent" | "workflow" | "project-script";
  lastRunAt?: number;
  lastExitCode?: number;
  runCount: number;
  tags?: string[];
  /** workflow인 경우 */
  workflow?: WorkflowDefinition;
  /** agent인 경우 */
  provenance?: CommandProvenance;
}
```

---

## 5. Workflows (Parameterized Commands)

### 5.1 정의

Workflow = 이름 + 설명 + 인자를 가진 **parameterized command template**.
검색 가능하고, palette에서 바로 실행 가능.

### 5.2 모델

```typescript
interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  command: string;           // "pytest {{target}} -k {{pattern}}"
  args: WorkflowArg[];
  tags?: string[];
  scope: "user" | "project" | "team";
  createdBy?: "user" | "agent";
}

interface WorkflowArg {
  name: string;              // "target"
  description?: string;
  default?: string;
  required?: boolean;
  /** 자동완성 소스 */
  completionSource?: "files" | "packages" | "test-names" | "branches" | "custom";
}
```

### 5.3 예시

```yaml
# .semantica/workflows/run-target-test.yml
name: Run target test
command: pytest {{target}} -k {{pattern}}
args:
  - name: target
    description: Test file path
    completionSource: files
    default: tests/
  - name: pattern
    description: Test name pattern
    required: false
tags: [test, python]
scope: project
```

### 5.4 실행 UX

Command search에서 workflow 선택 시:

```
┌─ Run target test ──────────────────────────────────────┐
│ pytest {{target}} -k {{pattern}}                        │
│ ───────────────────────────────────────────────────────│
│ target: [tests/test_fluent_query.py    ]  ← autocomplete│
│ pattern: [query_rewrite                 ]               │
│                                                         │
│                              [Cancel]  [Run]            │
└─────────────────────────────────────────────────────────┘
```

### 5.5 Agent와 Workflow

Agent도 workflow를 사용할 수 있다:

```typescript
// Agent runtime
await bridge.execute({
  ...
  command: resolveWorkflow("run-target-test", {
    target: "tests/test_fluent_query.py",
    pattern: "query_rewrite",
  }),
});
```

Block actions에서 **"Create workflow from command"** → 실행된 명령에서 인자를 추출하여 workflow template 자동 생성.

---

## 6. Smart Completions

### 6.1 3계층 구조

| 계층 | 소스 | 예시 |
|------|------|------|
| **Shell-native** | shell builtin completion | `git ch` → `checkout`, `cherry-pick` |
| **App-level semantic** | 400+ CLI spec 기반 | `pnpm test --` → `--filter`, `--watch` |
| **Workspace-aware** | 프로젝트 컨텍스트 | `pnpm test --filter=` → `@semantica/core`, `@semantica/protocol` |

### 6.2 Workspace-aware 예시

```
pnpm test --filter=
  ├ @semantica/core
  ├ @semantica/protocol
  ├ @semantica/kernel
  └ @semantica/agent-runtime

git checkout
  ├ main
  ├ feat/terminal-ux          (recent)
  ├ fix/parser-regression     (recent)
  └ origin/develop

pytest tests/
  ├ test_fluent_query.py      (last failed)
  ├ test_rewrite.py
  └ test_planner.py
```

### 6.3 AI Completion (선택적)

Agent가 컨텍스트 기반으로 명령어를 제안:

```
> pnpm                        ← 사용자 입력
  pnpm lint                   ← AI: "방금 foo.ts 수정했으니 lint 돌려보는 게 좋겠습니다"
```

Ghost text로 표시, `Tab`으로 수락.

### 6.4 Accept Behavior

| 키 | 동작 |
|----|------|
| `Tab` | 현재 suggestion 수락 |
| `→` | 한 단어만 수락 |
| `Esc` | suggestion 닫기 |
| 계속 타이핑 | suggestion 자동 갱신 |

---

## 7. Scroll & View Policy

### 7.1 Auto-follow 규칙

| 상황 | 동작 |
|------|------|
| Output streaming 중 | 자동으로 하단 따라감 |
| 사용자가 위로 스크롤 | auto-follow **해제** |
| auto-follow 해제 상태에서 새 output | "Jump to bottom ↓" 버튼 표시 |
| 새 command 시작 | auto-follow 재개 (옵션) |
| Failed block reveal | 해당 block으로 정확히 점프 |
| Running block jump | tail anchor 유지 |

### 7.2 "Jump to bottom" 버튼

auto-follow가 해제되면 viewport 하단에 floating 버튼:

```
                              ┌─────────────────┐
                              │ ↓ Jump to bottom │
                              └─────────────────┘
```

클릭 시 tail로 이동 + auto-follow 재개.

### 7.3 Block 단위 스크롤

Block navigation (`Cmd+↑`/`Cmd+↓`) 시:
- 이전/다음 block header로 스크롤
- Block header가 viewport 상단에 고정 (sticky)
- 긴 output block 안에서는 일반 스크롤

---

## 8. Terminal Modes

### 8.1 3가지 모드

| Mode | 입력 | 출력 | Block boundary |
|------|------|------|----------------|
| **Classic** | xterm raw prompt | Continuous stream | 없음 (기존 terminal 느낌) |
| **Hybrid** (기본) | Editor-like input | Block 단위 | 얇은 구분선만 |
| **Semantic** | Editor-like input | Block 단위 + summary | 명확한 시각적 구분 |

### 8.2 Semantic Mode

```
┌─ Block ─────────────────────────────────┐
│ $ pnpm lint                  ✗ 3.2s     │
│ ────────────────────────────────────────│
│   src/foo.ts:42:13 - error TS2322      │
│   Found 2 errors.                       │
│ ────────────────────────────────────────│
│ 2 errors                    ↻ ⎘ ↗      │
└──────────────────────────────────────────┘

┌─ Input ─────────────────────────────────┐
│ ~/project (main) $ █                     │
└──────────────────────────────────────────┘
```

### 8.3 Classic Mode

```
$ pnpm lint
src/foo.ts:42:13 - error TS2322: Type 'string' is not assignable to type 'number'.
src/bar.ts:18:5 - error TS2345: Argument of type 'null' is not assignable.

Found 2 errors in 2 files.

$ █
```

Classic mode에서도 command tracking은 내부적으로 동작 (shell marker 기반).
표시만 안 할 뿐.

### 8.4 Hybrid Mode

```
── $ pnpm lint ── ✗ 3.2s ──────────────────
src/foo.ts:42:13 - error TS2322: Type 'string' is not assignable to type 'number'.
src/bar.ts:18:5 - error TS2345: Argument of type 'null' is not assignable.

Found 2 errors in 2 files.

┌─ Input ─────────────────────────────────┐
│ ~/project (main) $ █                     │
└──────────────────────────────────────────┘
```

### 8.5 모드 전환

- Settings에서 기본 모드 설정
- `Cmd+Shift+M` (terminal focused)로 모드 전환
- 세션별로 다른 모드 가능

---

## 9. Failed Command = Object

### 9.1 원칙

실패한 command를 "로그"가 아니라 **"객체"**처럼 다룬다.

### 9.2 Failed Block 표시

```
┌─ Block (FAILED) ─────────────────────────────────────┐
│ $ pnpm lint                  ✗ exit 1   3.2s         │
│ ─────────────────────────────────────────────────────│
│   src/foo.ts:42:13 - error TS2322                    │
│   src/bar.ts:18:5 - error TS2345                     │
│ ─────────────────────────────────────────────────────│
│ 2 errors · 0 warnings                                │
│                                                       │
│ [↻ Rerun] [📂 Open Problems] [⎘ Copy] [🤖 Ask Agent]│
└──────────────────────────────────────────────────────┘
```

| 속성 | 즉시 표시 |
|------|-----------|
| Status | `✗ failed` (red) |
| Exit code | `exit 1` |
| Duration | `3.2s` |
| Diagnostics count | `2 errors · 0 warnings` |
| Actions | Rerun / Open Problems / Copy / Ask Agent |

### 9.3 Failed Block → IDE 연동

| 액션 | 동작 |
|------|------|
| Open Problems | Problems panel 열기 + 이 block의 diagnostics 필터 |
| Click file:line | 에디터에서 해당 위치 열기 |
| Ask Agent | Agent panel에 이 block 첨부 + "이거 고쳐줘" |

---

## 10. Shareable / Exportable Blocks

### 10.1 기능

| 기능 | 형식 | 설명 |
|------|------|------|
| Copy as markdown | `.md` | command + output + summary |
| Copy as JSON | `.json` | 구조화된 block 데이터 |
| Export snapshot | `.html` | ANSI 색상 보존된 standalone HTML |
| Attach to RFC | link | RFC 문서에 block 참조 삽입 |
| Attach to agent thread | embed | agent 대화에 block 첨부 |

### 10.2 Markdown 출력 예시

````markdown
```terminal
$ pnpm lint
src/foo.ts:42:13 - error TS2322: Type 'string' is not assignable to type 'number'.
src/bar.ts:18:5 - error TS2345: Argument of type 'null' is not assignable.

Found 2 errors in 2 files.
```
**Status:** Failed (exit 1) · 3.2s · 2 errors
````

---

## 11. 상태 모델

### 11.1 Block Store

```typescript
interface TerminalBlock {
  id: string;
  sessionId: string;
  commandId: string;

  /** Header */
  command: string;
  source: "user" | "agent" | "task";
  status: "running" | "succeeded" | "failed" | "cancelled";
  exitCode?: number;
  startedAt: number;
  endedAt?: number;
  cwd: string;

  /** Output */
  outputLineCount: number;
  collapsed: boolean;        // output 접힘 여부
  expanded: boolean;         // 더 보기 펼침 여부

  /** Summary (parser 결과) */
  summary?: BlockSummary;

  /** Provenance (agent 명령인 경우) */
  provenance?: CommandProvenance;
}

interface BlockSummary {
  errors: number;
  warnings: number;
  testsPassed?: number;
  testsFailed?: number;
  testsSkipped?: number;
  portBindings?: number[];
  taskKind?: string;
  customText?: string;       // parser가 생성한 한 줄 요약
}
```

### 11.2 Input Editor State

```typescript
interface TerminalInputState {
  sessionId: string;
  text: string;
  cursorPosition: number;
  historyIndex: number;      // -1 = 현재 입력, 0+ = history
  completionVisible: boolean;
  completionItems: CompletionItem[];
  selectedCompletion: number;
  ghostText?: string;        // AI suggestion
}
```

### 11.3 Search State

```typescript
interface CommandSearchState {
  visible: boolean;
  query: string;
  results: CommandSearchEntry[];
  selectedIndex: number;
  activeSection: "recent" | "agent" | "workflows" | "project";
}
```

### 11.4 Terminal Mode

```typescript
type TerminalMode = "classic" | "hybrid" | "semantic";

export const terminalModeAtom = atomWithStorage<TerminalMode>(
  "terminal-mode",
  "hybrid",
);
```

---

## 12. 컴포넌트 구조

```
src/features/terminal-bridge/
  ui/
    TerminalSurface.tsx              # 최상위 terminal surface
    │
    ├── TerminalBlockList.tsx        # block 목록 (가상 스크롤)
    │   ├── TerminalBlock.tsx        # 개별 block
    │   │   ├── BlockHeader.tsx      # command + status + badges
    │   │   ├── BlockOutput.tsx      # xterm.js viewport (per block)
    │   │   ├── BlockSummary.tsx     # parser 결과 요약
    │   │   └── BlockActions.tsx     # rerun, copy, share, etc.
    │   └── BlockOutline.tsx         # mini navigator
    │
    ├── TerminalInputEditor.tsx      # editor-like input
    │   ├── ShellSyntaxHighlight.ts  # CodeMirror extension
    │   ├── InputCompletionPopup.tsx # completion dropdown
    │   └── InputGhostText.tsx       # AI suggestion ghost
    │
    ├── CommandSearchOverlay.tsx     # Cmd+K search
    │   ├── SearchResultList.tsx
    │   └── WorkflowArgForm.tsx      # workflow 인자 입력
    │
    └── TerminalToolbar.tsx          # mode switch, filter, search trigger

  model/
    terminalBlockAtoms.ts            # block store
    terminalInputAtoms.ts            # input editor state
    terminalSearchAtoms.ts           # command search state
    terminalCompletionAtoms.ts       # completion state
    terminalWorkflowAtoms.ts         # workflow store
    terminalModeAtom.ts              # mode preference
```

---

## 13. 렌더링 전략 (Block Mode)

### 13.1 Semantic Mode 렌더링

Classic mode는 xterm.js 하나로 전체 PTY stream을 렌더한다.
Semantic mode는 **Block 단위로 분리 렌더**한다.

```
┌─ TerminalBlockList (React, virtual scroll) ──────────┐
│                                                       │
│  ┌─ Block 1 ──────────────────────────────────────┐  │
│  │ [BlockHeader]                                   │  │
│  │ [BlockOutput] ← mini xterm.js or pre+ANSI CSS  │  │
│  │ [BlockSummary]                                  │  │
│  │ [BlockActions]                                  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  ┌─ Block 2 ──────────────────────────────────────┐  │
│  │ ...                                             │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
├───────────────────────────────────────────────────────┤
│ [TerminalInputEditor]                                 │
└───────────────────────────────────────────────────────┘
```

**Block output 렌더 옵션:**

| 방안 | 장점 | 단점 |
|------|------|------|
| **Pre + ANSI→CSS** | 가볍다, block별 독립 | interactive 불가 |
| **Mini xterm.js per block** | 완벽한 ANSI | 메모리 무거움 |
| **Shared xterm.js + block overlay** | Phase 1에서 쉬움 | block 분리 복잡 |

**추천:** Phase 1은 shared xterm.js + block overlay, Phase 2에서 pre + ANSI→CSS로 전환.

### 13.2 Classic Mode 렌더링

단일 xterm.js instance — 기존 terminal과 동일.
내부적으로 command tracking은 동작하지만 UI에 block 구분 없음.

---

## 14. 구현 우선순위

### P0 — Block UX 핵심 (= V1 Scope)

- Block header / status / exit code / duration
- Block output (접기/펼치기)
- Block actions: rerun, copy command, copy output
- Block navigation: `Cmd+↑`/`Cmd+↓`
- Failed/running block jump
- Smart scroll rules (auto-follow + jump to bottom)
- Command navigator (block outline)
- Command search (`Cmd+K`) — recent + failed

> **Note:** Modern input editor는 011-scope-lock에 따라 V2 scope. P0에서는 xterm raw input + history suggest overlay (hybrid mode).

### P1 — 체감 상승 (= V1.5 Scope)

- Block summary footer (errors/warnings/test results)
- Shell syntax highlight (input editor)
- Workflow: parameterized command template
- Smart completion (shell-native + workspace-aware)
- Copy block as markdown
- Share / export block

### P2 — AI-native 차별점

- Agent-aware search (agent-ran commands)
- AI completion (ghost text suggestion)
- "Create workflow from command" (block → template)
- "Ask Agent" (failed block → agent thread 첨부)
- "Explain" (block output AI 설명)
- Project-local command packs (`package.json` scripts)
- Shared team workflow registry

---

## 15. Warp 대비 체크리스트

| 항목 | Warp | DevOS 상태 | 우선순위 |
|------|------|-----------|----------|
| Command/output block model | ✅ | 설계 완료 (command tracking) | P0 |
| Editor-like input | ✅ | 미구현 | P0 |
| Command search | ✅ | 미구현 | P0 |
| Parameterized workflow | ✅ | 미구현 | P1 |
| Smart completion | ✅ | 미구현 | P1 |
| Block actions | ✅ | 미구현 | P0 |
| Block navigation | ✅ | 미구현 | P0 |
| Classic mode | ✅ | xterm.js 기반 있음 | P1 |
| Shareable block | ✅ | 미구현 | P1 |
| **Agent provenance** | ⚠️ (제한적) | **설계 완료** | P0 |
| **Semantic parser** | ❌ | **설계 완료** | P1 |
| **IDE surface federation** | ❌ | **설계 완료** | P1 |
| **Agent command card (inline)** | ❌ | **설계 완료** | P0 |
| **Agent → terminal exec bridge** | ❌ | **설계 완료** | P0 |

> DevOS가 Warp보다 **확실히 우위**인 축: agent provenance, semantic parsing, IDE federation, agent exec bridge.

---

## 관련 문서

- [000-overview.md](./000-overview.md) — 제품 정의 & 전체 기능 스펙
- [001-architecture.md](./001-architecture.md) — Tauri 구현 아키텍처 (PTY, parser, IPC)
- [002-agent-integration.md](./002-agent-integration.md) — Agent ↔ Terminal 통합 개요
- [003-agent-terminal-bridge.md](./003-agent-terminal-bridge.md) — Agent Bridge + Command Card + Activity Bar
