# RFC: Semantica AI-Native IDE Panel Architecture

> 2026-03-07 | Status: Draft
> Based on competitive analysis of Cursor 2.0+, Google Antigravity, Kiro (AWS), Devin 2.0, Claude Code

### Sub-RFCs

| RFC | 주제 | 설명 |
|-----|------|------|
| [RFC-001](rfc/RFC-001-FIVE-SURFACE-ARCHITECTURE.md) | 5-Surface Architecture | Dual Surface → 5 Logical Surface 확장 모델 |
| [RFC-002](rfc/RFC-002-SYSTEM-ARCHITECTURE.md) | System Architecture | 7-Layer 내부 시스템 아키텍처 |
| [RFC-003](rfc/RFC-003-UX-FLOW.md) | UX Flow & Patterns | 사용자 여정, Intent-First Flow, UX 원칙 |
| [RFC-004](rfc/RFC-004-TECH-STACK.md) | Tech Stack 30 | 기술 스택 전체 (Tauri/React/Monaco/Jotai/...) |
| [RFC-005](rfc/RFC-005-UI-COMPONENTS.md) | UI Components 30 | 필수 컴포넌트 30개, 우선순위, Surface 배치 |
| [RFC-006](rfc/RFC-006-CORE-TECHNOLOGIES.md) | Core Technologies | 숨은 핵심 기술 10개, Semantica 차별화 4개 |
| [RFC-007](rfc/RFC-007-TEMPORAL-REPLAY.md) | Temporal & Replay | 타임라인, 리플레이, 체크포인트, 감사 추적 |
| [RFC-008](rfc/RFC-008-REVIEW-EVIDENCE.md) | Review & Evidence | Proof-Carrying Review, Auto-Review Engine |
| [RFC-009](rfc/RFC-009-UI-SHELL-CONTRACT.md) | UI Shell & Plugin Contract | Shell 고정 구조, Contribution Model, Extension Manifest, Capability Gate |
| [RFC-010](rfc/RFC-010-STATE-ARCHITECTURE.md) | State Architecture | 5-Layer 상태 분리 (Layout/Workspace/View/Domain/Ephemeral) |

---

## 1. 2026 Industry Landscape (Objective Analysis)

### 1.1 Major Players & Their UI Paradigm

| Product | UI Paradigm | Core Layout | Key Innovation |
|---------|------------|-------------|----------------|
| **Cursor 2.0+** | Agent-centered editor | VSCode fork + Agent sidebar + 8 parallel agents | Automations (event-driven agents), BugBot |
| **Google Antigravity** | Dual surface | Editor View + Manager Surface (separate) | "Surface embedded in agent" philosophy |
| **Kiro (AWS)** | Spec-driven editor | VSCode fork + Spec panel | Requirements -> Design -> Tasks -> Code |
| **Devin 2.0** | Autonomous agent | Chat + embedded Editor/Terminal/Browser | Full replay timeline, Slack-like dispatch |
| **Claude Code** | Terminal-first | No UI (terminal only) | 1M token context, max flexibility |
| **Zed** | Performance editor | Native engine + Assistant panel | 120fps, multiplayer, CRDT |
| **Windsurf** | Cascade flow | VSCode fork + Cascade panel | Agentic flow, full codebase awareness |

### 1.2 Convergence Pattern

2026년 기준, 업계가 수렴하는 공통 패턴:

1. **Code Editor는 여전히 화면의 중심** — 모든 제품이 에디터를 유지
2. **Agent Panel이 2급에서 1급으로 승격** — Cursor 2.0이 "agent-centered layout" 도입
3. **Multi-Agent Parallel이 table stakes** — Cursor 8개, Antigravity N개 동시 실행
4. **Dual Surface 패턴 등장** — Antigravity가 Editor/Manager를 분리한 최초 사례
5. **Event-Driven Automation** — Cursor Automations (Slack/PR/Timer 트리거)
6. **Spec-First Workflow** — Kiro의 EARS notation 기반 스펙 생성

### 1.3 Data Points

- JetBrains 2025 Survey: 85% 개발자가 AI 도구 사용, Cursor 사용자 2024 135명 -> 2025 2,300명+ (17x growth)
- 개발자 시간: 읽기/네비게이션 60%, 편집 5% (ICSE 2015, Minelli et al.)
- AI 시대 변화: 19%가 주 8시간+ 절약 (2024년 9% 대비 2배 증가)
- Cursor BugBot: 76% bug resolution rate, 35% autofix PR merge rate

---

## 2. Semantica의 포지셔닝

### 2.1 기존 경쟁자와의 Gap

```
Cursor/Windsurf: VSCode fork -> 확장성 한계, Electron 무거움
Antigravity:     Google 종속 (Gemini 3), 2M context but 느림
Kiro:            AWS 종속, spec-driven이지만 자율성 낮음
Devin:           클라우드 전용, 로컬 개발 불가, 비쌈
Claude Code:     UI 없음, 시각적 피드백 제로
Zed:             AI 통합 얕음, 에디터 성능에 올인
```

### 2.2 Semantica 차별화 방향

**"Agent-Native + Code-Visible"** — 에이전트가 1급이되, 코드 가시성을 절대 희생하지 않는 구조.

핵심 원칙:
1. **코드가 항상 보인다** — AI가 생성한 코드를 반드시 읽어야 하므로, 에디터 면적 50%+ 보장
2. **에이전트는 조율자** — 파일/터미널/브라우저는 에이전트의 작업 표면
3. **5 Logical Surface** — Editor/Manager 2-mode로 보이되, 내부는 Intent/Code/Agent/Runtime/Temporal 5개 surface ([RFC-001](rfc/RFC-001-FIVE-SURFACE-ARCHITECTURE.md))
4. **Tauri Native** — Electron(Cursor/Windsurf) 대비 메모리 50~70% 절감
5. **Model Agnostic** — 특정 AI vendor 종속 없음 (Cursor=OpenAI, Antigravity=Gemini, Kiro=Bedrock)
6. **Evidence-Based Review** — diff만 보여주는 게 아닌, 정적 엔진 기반 proof-carrying review ([RFC-008](rfc/RFC-008-REVIEW-EVIDENCE.md))
7. **Temporal Native** — 모든 행동을 시간축에 기록, 리플레이/리와인드 가능 ([RFC-007](rfc/RFC-007-TEMPORAL-REPLAY.md))

**최종 포지션**: Semantica = AI-native Development OS for large codebases

| 경쟁사 대비 | Semantica 우위 |
|------------|--------------|
| Cursor | 더 깊은 코드 이해 (7언어 통합 정적 엔진) |
| Devin | 더 강한 로컬 개발감 (Tauri native) |
| Kiro | 더 강한 실행/리뷰 (evidence-based) |
| Zed | 더 강한 agent orchestration |
| Antigravity | Model agnostic (Google 종속 없음) |

상세: [RFC-006](rfc/RFC-006-CORE-TECHNOLOGIES.md)

---

## 3. Panel Architecture Design

### 3.1 Top-Level: Dual Surface

Antigravity가 증명한 패턴을 채택하되, seamless 전환을 추가.

```
Surface 1: EDITOR MODE (코드 작업)
+-------+---------------------------+----------+
| Left  |     Center (Editor)       |  Right   |
| Dock  |     Code / Diff / Preview |  Dock    |
|       |                           |          |
| File  |  +-----+-----+           | AI Chat  |
| Tree  |  | Tab | Tab |           | Context  |
| Git   |  +-----+-----+           | Plan     |
| Sym   |  |             |         |          |
|       |  |  Monaco /   |         |          |
|       |  |  CodeMirror |         |          |
|       |  |             |         |          |
|       |  +-------------+         |          |
|       |  | Bottom Panel|         |          |
|       |  | Terminal/Out |         |          |
+-------+---------------------------+----------+
|            Status Bar / Feature Bar           |
+-----------------------------------------------+

Surface 2: MANAGER MODE (에이전트 오케스트레이션)
+-----------------------------------------------+
|  Agent Orchestration Dashboard                |
|                                               |
|  +--Agent 1--+ +--Agent 2--+ +--Agent 3--+   |
|  | Refactor  | | Fix tests | | Write docs|   |
|  | ████░░ 60%| | ████████ ✓| | ██░░░░ 25%|   |
|  | 3 files   | | 1 file    | | 2 files   |   |
|  | [View]    | | [Merge]   | | [View]    |   |
|  +-----------+ +-----------+ +-----------+   |
|                                               |
|  +--- Activity Timeline --------------------+ |
|  | 14:01 Agent-1 read auth.ts               | |
|  | 14:02 Agent-1 edit auth.ts (+15/-3)      | |
|  | 14:03 Agent-2 run: npm test (PASS)       | |
|  | 14:03 Agent-3 read README.md             | |
|  +------------------------------------------+ |
|                                               |
|  +--- Pending Approvals --------------------+ |
|  | ⚠ Agent-1: DB migration  [Approve][Deny] | |
|  +------------------------------------------+ |
+-----------------------------------------------+
```

전환: `Cmd+Shift+M` (Manager) / `Cmd+Shift+E` (Editor) — instant swap, 상태 유지.

### 3.2 Editor Mode Detail

```
비율 (기본값, 모두 리사이즈 가능):
- Left Dock:    220px (min 180, max 400, collapsible)
- Center:       flex-1 (최소 50% 보장)
- Right Dock:   340px (min 280, max 500, collapsible)
- Bottom Panel: 200px (min 100, max 50%, collapsible)
```

**Left Dock Tabs:**
| Tab | Widget (기존) | 역할 |
|-----|--------------|------|
| Files | `file-tree` | 파일 브라우징, 트리뷰 |
| Git | `git-history-panel` | Branch, commit history, graph |
| Search | `semantic-search-panel` | Semantic + text search |
| Symbols | `symbol-panel` | 코드 심볼, 아키텍처 뷰 |
| Workspace | `workspace-graph-panel` | 의존성 그래프 시각화 |
| Todos | `todo-board` | 프로젝트 태스크 |

**Right Dock Tabs:**
| Tab | Widget (기존) | 역할 |
|-----|--------------|------|
| Chat | `message-list` + `prompt-box` | AI 대화 (메인) |
| Plan | `plan-checklist` | 에이전트 실행 계획 |
| Review | `review-panel` + `three-way-diff` | 코드 리뷰 |
| Context | `auto-context-preview` | 자동 수집된 컨텍스트 |
| Memory | `memory-panel` | 세션/프로젝트 기억 |
| MCP | `mcp-panel` | 외부 도구 연결 |

**Center Editor Tabs (kind별):**
| Kind | Widget | 열리는 조건 |
|------|--------|-----------|
| `code` | Monaco/CodeMirror | 파일 열기 |
| `diff` | `diff-viewer` | 변경사항 클릭 |
| `three-way-diff` | `three-way-diff` | 충돌/머지 |
| `preview` | `live-preview` | 웹 프리뷰 |
| `browser` | `browser-panel` | URL 열기 |
| `terminal` | `terminal-output-viewer` | 전체화면 터미널 |
| `architecture` | `workspace-graph-panel` (확대) | 아키텍처 뷰 |

**Bottom Panel Tabs:**
| Tab | Widget | 역할 |
|-----|--------|------|
| Terminal | `terminal-output-viewer` | 통합 터미널 |
| Output | `tool-output-viewer` | 에이전트 도구 출력 |
| Problems | `validation-panel` | 린트/에러/경고 |
| Debug | 신규 | 디버그 콘솔 |

### 3.3 Manager Mode Detail

기존 위젯 매핑:

| Manager 영역 | 기존 Widget |
|-------------|------------|
| Agent Cards | `agents-panel`, `agent-team` |
| Activity Timeline | `activity-feed`, `checkpoint-timeline` |
| Approval Queue | `approval-banner`, `tool-call-group` (DangerousApprovalGate) |
| Plan Overview | `plan-checklist`, `gantt-timeline` |
| Run Comparison | `arena-view`, `debate-arena` |
| Background Jobs | `background-jobs-panel` |
| Rewind Control | `rewind-panel`, `checkpoint-comparison-panel` |

### 3.4 Adaptive Mode (자동 레이아웃 제안)

에이전트 활동량에 따라 레이아웃 제안 (강제 아님, 토스트로 제안):

```typescript
type WorkspaceMode = 'explore' | 'collaborate' | 'supervise';

// 자동 감지 로직
if (activeAgents === 0 && userEditing) -> 'explore'
  // Left Dock 넓게, Right Dock 최소, Code 최대

if (activeAgents > 0 && activeAgents <= 2) -> 'collaborate'
  // Left Dock 기본, Right Dock Chat 열림, Code 50%

if (activeAgents >= 3 || backgroundJobs > 0) -> 'supervise'
  // Manager Mode 전환 제안
```

---

## 4. Spec-Driven Workflow (Kiro 영감)

Kiro의 핵심 차별점을 Semantica에 통합:

```
Intent -> Spec -> Plan -> Execute -> Review

1. 사용자: "OAuth2 인증 추가해줘"
2. AI: Spec 생성 (EARS notation)
   - User Stories + Acceptance Criteria
   - Technical Design + Architecture Diagram
   - Task Breakdown (dependency-ordered)
3. 사용자: Spec 리뷰/수정 (Plan panel에서)
4. Agent: Task별 순차/병렬 실행
5. 사용자: Diff 리뷰 + Approve/Reject
```

기존 위젯: `plan-checklist` (Plan), `approval-banner` (Review), `scope-guard` (범위 제한)

---

## 5. Event-Driven Automation (Cursor Automations 영감)

```typescript
type Automation = {
  trigger: 'pr_opened' | 'push' | 'slack_message' | 'schedule' | 'file_changed';
  agent: AgentConfig;
  action: 'review' | 'fix' | 'test' | 'deploy' | 'custom';
};

// 예시
const bugReview: Automation = {
  trigger: 'pr_opened',
  agent: { model: 'claude-opus-4-6', rules: 'security-audit' },
  action: 'review',
};
```

Manager Mode에서 Automations 대시보드로 관리.

---

## 6. Technical Stack

### 6.1 Editor Engine

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Monaco (VSCode) | 기능 완성도, LSP 지원 | 번들 크기 큼 (5MB+), Electron 최적화 | **Primary** |
| CodeMirror 6 | 경량, 확장성, 모바일 | LSP 직접 구현 필요 | Fallback |
| Zed-style (자체) | 최고 성능 | 개발 비용 막대 | Future |

Tauri + Monaco 조합 권장. Tauri webview에서 Monaco 구동은 검증된 패턴.

### 6.2 Panel System

```typescript
// Core layout primitives
type PanelPosition = 'left' | 'right' | 'bottom' | 'center';

interface DockConfig {
  position: PanelPosition;
  tabs: DockTab[];
  width: number;        // px (left/right) or height (bottom)
  minSize: number;
  maxSize: number;
  collapsed: boolean;
}

interface WorkspaceLayout {
  surface: 'editor' | 'manager';
  mode: 'explore' | 'collaborate' | 'supervise';
  left: DockConfig;
  center: EditorTabGroup;
  right: DockConfig;
  bottom: DockConfig;
}
```

Resizable splitter: 자체 구현 (allotment은 Electron 최적화라 Tauri에선 직접 구현이 나음).

### 6.3 State Management

기존 Jotai 유지. Layout 상태도 atom으로 관리 + localStorage persistence.

```typescript
const workspaceLayoutAtom = atomWithStorage<WorkspaceLayout>('workspace-layout', defaultLayout);
const activeSurfaceAtom = atom<'editor' | 'manager'>('editor');
const activeLeftTabAtom = atom<string>('files');
const activeRightTabAtom = atom<string>('chat');
```

---

## 7. Engine Integration Architecture

> **2026-03-07 Code-Verified Update**: Semantica CodeGraph V2 엔진의 실제 코드 수준 검증 결과를 반영.
> 엔진은 "앞으로 만들 것"이 아니라 **"이미 완성된 상태이며, LSP 래핑만 추가하면 IDE 기능이 즉시 활성화되는"** 상태이다.

### 7.0 엔진 현재 상태 요약 (Code-Verified)

| 영역 | 상태 | 규모 |
|------|------|------|
| Language Intelligence (LSP 백엔드) | **20개 IDE 기능 전부 REAL 구현** | 스텁 0건 |
| Code Understanding (AI Agent 백엔드) | **13+ 분석 엔진 완비** | SOTA급 |
| Application Layer | **7개 앱, 50+ API, 18 MCP 도구** | 운영 가능 |
| Port/Adapter Architecture | **82+ Port, 103+ Adapter** | Production |
| Languages | **7개 언어** (Python, Java, JS, TS, Go, Rust, Kotlin, C) | tree-sitter 기반 |
| Analysis Pipeline | **11-Layer** (Parse → AST → HIR → CFG → DFG → SSA → CallGraph → PTA → Taint → Clone → MemSSA) | Full stack |
| Query Types | **32개** (L0-L5 + System) | FluentSDK v3 47 Builder |
| Repository | 62 crates, 1M+ LOC, Rust 72.5% + Python 25.5%, 448+ RFCs | |

### 7.1 전체 구조: 3-Tier Language Backend

Semantica IDE는 코드 분석을 **3계층**으로 처리한다. Semantica CodeGraph V2 엔진이 깊은 분석을 담당하고, 언어별 외부 LSP 서버가 타입 체킹/언어 고유 기능을 보완하며, IDE 프론트엔드는 이 둘을 통합해서 사용자에게 보여준다.

```
┌──────────────────────────────────────────────────────────────────┐
│  IDE Frontend (Tauri + Monaco)                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Editor   │  │ AI Agent │  │ Diagno-  │  │ Context Panel    │ │
│  │ (Monaco) │  │ Chat/Plan│  │ stics    │  │ (auto-context)   │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
│       │              │             │                  │           │
├───────┼──────────────┼─────────────┼──────────────────┼───────────┤
│  LSP Multiplexer / Engine Router                                 │
│  (요청 종류에 따라 Semantica Engine 또는 외부 LSP로 라우팅)          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─── Tier 1: Semantica CodeGraph V2 ──────────────────────────┐ │
│  │  62 crates, 1M+ LOC Rust, 82+ Ports, 103+ Adapters          │ │
│  │                                                              │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │ │
│  │  │ Q4 IDE      │  │ Analysis    │  │ Apps (7개)           │  │ │
│  │  │ 20 features │  │ 13+ engines │  │ API/MCP/CLI/Agent   │  │ │
│  │  │ (ALL REAL)  │  │ 32 queries  │  │ 50+ endpoints       │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘  │ │
│  │                                                              │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────────┐  │ │
│  │  │ HIR/    │  │ CFG/DFG │  │ Taint/  │  │ Clone/Import  │  │ │
│  │  │ Symbol  │  │ SSA     │  │ PTA(5)  │  │ Graph/MemSSA  │  │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └───────────────┘  │ │
│  │                                                              │ │
│  │  연결: Direct Cargo (Option A, in-process) / MCP (보조)       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─── Tier 2: External Language Servers ───────────────────────┐ │
│  │  언어별 타입 체커 + 언어 고유 기능                              │ │
│  │                                                              │ │
│  │  Python:     Pyright / Pylance                               │ │
│  │  TypeScript: tsserver (built-in)                             │ │
│  │  Java:       Eclipse JDT LS / IntelliJ LSP                  │ │
│  │  Go:         gopls                                           │ │
│  │  Rust:       rust-analyzer                                   │ │
│  │  Kotlin:     kotlin-language-server                          │ │
│  │  JavaScript: tsserver (shared with TS)                       │ │
│  │  C:          clangd                                          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─── Tier 3: AI Agent Engine ─────────────────────────────────┐ │
│  │  Agent가 Tier 1 + Tier 2 결과를 LLM context로 조합           │ │
│  │                                                              │ │
│  │  MCP Server (apps/mcp/)  → 18 AI tools → Agent context      │ │
│  │  REST API (apps/api/)    → 50+ endpoints → Batch analysis   │ │
│  │  CodeGraph Agent (apps/codegraph-agent/) → DDD, 21 ports    │ │
│  └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 7.2 Tier 1: Semantica CodeGraph V2 연동

엔진 레포: `semantica-codegraph-v2` (Rust 72.5%, Python 25.5%, 62 crates, 1M+ LOC)

#### 7.2.1 연동 방식 결정

| 방식 | 경로 | 레이턴시 | 용도 | 현재 상태 |
|------|------|---------|------|----------|
| **A. Direct Cargo (in-process)** | Tauri ↔ quanta-runtime (Cargo path dep) | **< 1ms** | **모든 IDE 기능 + 분석** | **✅ Phase 0 채택** |
| **B. LSP Server** | Q4 queries → LSP wrapper → stdio/TCP | < 50ms | 에디터 실시간 기능 (20개 전부) | 엔진 100% 완료, wrapper만 필요 |
| **C. REST API** | `apps/api/` → HTTP (FastAPI, port 8000) | < 200ms | 배치 분석, 대시보드, CI 연동 | 50+ endpoints 운영 가능 |
| **D. MCP Server** | `apps/mcp/` → MCP protocol (stdio) | < 500ms | AI Agent가 분석 결과를 context로 소비 | 18 tools 운영 가능 |

**결정: Option A — Direct Cargo Dependency (in-process 통합)**

Tauri 앱과 Semantica 엔진이 모두 Rust이므로, 별도 프로세스 없이 **Cargo path dependency로 직접 링크**하는 것이 최적.
기존 `quanta-pyo3` (Python FFI 바인딩)가 동일한 패턴으로 OrchestratorPort를 구현한 레퍼런스가 있어 검증됨.

- **IPC 오버헤드 제로**: 함수 호출 수준 (< 1ms), LSP stdio 대비 50x 빠름
- **타입 안전성**: Rust 컴파일러가 엔진-IDE 인터페이스 불일치를 컴파일 타임에 감지
- **단일 바이너리**: 별도 엔진 프로세스 관리 불필요, 배포/업데이트 단순화
- **전체 엔진 접근**: FluentSDK v3의 47개 Builder를 Tauri command에서 직접 호출
- **MCP/REST는 보조**: AI Agent용 MCP (D), CI/대시보드용 REST (C)는 별도 프로세스로 병행 가능

상세 통합 계획: Section 7.2.7 참조.

#### 7.2.2 Q4 IDE 기능: 20개 전부 REAL 구현 (스텁 0건)

Option A (Direct Cargo) 채택으로, Q4 query layer를 **Tauri command에서 직접 호출** (in-process, IPC 오버헤드 제로):

```
[Monaco Editor] ──invoke──→ [Tauri Commands (20+)] ──direct fn call──→ [Q4 Queries (20개, 이미 구현)]
```

**Code Navigation:**

| LSP Method | Engine 구현체 (실제 파일) | FluentSDK Entry | 상태 |
|------------|------------------------|-----------------|------|
| `textDocument/definition` | `q4/go_to_definition.rs` | `code.ide().goto_definition().position(l,c)` | **L4 Production** |
| `textDocument/references` | `q4/find_references.rs` | `code.ide().find_references().position(l,c)` | **L4 Production** |
| `textDocument/hover` | `q4/hover.rs` | `code.ide().hover().position(l,c)` | **L4 Production** |
| `textDocument/documentSymbol` | `q4/document_symbols.rs` | Q4 query surface | **L4 Production** |
| `workspace/symbol` | `q4/workspace_symbols.rs` | Q4 query surface | **L4 Production** |

- Go-to-Definition: Cross-file resolution + **ResolutionProofV1** (AI 설명용 증거 포함)
- Find References: EntityIdV1 기반, configurable declaration inclusion
- Workspace Symbols: exact/prefix/contains/fuzzy 4가지 매칭 전략

**Code Editing & Refactoring:**

| LSP Method | Engine 구현체 | FluentSDK Entry | 상태 |
|------------|-------------|-----------------|------|
| `textDocument/completion` | `q4/completion.rs` | `code.ide().completion().position(l,c).trigger_character('.')` | **L4 Production** |
| `textDocument/signatureHelp` | `q4/signature_help.rs` | Q4 query surface | **L4 Production** |
| `textDocument/prepareRename` | `sdk/ide.rs` (RenamePreviewBuilderV2) | `code.ide().rename_preview()` | **L4 Production** |
| `textDocument/rename` | `q4/rename_workspace_edit.rs` | `code.ide().rename_workspace_edit()` | **L4 Production** |
| `textDocument/codeAction` | `q4/code_actions.rs` | Q4 query surface | **L4 Production** |

- Completion: local scope + module scope + imported symbols + built-ins, 트리거 문자 지원
- Rename: multi-file rename, LSP WorkspaceEdit 호환 (BTreeMap deterministic)
- Code Actions: QuickFix, Refactor, RefactorExtract, RefactorInline 전부 지원

**Syntax & Diagnostics:**

| LSP Method | Engine 구현체 | 상태 |
|------------|-------------|------|
| `textDocument/semanticTokens/full` | `q4/semantic_tokens.rs` | **L4 Production** |
| `textDocument/publishDiagnostics` | `q4/lsp_diagnostics.rs` | **L4 Production** |
| `textDocument/foldingRange` | `q4/folding_ranges.rs` | **L3 Advanced** |

- Semantic Tokens: LSP 3.16+ 프로토콜, delta encoding, 20+ token types
- Diagnostics: **5개 소스 병합** — Parse (tree-sitter) + HIR + Type + Resolution + Analysis (taint, unreachable code)

**Advanced IDE Features:**

| Feature | Engine 구현체 | 상태 |
|---------|-------------|------|
| Type Hierarchy | `domain/call_type_hierarchy.rs` | **L3 Advanced** |
| Program Slicing | `q3/slicing/` (Horwitz-Reps-Binkley 1990) | **L3 Advanced** |
| Explain Query (AI-Native) | `q4/explain/` (ProofSection) | **L3 Advanced** |
| Findings Dashboard | `q4/findings_dashboard.rs` | **L3 Advanced** |
| Bulk Actions | `q4/bulk_actions/` | **L3 Advanced** |
| Unified Search | HIR + Tantivy | **L4 Production** |
| Symbol Index | `item_index_v1` (blake3 IDs) | **L4 Production** |

> **LSP 메서드 14개 중 14개 = 엔진 구현 100% 완료.** Wrapper만 작성하면 됩니다.

#### 7.2.3 MCP Tool → Engine Port 매핑 (18 Tools, 운영 가능)

AI Agent가 MCP를 통해 호출하는 분석 도구 (`apps/mcp/`, MCP Protocol stdio, Python):

```
[AI Agent/LLM] ──MCP──→ [MCP Server (apps/mcp/, 18 tools)] ──→ [Engine Ports]
```

| MCP Tool | Engine Port | Agent 용도 |
|----------|-------------|-----------|
| `find_symbol` | `ItemIndexQuery` | 심볼 검색 |
| `go_to_definition` | `NameResolverPort` | 정의로 이동 |
| `find_references` | `ImportGraphPort` + `DfgBuilderPort` | 참조 찾기 |
| `call_graph` | `CfgBuilderPort` (ICFG) | 호출 그래프 |
| `callers` / `callees` | Call Graph Query | 호출자/피호출자 |
| `search_code` | `UnifiedSearchPort` | 하이브리드 검색 |
| `document_symbols` | `HirQuery` + `ItemIndexQuery` | 문서 심볼 |
| `hover` | `SymbolResolver` | 호버 정보 |
| `type_hierarchy` | `PtaSolverPort` + HIR | 타입 계층 |
| `impact_analysis` | `TaintSolverPort` + `DfgBuilderPort` | 영향 분석 |
| `rename_preview` | `rename_preview_oracle_v1` | 이름 변경 미리보기 |
| `edit_localization` | DFG + Search | 편집 대상 찾기 |
| `bug_candidates` | Taint-based detection | 버그 후보 |
| `import_graph` | `ImportGraphQueryV2` | 임포트 그래프 |
| `circular_deps` | Import Graph analysis | 순환 의존성 |
| `clone_detection` | `CloneDetectorPort` | 코드 클론 |
| `dead_code` | DFG reachability | 죽은 코드 |
| `program_slice` | `SliceBuilderV2` | 관련 코드만 추출 (forward/backward) |

#### 7.2.4 FluentSDK v3 사용 예시 (47 Builders, Code-Verified)

엔진팀이 제공하는 Rust SDK를 Tauri 백엔드에서 직접 호출하는 패턴:

```rust
use semantica::sdk::Code;

// Entry point
let code = Code::from_path(orchestrator, path);

// === IDE Features (6 builders) ===
code.ide().hover().position(line, col).execute()
code.ide().goto_definition().position(line, col).execute()
code.ide().find_references().position(line, col).execute()
code.ide().completion().position(line, col).trigger_character('.').execute()
code.ide().rename_preview().position(line, col).execute()
code.ide().rename_workspace_edit().position(line, col).new_name("foo").execute()

// === Analysis (10+ builders) ===
code.analysis().taint().execute()              // IFDS taint analysis
code.analysis().points_to().execute()          // PTA (Steensgaard/Andersen/1-CFA/2-CFA)
code.analysis().clone_detection().execute()    // Clone detection (Type 1-4)
code.analysis().ssa().execute()                // SSA construction (Braun algorithm)
code.analysis().slice().execute()              // Program slicing (5 variants)
code.analysis().cost_analysis().execute()      // Complexity analysis
code.analysis().shape_analysis().execute()     // Container shape analysis
code.analysis().heap_analysis().execute()      // Heap analysis
code.analysis().abstract_interpret().execute() // Abstract interpretation
code.analysis().spec_mining().execute()        // Spec mining (FSM + PrefixSpan)

// === Security (2 builders) ===
code.security().vuln_scan().execute()          // Vulnerability scanning
code.security().source_sink_detect().execute() // Source/sink detection

// === Navigation (3 builders) ===
code.navigation().import_graph().execute()     // Import graph
code.navigation().call_graph().execute()       // Call graph (CHA/RTA/PTA-based)
code.navigation().symbol_shard().execute()     // Symbol shard
code.search().query("...").execute()           // Hybrid search (lexical + semantic)

// === Concurrency (3 builders) ===
code.concurrency().race_detection().execute()     // Race detection (Eraser/FastTrack)
code.concurrency().deadlock_detection().execute()  // Deadlock detection (Tarjan SCC)
code.concurrency().happens_before().execute()      // Happens-before analysis
```

#### 7.2.5 REST API (50+ Endpoints, 운영 가능)

`apps/api/` (FastAPI, port 8000):

| Category | Endpoints | 설명 |
|----------|-----------|------|
| Health | `/health`, `/health/ready`, `/health/live` | Kubernetes probe |
| Search | `POST /search`, `/search/lexical`, `/search/vector` | Hybrid/Lexical/Semantic 검색 |
| Graph | `/callers`, `/callees`, `/references`, `/imports` | 심볼 관계 쿼리 |
| Slicing | `POST /graph/slice`, `POST /graph/dataflow` | 프로그램 슬라이싱, 데이터플로 |
| Indexing | `POST /index/repo`, `/index/incremental`, `/index/status` | 레포 인덱싱 |
| Agent | `POST /agent/analyze`, `/agent/task`, `/agent/stats` | AI 분석 에이전트 |
| Workspace | CRUD `/workspaces`, branching | 작업공간 관리 |

#### 7.2.7 Direct Cargo Dependency 통합 계획 (Option A)

Tauri 앱에서 Semantica 엔진을 **in-process로 직접 호출**하는 구체적 통합 계획.

##### Step 1: Cargo.toml — 엔진 crate 추가

```toml
# apps/desktop/src-tauri/Cargo.toml

[dependencies]
# ... 기존 Tauri 플러그인들 유지 ...

# === Semantica CodeGraph V2 Engine (Direct Cargo path dependency) ===
quanta-runtime = { path = "../../../../semantica-codegraph-v2/packages/analysis/quanta-v2/crates/quanta-runtime" }
quanta-adapters = { path = "../../../../semantica-codegraph-v2/packages/analysis/quanta-v2/crates/quanta-adapters" }
quanta-core-contract = { path = "../../../../semantica-codegraph-v2/packages/analysis/quanta-v2/crates/quanta-core-contract" }

# 엔진 의존성
tokio = { version = "1", features = ["full"] }
```

> **참고**: `quanta-pyo3` (Python FFI)가 동일한 3개 crate를 사용하여 OrchestratorPort를 구현한 레퍼런스 존재.
> Path: `semantica-codegraph-v2/packages/analysis/quanta-v2/crates/quanta-pyo3/`

##### Step 2: OrchestratorPort 구현 — `engine.rs`

엔진의 DI 인터페이스인 `OrchestratorPort` trait를 Tauri 환경에 맞게 구현:

```rust
// apps/desktop/src-tauri/src/engine.rs

use quanta_core_contract::OrchestratorPort;
use quanta_runtime::Code;
use quanta_adapters::production_adapter_set;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Tauri 환경용 OrchestratorPort 구현체.
/// quanta-pyo3의 PyOrchestrator를 참고하여 동일한 패턴으로 구현.
pub struct TauriOrchestrator {
    adapters: AdapterRegistry,
    cache: Arc<RwLock<AnalysisCache>>,
    // Tauri 고유: window handle, app state 등
}

impl OrchestratorPort for TauriOrchestrator {
    // OrchestratorPort trait의 필수 메서드 구현
    // (정확한 시그니처는 quanta-core-contract crate 참조)
}

/// 엔진 상태 — Tauri app state로 관리
pub struct EngineState {
    pub orchestrator: Arc<TauriOrchestrator>,
}

impl EngineState {
    pub fn new(project_root: &str) -> Self {
        let orchestrator = Arc::new(TauriOrchestrator::new(project_root));
        Self { orchestrator }
    }

    /// FluentSDK v3 Code 객체 생성 — 모든 47개 Builder 접근 가능
    pub fn code(&self, path: &str) -> Code<TauriOrchestrator> {
        Code::from_path(self.orchestrator.clone(), path)
    }
}
```

##### Step 3: Tauri Commands — `commands.rs`

FluentSDK v3를 호출하는 `#[tauri::command]` 함수들. Q4 IDE 기능 20개 + 분석 기능:

```rust
// apps/desktop/src-tauri/src/commands.rs

use crate::engine::EngineState;
use tauri::State;

// ── IDE Navigation ──────────────────────────────────────

#[tauri::command]
async fn goto_definition(
    state: State<'_, EngineState>,
    file: String, line: u32, col: u32,
) -> Result<serde_json::Value, String> {
    let result = state.code(&file)
        .ide().goto_definition().position(line, col)
        .execute()
        .map_err(|e| e.to_string())?;
    Ok(serde_json::to_value(result).unwrap())
}

#[tauri::command]
async fn find_references(
    state: State<'_, EngineState>,
    file: String, line: u32, col: u32,
) -> Result<serde_json::Value, String> {
    let result = state.code(&file)
        .ide().find_references().position(line, col)
        .execute()
        .map_err(|e| e.to_string())?;
    Ok(serde_json::to_value(result).unwrap())
}

#[tauri::command]
async fn hover(
    state: State<'_, EngineState>,
    file: String, line: u32, col: u32,
) -> Result<serde_json::Value, String> {
    let result = state.code(&file)
        .ide().hover().position(line, col)
        .execute()
        .map_err(|e| e.to_string())?;
    Ok(serde_json::to_value(result).unwrap())
}

// ── IDE Editing ─────────────────────────────────────────

#[tauri::command]
async fn completion(
    state: State<'_, EngineState>,
    file: String, line: u32, col: u32, trigger: Option<String>,
) -> Result<serde_json::Value, String> { /* code.ide().completion()... */ }

#[tauri::command]
async fn rename_symbol(
    state: State<'_, EngineState>,
    file: String, line: u32, col: u32, new_name: String,
) -> Result<serde_json::Value, String> { /* code.ide().rename_workspace_edit()... */ }

#[tauri::command]
async fn code_actions(
    state: State<'_, EngineState>,
    file: String, start_line: u32, end_line: u32,
) -> Result<serde_json::Value, String> { /* code.ide().code_actions()... */ }

// ── Analysis ────────────────────────────────────────────

#[tauri::command]
async fn taint_analysis(state: State<'_, EngineState>, file: String)
    -> Result<serde_json::Value, String> { /* code.analysis().taint()... */ }

#[tauri::command]
async fn import_graph(state: State<'_, EngineState>, file: String)
    -> Result<serde_json::Value, String> { /* code.navigation().import_graph()... */ }

#[tauri::command]
async fn call_graph(state: State<'_, EngineState>, file: String)
    -> Result<serde_json::Value, String> { /* code.navigation().call_graph()... */ }

#[tauri::command]
async fn program_slice(
    state: State<'_, EngineState>,
    file: String, line: u32, direction: String,
) -> Result<serde_json::Value, String> { /* code.analysis().slice()... */ }

#[tauri::command]
async fn clone_detection(state: State<'_, EngineState>, file: String)
    -> Result<serde_json::Value, String> { /* code.analysis().clone_detection()... */ }

#[tauri::command]
async fn semantic_search(state: State<'_, EngineState>, query: String)
    -> Result<serde_json::Value, String> { /* code.search().query(...)... */ }

// ── Diagnostics & Tokens ────────────────────────────────

#[tauri::command]
async fn semantic_tokens(state: State<'_, EngineState>, file: String)
    -> Result<serde_json::Value, String> { /* semantic_tokens.rs */ }

#[tauri::command]
async fn diagnostics(state: State<'_, EngineState>, file: String)
    -> Result<serde_json::Value, String> { /* lsp_diagnostics.rs (5-source merge) */ }

#[tauri::command]
async fn document_symbols(state: State<'_, EngineState>, file: String)
    -> Result<serde_json::Value, String> { /* document_symbols.rs */ }

#[tauri::command]
async fn workspace_symbols(state: State<'_, EngineState>, query: String)
    -> Result<serde_json::Value, String> { /* workspace_symbols.rs */ }

// ── Project Management ──────────────────────────────────

#[tauri::command]
async fn index_project(state: State<'_, EngineState>, root: String)
    -> Result<serde_json::Value, String> { /* 프로젝트 인덱싱 */ }

#[tauri::command]
async fn indexing_status(state: State<'_, EngineState>)
    -> Result<serde_json::Value, String> { /* 인덱싱 진행률 */ }
```

##### Step 4: lib.rs — 엔진 등록

```rust
// apps/desktop/src-tauri/src/lib.rs (업데이트)

mod engine;
mod commands;

use engine::EngineState;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            // 엔진 초기화 — in-process, IPC 오버헤드 제로
            let engine = EngineState::new("/default/project/root");
            app.manage(engine);

            let _window = app.get_webview_window("main").unwrap();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // IDE Navigation
            commands::goto_definition,
            commands::find_references,
            commands::hover,
            // IDE Editing
            commands::completion,
            commands::rename_symbol,
            commands::code_actions,
            // Analysis
            commands::taint_analysis,
            commands::import_graph,
            commands::call_graph,
            commands::program_slice,
            commands::clone_detection,
            commands::semantic_search,
            // Diagnostics & Tokens
            commands::semantic_tokens,
            commands::diagnostics,
            commands::document_symbols,
            commands::workspace_symbols,
            // Project
            commands::index_project,
            commands::indexing_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Semantica");
}
```

##### Step 5: Frontend — TauriAdapter 엔진 호출

```typescript
// apps/desktop/src/TauriAdapter.ts — 엔진 invoke 추가

import { invoke } from "@tauri-apps/api/core";

// IDE Features — in-process 엔진 직접 호출 (< 1ms)
const definition = await invoke("goto_definition", { file, line, col });
const references = await invoke("find_references", { file, line, col });
const hoverInfo  = await invoke("hover", { file, line, col });
const completions = await invoke("completion", { file, line, col, trigger: "." });
const tokens     = await invoke("semantic_tokens", { file });
const diags      = await invoke("diagnostics", { file });

// Analysis — 동일한 invoke 패턴
const taint  = await invoke("taint_analysis", { file });
const graph  = await invoke("import_graph", { file });
const slice  = await invoke("program_slice", { file, line, direction: "backward" });
const clones = await invoke("clone_detection", { file });
const results = await invoke("semantic_search", { query: "auth handler" });

// Project
await invoke("index_project", { root: "/path/to/project" });
const status = await invoke("indexing_status");
```

##### 통합 타임라인

| 단계 | 작업 | 기간 |
|------|------|------|
| Week 1 | Cargo.toml 추가 + 빌드 확인 + TauriOrchestrator 스켈레톤 | 3일 |
| Week 1-2 | OrchestratorPort 구현 (quanta-pyo3 참고) + 핵심 command 5개 | 4일 |
| Week 2 | 나머지 command 15개 + Frontend invoke 연결 + E2E 검증 | 3일 |
| Week 2+ | 인덱싱 파이프라인 + 에러 핸들링 + 성능 튜닝 | 지속 |

##### 아키텍처 다이어그램 (Option A 적용 후)

```
┌─────────────────────────────────────────────────────────────────┐
│  Tauri App (단일 바이너리)                                        │
│                                                                  │
│  ┌──────────────────────┐   ┌──────────────────────────────────┐ │
│  │ Frontend (WebView)   │   │ Rust Backend                     │ │
│  │                      │   │                                  │ │
│  │  React + Monaco      │   │  ┌─ Tauri Commands (20+) ──────┐│ │
│  │  TauriAdapter.ts     │──invoke──→│ goto_definition()        ││ │
│  │                      │   │  │ find_references()         ││ │
│  │  invoke("hover",     │   │  │ taint_analysis()          ││ │
│  │    {file,line,col})  │   │  │ ...                       ││ │
│  │                      │   │  └───────────┬────────────────┘│ │
│  └──────────────────────┘   │              │ direct fn call   │ │
│                              │  ┌───────────▼────────────────┐ │ │
│                              │  │ EngineState                │ │ │
│                              │  │  └─ TauriOrchestrator      │ │ │
│                              │  │      impl OrchestratorPort │ │ │
│                              │  └───────────┬────────────────┘ │ │
│                              │              │                   │ │
│                              │  ┌───────────▼────────────────┐ │ │
│                              │  │ Semantica CodeGraph V2     │ │ │
│                              │  │ (quanta-runtime)           │ │ │
│                              │  │                            │ │ │
│                              │  │ FluentSDK v3 (47 builders) │ │ │
│                              │  │ Q4 IDE Layer (20 features) │ │ │
│                              │  │ 13+ Analysis Engines       │ │ │
│                              │  │ 82+ Ports, 103+ Adapters   │ │ │
│                              │  └────────────────────────────┘ │ │
│                              └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

별도 프로세스 (보조):
  ├─ MCP Server (apps/mcp/) — AI Agent용, 18 tools
  ├─ External LSPs — 언어별 타입 체커 (lazy spawn)
  └─ REST API (apps/api/) — CI/대시보드용 (선택)
```

#### 7.2.6 기타 운영 가능 앱

| App | Tech | 설명 | 상태 |
|-----|------|------|------|
| `apps/cli/` | Python (Typer) | `semantica index/search/tool/query/analyze` | 운영 가능 |
| `apps/quanta-engine-api/` | Hono (TS, port 3000) | FluentSDK Playground (session/execute/completions) | 운영 가능 |
| `apps/codegraph-agent/` | Python DDD | AI 코드 에이전트 (21 ports, 14 adapters, 25 domain entities) | 운영 가능 |
| `apps/ops-tool-web/` | React/TypeScript | 운영 도구 웹 UI | 운영 가능 |
| `apps/indexing/` | Python | 인덱싱 서비스 | 운영 가능 |

### 7.3 Tier 2: External Language Servers

Semantica 엔진이 커버하지 않는 **타입 체킹, 언어 고유 리팩토링, 포매팅**은 각 언어의 공식 LSP 서버에 위임한다.

#### 7.3.1 언어별 외부 LSP 구성

| Language | LSP Server | 담당 기능 | Semantica와 역할 분담 |
|----------|-----------|-----------|---------------------|
| **Python** | Pyright | Type checking, type inference, auto-import | Semantica: DFG/Taint/Clone/PTA |
| **TypeScript** | tsserver | Type checking, JSX support, auto-import | Semantica: DFG/Taint/Clone/Import Graph |
| **JavaScript** | tsserver | Type inference (JSDoc), flow analysis | Semantica: DFG/Taint/Clone |
| **Java** | Eclipse JDT LS | Type checking, Maven/Gradle resolve, refactor | Semantica: DFG/Taint/PTA/Clone |
| **Go** | gopls | Type checking, go module resolve, formatting | Semantica: DFG/Taint/Clone/Import Graph |
| **Rust** | rust-analyzer | Type inference, borrow checker, cargo integration | Semantica: CFG/DFG/Clone (PTA 제외) |
| **Kotlin** | kotlin-language-server | Type checking, Gradle integration | Semantica: DFG/Taint/PTA/Clone |

#### 7.3.2 역할 분리 원칙

```
외부 LSP가 담당하는 것 (Semantica가 하지 않는 것):
├── Type checking / Type inference (각 언어의 타입 시스템)
├── Package manager integration (npm, pip, cargo, go mod, maven)
├── Formatting (prettier, black, rustfmt, gofmt)
├── Language-specific refactoring (extract method 등)
├── Build system integration (tsconfig, Cargo.toml, go.mod)
└── Debug Adapter Protocol (DAP)

Semantica 엔진이 담당하는 것 (외부 LSP가 못하는 것):
├── Cross-language unified analysis (7개 언어 동일 파이프라인)
├── Taint analysis (IFDS interprocedural, source-sink-sanitizer)
├── Points-To Analysis (Steensgaard fast / Andersen precise)
├── Clone detection (Type 1~4, cross-file)
├── Import graph query (BFS/DFS dependency traversal)
├── Program slicing (forward/backward)
├── Memory SSA (heap alias tracking)
├── Spec mining (API usage pattern extraction)
├── Cost analysis (time/space complexity)
└── AI agent context generation (MCP)
```

#### 7.3.3 LSP Multiplexer 설계

두 LSP 소스를 단일 에디터 경험으로 통합:

```typescript
interface LspMultiplexer {
  // 요청 라우팅: 종류에 따라 Semantica 또는 외부 LSP로 전달
  route(method: string, params: any): Promise<any>;
}

// 라우팅 규칙
const routingTable: Record<string, 'semantica' | 'external' | 'merge'> = {
  // Semantica 전용 (외부 LSP에 없는 기능)
  'textDocument/diagnostic':       'merge',    // 양쪽 결과 합산
  'callHierarchy/incomingCalls':   'semantica', // ICFG가 더 정확
  'callHierarchy/outgoingCalls':   'semantica',
  'typeHierarchy/supertypes':      'semantica',

  // 외부 LSP 전용 (타입 시스템 의존)
  'textDocument/formatting':       'external',
  'textDocument/rangeFormatting':  'external',
  'textDocument/signatureHelp':    'external',  // 타입 기반

  // 양쪽 결과 merge
  'textDocument/completion':       'merge',     // Semantica 심볼 + 외부 타입
  'textDocument/hover':            'merge',     // Semantica 분석 + 외부 타입
  'textDocument/codeAction':       'merge',     // Semantica fix + 외부 refactor

  // Semantica 우선, 외부 fallback
  'textDocument/definition':       'semantica', // HIR name resolution
  'textDocument/references':       'semantica', // Import graph + DFG
  'textDocument/rename':           'semantica', // rename oracle
  'workspace/symbol':              'semantica', // HIR item index
};
```

#### 7.3.4 Diagnostics Merge 전략

Problems 패널에 양쪽 진단 결과를 통합 표시:

```typescript
// Source 태깅으로 구분
type DiagnosticSource =
  | 'semantica:taint'      // 보안 취약점 (OWASP)
  | 'semantica:clone'      // 코드 중복
  | 'semantica:complexity' // 복잡도 경고
  | 'pyright'              // Python 타입 에러
  | 'typescript'           // TS 타입 에러
  | 'rust-analyzer'        // Rust borrow checker
  | 'gopls'                // Go 타입/vet 에러
  | 'jdtls'                // Java 컴파일 에러
  | 'kotlin-ls';           // Kotlin 타입 에러

// Problems 패널에서 source별 필터링 가능
// 우선순위: Error > Warning > Info
// Semantica taint는 항상 Warning 이상으로 표시
```

### 7.4 Tier 3: AI Agent → Engine 연동

AI Agent가 코드 분석 결과를 **LLM context**로 활용하는 흐름:

```
사용자: "auth.ts의 보안 취약점 찾아줘"

┌─ Agent Loop ──────────────────────────────────────────────┐
│                                                           │
│  1. Agent → MCP: find_vulnerabilities("src/auth.ts")      │
│     Engine: IFDS Taint Analysis 실행                       │
│     Result: SQL Injection at line 42 (source→sink path)   │
│                                                           │
│  2. Agent → MCP: program_slice("src/auth.ts", line=42)    │
│     Engine: Backward slice로 관련 코드만 추출              │
│     Result: 3개 파일, 47줄 (전체 2000줄 중)                │
│                                                           │
│  3. Agent → MCP: get_data_flow("userInput", "src/auth.ts")│
│     Engine: DFG def-use chain 추적                        │
│     Result: userInput → query → db.execute() 흐름         │
│                                                           │
│  4. Agent → LLM: 분석 결과 + sliced code → fix 생성       │
│     (token 효율: 2000줄 대신 47줄만 context에 포함)        │
│                                                           │
│  5. Agent → MCP: impact_analysis(modified_files)           │
│     Engine: 수정 후 영향 범위 확인                          │
│     Result: 2개 downstream 함수 영향                       │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

이것이 Cursor/Windsurf와의 핵심 차이:
- **Cursor**: embedding search → 관련 있어 보이는 코드 chunk → LLM
- **Semantica**: program slice + DFG + taint → **정확히 관련된 코드만** → LLM

### 7.5 IDE Feature → Engine 연동 매트릭스 (Updated)

IDE UI의 각 기능이 어떤 백엔드를 사용하는지 전체 맵:

| IDE Feature | UI 위치 | Semantica Engine (Q4 구현체) | External LSP | AI Agent (MCP) |
|-------------|---------|---------------------------|-------------|---------------|
| Syntax Highlighting | Center Editor | `semantic_tokens.rs` (20+ token types) | - | - |
| Go to Definition | Center Editor | `go_to_definition.rs` + ResolutionProofV1 | fallback | - |
| Find All References | Center Editor | `find_references.rs` (EntityIdV1) | fallback | - |
| Auto Completion | Center Editor | `completion.rs` (scope-aware + trigger char) | merge (타입) | - |
| Signature Help | Center Editor | `signature_help.rs` (overload) | merge (타입) | - |
| Hover Info | Center Editor | `hover.rs` (SymbolResolver DI) | merge (타입) | - |
| Rename Symbol | Center Editor | `rename_workspace_edit.rs` (multi-file) | - | - |
| Code Actions | Center Editor | `code_actions.rs` (QuickFix/Refactor/Extract/Inline) | merge | - |
| Call Hierarchy | Center Editor | `call_type_hierarchy.rs` (CHA transitive) | - | - |
| Type Hierarchy | Center Editor | `call_type_hierarchy.rs` + PTA | - | - |
| Folding Ranges | Center Editor | `folding_ranges.rs` | - | - |
| Document Symbols | Left: Symbols | `document_symbols.rs` (hierarchical) | - | - |
| Workspace Symbols | Left: Search | `workspace_symbols.rs` (4 match strategies) | - | - |
| Diagnostics (merged) | Bottom: Problems | `lsp_diagnostics.rs` (5-source merge) | merge (type errors) | - |
| Code Formatting | Center Editor | - | Prettier/Black/rustfmt | - |
| Type Errors | Bottom: Problems | - | Pyright/tsc/gopls/etc | - |
| Security Warnings | Bottom: Problems | `TaintSolverPort` (IFDS) | - | - |
| Clone Warnings | Bottom: Problems | `CloneDetectorPort` (Type 1-4) | - | - |
| Complexity Warnings | Bottom: Problems | Cost Analyzer (recurrence) | - | - |
| Semantic Search | Left: Search | `UnifiedSearchPort` (hybrid) | - | - |
| Dependency Graph | Left: Workspace | `ImportGraphQueryV2` | - | - |
| Symbol Browser | Left: Symbols | HIR Item Index (blake3 IDs) | - | - |
| Program Slicing | Center Editor | `q3/slicing/` (5 variants) | - | - |
| Explain Query | Right: Context | `q4/explain/` (ProofSection) | - | - |
| Findings Dashboard | Right: Review | `findings_dashboard.rs` | - | - |
| AI Chat Context | Right: Context | - | - | `program_slice` + `impact_analysis` |
| Vulnerability Scan | Right: Review | - | - | `bug_candidates` + `find_references` |
| Architecture View | Center: architecture | `ImportGraphQueryV2` + `call_graph` | - | - |

### 7.6 엔진 프로세스 관리 (Option A: In-Process)

Option A (Direct Cargo Dependency) 채택으로, Semantica 엔진은 **별도 프로세스 없이 Tauri 앱 내부에서 실행**.

```
Tauri App 시작 (단일 프로세스)
│
├─ In-Process: Semantica CodeGraph V2 Engine
│   ├─ EngineState 초기화 (TauriOrchestrator)
│   ├─ FluentSDK v3 Code 객체 ready
│   ├─ 프로젝트 인덱싱 시작 (백그라운드 tokio task)
│   └─ 20+ Tauri commands 등록 (invoke_handler)
│
├─ Spawn: 활성 언어의 외부 LSP (lazy, 보조)
│   ├─ Python 파일 열림 → Pyright 시작
│   ├─ TS/JS 파일 열림 → tsserver 시작
│   ├─ Go 파일 열림 → gopls 시작
│   ├─ Rust 파일 열림 → rust-analyzer 시작
│   ├─ Java 파일 열림 → JDT LS 시작
│   └─ Kotlin 파일 열림 → kotlin-ls 시작
│
├─ Spawn: MCP Server (Agent용, 필요 시)
│   └─ AI Agent ↔ Engine 연결 (별도 프로세스)
│
└─ Frontend: invoke 기반 엔진 호출
    ├─ Semantica: invoke("goto_definition", ...) — in-process, < 1ms
    └─ 외부 LSP: 타입 체킹/포매팅 보조 (lazy-spawn)
```

#### 프로세스 라이프사이클

```typescript
// In-process 모델: 엔진이 Tauri 앱 내부에서 실행
// 별도 ManagedProcess 불필요 — Rust fn call로 직접 접근

interface EngineLifecycle {
  // Tauri .setup()에서 초기화
  engineState: EngineState;           // in-process, always-on

  // 외부 LSP: 해당 언어 파일 최초 오픈 시 lazy 시작 (보조)
  externalLsps: Map<Language, ManagedProcess>;  // lazy-spawn

  // MCP Server: AI Agent 연동 시에만 시작
  mcpServer?: ManagedProcess;         // on-demand

  // 프로젝트 인덱싱 상태 (in-process tokio task)
  indexingProgress: Observable<IndexProgress>;  // 프로그레스바 연동
}

// 인덱싱 진행률 → Status Bar에 표시
// invoke("indexing_status") → { progress: 45, total: 2741, elapsed_ms: 892 }
// "Semantica: Indexing... 45% (1,234 / 2,741 files)"
// "Semantica: Ready (2,741 files, 892ms)"
```

#### In-Process vs Out-of-Process 비교

| 항목 | In-Process (Option A) | Out-of-Process (LSP) |
|------|----------------------|---------------------|
| 레이턴시 | **< 1ms** (fn call) | < 50ms (stdio/TCP) |
| 메모리 | 공유 (효율적) | 별도 프로세스 메모리 |
| 배포 | 단일 바이너리 | 엔진 바이너리 별도 관리 |
| 안정성 | 엔진 panic → 앱 crash | 엔진 crash → 재시작 가능 |
| 타입 안전성 | 컴파일 타임 검증 | JSON 직렬화 오버헤드 |
| 디버깅 | 단일 프로세스 디버깅 | 멀티 프로세스 디버깅 |

> **안정성 대응**: `std::panic::catch_unwind`로 엔진 panic 격리 + Tauri error handler로 graceful recovery.

---

## 8. Competitive Positioning

### 8.1 경쟁 제품 대비 엔진 차별점

| 경쟁 제품 | 강점 | Semantica IDE 차별점 |
|-----------|------|---------------------|
| **Cursor 2.0** | VSCode fork, 8 parallel agents, BugBot | Semantica: 20개 IDE 기능 자체 엔진, Taint/PTA/DFG/Clone 깊은 분석 |
| **Sourcegraph** | Code search + navigation | Semantica: search + Taint/PTA/DFG/Clone/MemSSA/Cost 분석 통합 |
| **CodeQL** | Security query engine | Semantica: real-time 분석 + 7개 언어 + 20 IDE 기능 + AI Agent |
| **Google Antigravity** | Dual Surface, Gemini 2M context | Semantica: program slice로 정밀 context (90% 토큰 절감), vendor-agnostic |
| **Joern** | CPG 기반 분석 | Semantica: 103+ adapter, 82+ port, 20 IDE 기능 + FluentSDK |
| **rust-analyzer** | 단일 언어 LSP gold standard | Semantica: 7개 언어 통합, 동일 분석 파이프라인 |
| **Meta Infer** | Bug finder (Pulse) | Semantica: PTA/DFG/Clone/Import/MemSSA + IDE 통합 |
| **Kiro (AWS)** | Spec-driven, Bedrock | Semantica: spec + 정적 분석 기반 영향도, vendor-agnostic |

### 8.2 핵심 차별화 요소 (코드 검증 완료)

```
Semantica IDE가 경쟁사 대비 가진 고유 조합:

1. 자체 엔진 (1M+ LOC Rust)
   ├── 7개 언어 통합 분석 (동일 LanguagePlugin trait, tree-sitter)
   ├── 20개 IDE 기능 전부 REAL (스텁 0건, LSP 3.16+ 준수)
   ├── 11-Layer analysis pipeline (Parse → MemSSA)
   └── 82+ Ports → 103+ Adapters (Hexagonal Architecture)

2. 깊은 분석 (경쟁사에 없는 것)
   ├── 5종 PTA Solver (Steensgaard, Andersen, Parallel, 1-CFA, 2-CFA)
   ├── IFDS Taint (interprocedural, parallel, source-sink-sanitizer)
   ├── Program Slicing 5종 (Backward, Forward, Chop, Dice, Thin)
   ├── MemSSA (heap alias tracking, strong/weak update, Phi)
   ├── 5개 Concurrency 분석 (Eraser, Tarjan, FastTrack, HappensBefore, Hybrid)
   ├── Cost Analysis (recurrence solver, termination proof)
   └── Spec Mining (FSM inference, PrefixSpan sequential pattern)

3. AI Agent 정밀 context (Cursor와의 핵심 차이)
   ├── Cursor: embedding search → 관련 있어 보이는 코드 chunk → LLM
   └── Semantica: program slice + DFG + taint → 정확히 관련된 코드만 → LLM
       → 90%+ 토큰 절감, 환각 대폭 감소

4. 운영 즉시 가능한 앱 계층
   ├── REST API (50+ endpoints, FastAPI)
   ├── MCP Server (18 AI tools)
   ├── CLI (5+ commands)
   ├── AI Agent (DDD, 21 ports)
   └── Playground (FluentSDK interactive)
```

---

## 9. Implementation Phases

> **핵심**: 엔진은 이미 완성 (20개 IDE 기능, 13+ 분석 엔진, 7개 앱).
> 프론트엔드 팀이 해야 할 것은 **LSP wrapper + Editor Shell + UI 통합**이다.

### Phase 0: Foundation + Engine Integration (1-2 weeks)
- [ ] `WorkspaceShell` — Dual Surface 컨테이너 (Editor/Manager 스위칭)
- [ ] `ResizableSplitter` — 드래그 리사이즈 primitive
- [ ] `DockContainer` — 아이콘 탭바 + 패널 전환 + collapse
- [ ] Layout persistence (Jotai + localStorage)
- [ ] **Engine Direct Integration (Option A)**: Cargo path dependency로 엔진 in-process 연동
  - `Cargo.toml`에 quanta-runtime/adapters/core-contract 추가 + 빌드 확인
  - `TauriOrchestrator` (OrchestratorPort 구현) 스켈레톤 작성
  - 핵심 Tauri command 5개 (goto_definition, hover, completion, diagnostics, semantic_tokens)
  - Frontend invoke 연결 검증 (TauriAdapter.ts → invoke → 엔진 결과 확인)
- [ ] **외부 LSP** 1개 연동 (Pyright 또는 tsserver, 타입 체킹 보조)
- [ ] **MCP Server** 연결 확인 (18 tools 즉시 사용 가능, `apps/mcp/`)

### Phase 1: Editor Surface + Language Backend (2-3 weeks)
- [ ] `EditorTabGroup` — 탭 바 + kind별 렌더러 + 드래그 재정렬
- [ ] Monaco Editor 통합 (Tauri webview)
- [ ] Left Dock: File Tree, Git, Search, Symbols 탭 연결
- [ ] Right Dock: Chat, Plan, Review 탭 연결
- [ ] Bottom Panel: Terminal, Output, Problems 탭
- [ ] Keyboard shortcuts (Cmd+B sidebar, Cmd+J bottom, Cmd+Shift+E editor)
- [ ] **Semantica 엔진 완전 연동** (20개 기능 전부, in-process invoke):
  - Navigation: goto_definition, find_references, hover, document_symbols, workspace_symbols
  - Editing: completion, signature_help, rename_symbol, code_actions
  - Syntax: semantic_tokens, diagnostics (5-source merge), folding_ranges
  - Advanced: call/type hierarchy, program_slice, explain query
- [ ] **외부 LSP lazy spawn**: 파일 열림 시 해당 언어 LSP 자동 시작 (타입 체킹 보조)
- [ ] **Diagnostics merge**: Semantica invoke (5-source) + 외부 LSP type errors → Problems 패널
- [ ] **인덱싱 프로그레스**: invoke("indexing_status") → Status Bar 진행률 표시

### Phase 2: Manager Surface + Deep Analysis (2-3 weeks)
- [ ] Agent Cards 대시보드 (agents-panel 확장)
- [ ] Activity Timeline (activity-feed + checkpoint-timeline 통합)
- [ ] Approval Queue (approval-banner 통합)
- [ ] Background Jobs 모니터 (background-jobs-panel 통합)
- [ ] Multi-Agent parallel execution UI
- [ ] Cmd+Shift+M 전환
- [ ] **Findings Dashboard** 연동 (보안 취약점 severity/category/file grouping)
- [ ] **Architecture View**: Import Graph + Call Graph 시각화 (엔진 데이터 직접 연동)

### Phase 3: Adaptive & Automation (2 weeks)
- [ ] Workspace Mode 자동 감지 (explore/collaborate/supervise)
- [ ] Spec-Driven workflow panel (plan-checklist 확장)
- [ ] Event-Driven Automations 설정 UI
- [ ] Scope Guard 시각화 (작업 범위 하이라이트)
- [ ] **Impact Highlight**: DFG + Taint로 현재 편집 중 함수의 영향 범위 실시간 표시
- [ ] **AI Agent 정밀 context**: program slice + DFG로 LLM context 최적화

### Phase 4: Polish & Differentiation (ongoing)
- [ ] Code annotation layer (AI가 수정한 라인 시각 표시)
- [ ] Session replay (action-replay-panel 통합)
- [ ] Debate Arena (multi-model comparison in Manager)
- [ ] **Concurrency Analysis UI**: Race/Deadlock 탐지 결과 시각화
- [ ] **Clone Detection UI**: 코드 중복 맵, refactor 제안
- [ ] Performance profiling (in-process 엔진 최적화, panic 격리 강화)
- [ ] 엔진 command 추가 확장 (FluentSDK 47 builder 중 미노출 기능)

---

## 10. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Monaco 번들 크기 | 초기 로드 느림 | Lazy load, WASM 빌드, 코드 스플리팅 |
| Multi-agent 상태 복잡도 | 버그, 레이스 컨디션 | Jotai atom family + 에이전트별 격리 |
| Tauri + Monaco 호환성 | 렌더링 이슈 | 초기 PoC에서 검증 (Phase 0) |
| Feature creep | 출시 지연 | Phase 0-1만으로 MVP, 이후 점진 확장 |
| 기존 VSCode extension 호환 | 사용자 이탈 | Phase 1에서 VSCode webview 모드 유지 |
| Semantica LSP 인덱싱 시간 | 대형 repo 초기 대기 | Incremental indexing + 캐시, tree-sitter incremental < 10ms |
| LSP Multiplexer 충돌 | 중복/모순 결과 | Source 태깅 + 명확한 라우팅 규칙 (Section 7.3.3) |
| 외부 LSP 프로세스 메모리 | 다중 LSP 동시 실행 시 부담 | Lazy spawn + 비활성 언어 LSP 자동 종료 |
| 엔진 Rust 바이너리 크기 | Tauri 배포 크기 증가 | strip + LTO, 필요 기능만 feature flag으로 선택 |

---

## 11. Success Metrics

### 11.1 UI/UX Metrics
- **Editor 면적**: 기본 상태에서 화면의 50%+ (코드 가시성 보장)
- **Surface 전환 속도**: Editor <-> Manager < 100ms
- **메모리 사용량**: Cursor 대비 50%+ 절감 (Tauri vs Electron)
- **Multi-agent**: 최소 4개 에이전트 동시 실행 + 충돌 없음
- **Cold start**: < 2초 (Zed 수준 목표)

### 11.2 Engine Performance Metrics (Code-Verified Targets)
- **Incremental parse**: < 10ms (tree-sitter incremental)
- **Single file analysis (CFG+DFG)**: < 100ms (일반 크기 파일)
- **Go-to-definition 응답**: < 50ms (Q4 query, cross-file resolution)
- **Find references**: < 100ms (EntityIdV1 기반)
- **Completion**: < 50ms (scope-aware, trigger character)
- **Semantic tokens**: < 50ms (LSP 3.16+ delta encoding)
- **Diagnostics (5-source merge)**: < 200ms
- **Taint analysis (small project)**: < 1s (IFDS solver)
- **Taint analysis (medium project)**: < 10s (parallel solver)
- **엔진 인덱싱 (medium repo)**: < 10초 (incremental < 1초)
- **Build (incremental)**: ~1s (`just c`, sccache 100% hit)

### 11.3 AI Quality Metrics
- **AI Agent context 정확도**: program slice로 전체 코드 대비 90%+ 토큰 절감
- **Vulnerability detection**: OWASP Top 10 커버, source→sink path 증거 포함
- **Clone detection**: Type 1-4, cross-file, 6개 언어

---

## 12. References

- Cursor 2.0 Agent Layout: https://cursor.com/changelog/2-0
- Google Antigravity Dual Surface: https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/
- Kiro Spec-Driven Development: https://kiro.dev/blog/introducing-kiro/
- Devin 2.0 Agent-Native Design: https://medium.com/@takafumi.endo/agent-native-development-a-deep-dive-into-devin-2-0s-technical-design-3451587d23c0
- JetBrains Developer Ecosystem 2025: https://blog.jetbrains.com/research/2025/10/state-of-developer-ecosystem-2025/
- Cursor Automations (March 2026): https://techcrunch.com/2026/03/05/cursor-is-rolling-out-a-new-system-for-agentic-coding/
- Cursor BugBot: https://cursor.com/blog/building-bugbot
- Developer Time Distribution: Minelli et al., ICSE 2015

---

## Appendix A: Engine Analysis Algorithm Catalog

| Algorithm | Domain | Engine Adapter | Complexity |
|-----------|--------|----------------|------------|
| **IFDS** | Taint (interprocedural) | `IfdsTaintAdapter` | O(ED^3) |
| **Steensgaard** | PTA (fast) | `SteensgaardSolverAdapter` | O(n*a(n)) |
| **Andersen** | PTA (precise) | `AndersenSolverAdapter` | O(n^3) |
| **Parallel Andersen** | PTA (concurrent) | `ParallelAndersenSolverAdapter` | O(n^3/p) |
| **1-CFA** | PTA (context-sensitive) | `OneCfaSolverAdapter` | exponential |
| **2-CFA** | PTA (context-sensitive) | `TwoCfaSolverAdapter` | exponential |
| **Eraser** | Race detection | `EraserAdapterV2` | O(n) |
| **FastTrack** | Race detection | `FastTrackAdapterV2` | O(n) |
| **Tarjan SCC** | Deadlock / Call graph | Iterative impl | O(V+E) |
| **Horwitz-Reps-Binkley** | Program slicing | `ProgramSlicer` | O(V*E) |
| **Braun** | SSA construction | `SsaBuilderAdapter` | O(n) |
| **MemSSA** | Heap alias tracking | `quanta-memssa` | O(n*k) |
| **Token-based** | Clone Type 1-3 | `CloneDetectionAdapter` | O(n^2) |
| **AST-based** | Clone Type 3-4 | `CloneDetectionAdapter` | O(n^2) |
| **Fixpoint** | Abstract interpretation | `quanta-fixpoint` | lattice-dependent |
| **Z3 SMT** | Constraint solving | `Z3SmtAdapter` | decidable theory |
| **PrefixSpan** | Spec mining | `PrefixSpanMinerAdapter` | O(n*k) |
| **FSM Inference** | Spec mining | `StateMachineInferencerAdapter` | O(n^2) |

## Appendix B: Engine Port/Adapter Scale (82+ Ports, 103+ Adapters)

| Category | Port Traits | Key Ports |
|----------|-------------|-----------|
| CFG/DFG | 6 | `CfgBuilderPort`, `DfgBuilderPort`, `CfgDfgPipelinePort` |
| SSA | 4 | `SsaBuilderPort`, `SsaFactsPort`, `FailClosedSsaBuilder` |
| PTA | 7 | `PtaSolverPort`, `PtaSolverPortV2`, `ContextSensitivePtaPort`, `ReceiverPointsToPort` |
| Taint | 8 | `TaintSolverPort`, `TaintIfdsPort`, `TaintIdePort`, `SourceSinkDetectorPort` |
| Clone | 5 | `CloneDetectorPort`, `FamilyCloneDetectorPort`, `ParallelCloneDetectorPort` |
| Search | 8 | `UnifiedSearchPort`, `LexicalSearchPort`, `SemanticSearchPort` |
| IDE/Symbol | 6 | `LspSymbolPort`, `SymbolQueryPort`, `OccurrenceQueryPort` |
| Concurrency | 7 | `RaceDetectorPortV2`, `DeadlockDetectorPortV2`, `HappensBeforePortV2` |
| Cost/Termination | 5 | `CostAnalyzerPort`, `RecurrenceSolverPort`, `TerminationAnalyzerPort` |
| Memory/Heap | 6 | `ShapeAnalyzerPort`, `HeapAnalyzerPort`, `MemoryCheckerPort`, `EscapeAnalyzerPort` |
| SCA/Security | 7 | `ScaSbomPort`, `ScaVulnDbPort`, `ScaCveMatcherPort`, `VulnPredictorPort` |
| Cache/Storage | 8 | `CachePort`, `PresenceCachePort`, `ValueCachePort`, `ArtifactStore` |
| Infra/Other | 15+ | `VfsReadPort`, `TelemetryPort`, `EventBusPort`, `WatchPort`, `EmbeddingPort` |

## Appendix C: Supported Languages & Analysis Coverage

| Language | Plugin | Parse | HIR | CFG | DFG | SSA | Taint | PTA | Clone | Import |
|----------|--------|-------|-----|-----|-----|-----|-------|-----|-------|--------|
| Python | `PythonPlugin` | O | O | O | O | O | O | O | O | O |
| Java | `JavaPlugin` | O | O | O | O | O | O | O | O | O |
| JavaScript | `TypeScriptPlugin` | O | O | O | O | O | O | O | O | O |
| TypeScript | `TypeScriptPlugin` | O | O | O | O | O | O | O | O | O |
| Go | `GoPlugin` | O | O | O | O | O | O | O | O | O |
| Rust | `RustPlugin` | O | O | O | O | O | O | - | O | O |
| Kotlin | `KotlinPlugin` | O | O | O | O | O | O | O | O | O |
| C | `CPlugin` | O | O | O | O | O | O | - | O | O |

## Appendix D: LSP Method → Engine Quick Reference

```
textDocument/definition       → go_to_definition.rs (ResolutionProofV1, cross-file)
textDocument/references       → find_references.rs (EntityIdV1, configurable)
textDocument/hover            → hover.rs (SymbolResolver DI)
textDocument/completion       → completion.rs (scope-aware, trigger char, built-ins)
textDocument/signatureHelp    → signature_help.rs (overload support)
textDocument/documentSymbol   → document_symbols.rs (hierarchical, 17 HIR kinds)
workspace/symbol              → workspace_symbols.rs (exact/prefix/contains/fuzzy)
textDocument/semanticTokens   → semantic_tokens.rs (LSP 3.16+, delta, 20+ types)
textDocument/publishDiag...   → lsp_diagnostics.rs (5-source merge)
textDocument/codeAction       → code_actions.rs (QuickFix/Refactor/Extract/Inline)
textDocument/prepareRename    → sdk/ide.rs (RenamePreviewBuilderV2)
textDocument/rename           → rename_workspace_edit.rs (multi-file, BTreeMap)
textDocument/foldingRange     → folding_ranges.rs
callHierarchy/*               → CallGraphQuery + TypeHierarchy (CHA transitive)
```
