# RFC-TERMINAL-018: Phase B Implementation Roadmap

| Field | Value |
|-------|-------|
| ID | RFC-TERMINAL-018-PHASE-B-ROADMAP |
| Status | Draft |
| Date | 2026-03-09 |
| Owner | Semantica DevOS |
| Audience | IDE Team, Agent Team |
| Parent | RFC-TERMINAL-011-SCOPE-LOCK |
| Scope | Phase B 전체 구현 계획, 의존성 그래프, 스프린트 분해, 완료 기준 |

---

## 1. 현재 상태 요약

### 1.1 Phase A (완료)

| 항목 | 상태 |
|------|------|
| xterm.js raw viewport | ✅ 완료 |
| Tauri PTY host (Rust hexagonal) | ✅ 완료 |
| Multi-session / tabs | ✅ 완료 |
| Shell marker protocol (4 shells) | ✅ 완료 |
| Command tracking (start/end/status) | ✅ 완료 |
| Compatibility detection (alt-screen/TUI) | ✅ 완료 |
| Auto fallback (hybrid → classic) | ✅ 완료 |
| Terminal portal (dock ↔ float) | ✅ 완료 |
| Session provenance model | ✅ 완료 |
| Agent execution bridge (types + Rust service) | ✅ 완료 |
| Policy guard (11 rules) | ✅ 완료 |
| Search overlay (Cmd+F) | ✅ 완료 |
| Settings UI | ✅ 완료 |
| Overlay skeleton (OverlayRoot, CommandBlock, Rail) | ✅ 완료 |
| ParsedDecorations chips (UI) | ✅ 완료 |
| Event listener (18 event types) | ✅ 완료 |
| Task detector (dev-server, build, test) | ✅ 완료 |

### 1.2 Phase B (이번 로드맵 대상)

```
Phase B = 시맨틱 터미널이 실제로 "동작"하게 만드는 단계
```

Phase A가 뼈대라면, Phase B는 **살을 붙이는 작업**:
- 파서가 실제로 에러/파일링크를 추출하고
- 클릭하면 에디터로 점프하고
- 실패한 블록에서 Agent에게 수정을 요청하고
- 블록 summary가 자동 생성되고
- 블록 액션 (rerun, copy, problems, explain)이 동작하고
- Agent 실행 결과에 structured feedback이 포함된다

---

## 2. 의존성 그래프

```
                    ┌──────────────────┐
                    │ S1: ANSI Strip   │
                    │     Utility      │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼───┐  ┌──────▼──────┐  ┌───▼───────────┐
    │ S2: Generic │  │ S3: TS      │  │ S4: Jest/     │
    │   Parser+   │  │   Parser    │  │   Vitest      │
    └─────────┬───┘  └──────┬──────┘  └───┬───────────┘
              │              │              │
              │    ┌─────────┼──────────────┤
              │    │         │              │
              ▼    ▼         ▼              ▼
         ┌────────────────────────────────────┐
         │ S5: Summary Generation             │
         │     (command complete → summary)    │
         └───────────────┬────────────────────┘
                         │
              ┌──────────┼──────────────┐
              │          │              │
    ┌─────────▼──┐ ┌────▼─────┐ ┌─────▼──────────┐
    │ S6: Intent │ │ S7: Block│ │ S8: Agent      │
    │   Router   │ │  Actions │ │  Result        │
    │ (open-file)│ │  Bar     │ │  Enrichment    │
    └─────────┬──┘ └────┬─────┘ └─────┬──────────┘
              │          │              │
              ▼          ▼              ▼
    ┌─────────────────────────────────────────────┐
    │ S9: OverlayRoot Wiring                       │
    │  (chips → intent, blocks → actions,          │
    │   summary → footer, scroll → navigate)       │
    └──────────────────┬──────────────────────────┘
                       │
            ┌──────────┼──────────┐
            │          │          │
    ┌───────▼──┐ ┌────▼─────┐ ┌─▼────────────┐
    │ S10: AI  │ │ S11: Ask │ │ S12: Block   │
    │ Context  │ │  Agent   │ │  Navigation  │
    │  Atom    │ │  Flow    │ │  + Scroll    │
    └───────┬──┘ └────┬─────┘ └─┬────────────┘
            │          │         │
            ▼          ▼         ▼
    ┌─────────────────────────────────────┐
    │ S13: Integration Test &             │
    │      Gate Validation                │
    └─────────────────────────────────────┘
```

---

## 3. 스프린트 분해

### Sprint B1: Parser Foundation (Rust)

> **목표:** 터미널 출력에서 structured event가 실제로 생성된다

| # | 작업 | 파일 | 규모 | 의존 |
|---|------|------|------|------|
| S1 | ANSI strip 유틸 + 테스트 | `domain/output_parsers/ansi.rs` | S | — |
| S2 | GenericParser 강화 (다양한 file:line 패턴) | `domain/output_parsers/generic.rs` | S | S1 |
| S3 | TypeScriptParser (tsc + vue-tsc) | `domain/output_parsers/typescript.rs` | M | S1 |
| S4 | JestVitestParser | `domain/output_parsers/jest.rs` | M | S1 |
| S4b | ESLintParser (블록 파싱) | `domain/output_parsers/eslint.rs` | M | S1 |
| S5 | Summary 자동 생성 로직 | `application/output_pipeline.rs` | M | S3, S4 |
| — | Golden file 테스트 fixtures | `tests/fixtures/parsers/` | M | S3-S5 |

**완료 기준:**
- `pnpm lint` 출력에서 DiagnosticEvent 생성
- `pnpm test` 출력에서 TestResultEvent 생성
- 커맨드 완료 시 SummaryEvent 자동 생성
- Golden file 테스트 전부 통과

### Sprint B2: Cross-Surface Wiring (FE)

> **목표:** 파싱된 이벤트가 UI에 표시되고, 클릭이 동작한다

| # | 작업 | 파일 | 규모 | 의존 |
|---|------|------|------|------|
| S6 | `SurfaceIntent` type 정의 | `shared/protocol/types/intent.ts` | S | — |
| S6b | `useTerminalIntentDispatch` hook | `features/terminal/lib/useTerminalIntentDispatch.ts` | M | S6 |
| S6c | `open-file` handler (경로 해석 + EditorSurface) | `app/shell/useIntentRouter.ts` | M | S6 |
| S7 | `BlockActions` 컴포넌트 | `features/terminal/ui/BlockActions.tsx` | M | — |
| S7b | `BlockSummaryFooter` 컴포넌트 | `features/terminal/ui/BlockSummaryFooter.tsx` | S | — |
| S9 | OverlayRoot 완전 바인딩 | `features/terminal/ui/OverlayRoot.tsx` | L | S6, S7 |
| S9b | ParsedDecorations → intent dispatch 연결 | `features/terminal/ui/ParsedDecorations.tsx` | S | S6b |

**완료 기준:**
- `FileLinkChip` 클릭 → 에디터에서 파일:라인 열림
- `DiagnosticChip` 클릭 → 에디터 열림 + 인라인 힌트
- Failed block에 action bar 표시 (Rerun, Copy, Problems, Explain)
- Block summary footer에 에러/테스트 카운트 표시

### Sprint B3: Agent Integration (FE + Agent)

> **목표:** 터미널 ↔ Agent 양방향 연동이 동작한다

| # | 작업 | 파일 | 규모 | 의존 |
|---|------|------|------|------|
| S8 | Agent 실행 결과 enrichment (parsedTestResults, parsedSummary) | Rust `execution.rs` + types | M | B1 |
| S10 | `terminalAIContextAtom` 구현 | `features/terminal/model/aiAtoms.ts` | M | — |
| S11 | `ask-agent` handler + TerminalBlockAttachment | `app/shell/useIntentRouter.ts` + Agent panel | L | S6, S10 |
| S11b | `TerminalBlockAttachPreview` 컴포넌트 | `widgets/terminal-block-preview/` | M | S11 |
| S11c | `reveal-terminal` handler (Agent → Terminal 역방향) | `app/shell/useIntentRouter.ts` | S | S6 |

**완료 기준:**
- Failed block → "Fix with Agent" → Agent panel 활성화 + block 첨부
- Agent가 `execAgentCommand()` 실행 후 `parsedErrors` + `parsedSummary` 수신
- Agent command card 클릭 → Terminal panel에서 해당 block으로 스크롤

### Sprint B4: Block Navigation & Polish

> **목표:** Warp급 블록 네비게이션 + 스크롤 정책

| # | 작업 | 파일 | 규모 | 의존 |
|---|------|------|------|------|
| S12 | Block navigation (Cmd+↑/↓, Cmd+Shift+↑/↓) | `features/terminal/lib/useBlockNavigation.ts` | M | — |
| S12b | Auto-follow scroll + "Jump to bottom" 버튼 | `features/terminal/ui/JumpToBottom.tsx` | M | — |
| S12c | Block outline (mini navigator) | `features/terminal/ui/BlockOutline.tsx` | M | — |
| S12d | Copy block as markdown | `features/terminal/lib/blockExport.ts` | S | — |
| — | History-based ghost text (no AI) | `features/terminal/ui/ai/AIGhostText.tsx` | M | — |
| — | Keyboard shortcut 등록 (Cmd+I, Cmd+Shift+A) | `features/terminal/lib/useTerminalKeyboard.ts` | S | — |

**완료 기준:**
- `Cmd+↑/↓` 블록 간 이동
- `Cmd+Shift+↑/↓` failed 블록 간 이동
- 스크롤 올리면 auto-follow 해제 + "Jump to bottom" 표시
- 블록 우클릭 "Copy as Markdown" 동작
- 이전 명령어 history ghost text 표시

### Sprint B5: Cargo/Python + Integration Test

> **목표:** 추가 파서 + 전체 통합 테스트 + gate 검증

| # | 작업 | 파일 | 규모 | 의존 |
|---|------|------|------|------|
| — | CargoParser 구현 + golden tests | Rust `domain/output_parsers/cargo.rs` | M | B1 |
| — | PythonParser 구현 + golden tests | Rust `domain/output_parsers/python.rs` | M | B1 |
| — | OutputPipeline integration test | Rust `application/output_pipeline.rs` | L | B1, B5 |
| S13 | Gate validation (G-UX, G-AGENT, G-COMP) | 수동 + 자동 | L | B1-B4 |
| — | 성능 벤치마크 (parser throughput) | Rust bench | S | B1 |

**완료 기준:**
- Cargo/Python 출력 파싱 동작
- OutputPipeline end-to-end 테스트 통과
- V1 gate 항목 전부 통과:
  - G-COMP: 호환성 (vim, tmux, fzf 등)
  - G-UX: 블록 네비게이션, 검색, 스크롤
  - G-AGENT: 실행 + 결과 반환 + 역방향 점프

---

## 4. 전체 타임라인

```
Phase B 전체:

 B1 ━━━━━━━━━━━━┓
 Parser Found.  ┃
                ┃
 B2 ━━━━━━━━━━━━╋━━━━━━━━━━━━┓
 Cross-Surface  ┃ (B1 일부 후) ┃
                ┃             ┃
 B3 ━━━━━━━━━━━━┛━━━━━━━━━━━━╋━━━━━━━━━━━┓
 Agent Integr.                ┃            ┃
                              ┃            ┃
 B4 ━━━━━━━━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━┫
 Block Nav/UX                 ┃            ┃
                              ┃            ┃
 B5 ━━━━━━━━━━━━━━━━━━━━━━━━━━┛━━━━━━━━━━━┛
 Integration Test                    ▲
                                     │
                              V1 Complete
```

**병렬 가능:**
- B1 (Rust) ∥ B2 FE 일부 (S6, S7 — intent type + UI 컴포넌트)
- B3 ∥ B4 (Agent 연동과 블록 네비게이션은 독립)
- B5는 B1~B4 완료 후

**크리티컬 패스:**
```
S1 → S3 → S5 → S9 → S13 (Parser → Summary → Wiring → Test)
```

---

## 5. V1 완료 기준 (Phase A + B)

### 5.1 Gate 통과 체크리스트

| Gate | 항목 | 기준 |
|------|------|------|
| G-COMP-01 | raw xterm.js 동작 | vim, less, top, tmux, fzf 정상 |
| G-COMP-02 | alt-screen → classic fallback | 자동 전환 + 복귀 |
| G-COMP-03 | 4 shell 호환 | zsh, bash, fish, pwsh |
| G-UX-01 | Block 표시 | command boundary, status, duration |
| G-UX-02 | Block navigation | Cmd+↑/↓ 동작 |
| G-UX-03 | File link click | 에디터 열림 |
| G-UX-04 | Diagnostic click | 에디터 열림 + 인라인 힌트 |
| G-UX-05 | Block summary | 에러/테스트 카운트 자동 표시 |
| G-UX-06 | Block actions | Rerun, Copy 동작 |
| G-UX-07 | Search (Cmd+F) | 동작 |
| G-UX-08 | Auto-follow scroll | 스크롤 정책 정상 |
| G-AGENT-01 | Agent exec → Terminal 실행 | 명령어 실행 + 결과 반환 |
| G-AGENT-02 | Agent exec → parsedErrors | structured 에러 반환 |
| G-AGENT-03 | Failed block → Ask Agent | Agent panel 활성화 + 첨부 |
| G-AGENT-04 | Agent card → reveal terminal | 역방향 점프 |
| G-AGENT-05 | Provenance 표시 | user/agent/rerun badge |
| G-PERF-01 | Parser throughput | < 100µs/line |
| G-PERF-02 | Event buffer | 1000 events/session 초과 시 trim |
| G-PERF-03 | xterm.js FPS | 60fps (일반 출력) |
| G-FALLBACK-01 | Parser 실패 → 무시 | terminal 계속 동작 |
| G-FALLBACK-02 | Marker 없음 → classic | 시맨틱 기능 없이 raw 동작 |

### 5.2 머지 조건

```
1. G-COMP 전부 통과
2. G-FALLBACK 전부 통과
3. G-UX 핵심 (01-07) 통과
4. G-AGENT 핵심 (01-05) 통과
5. G-PERF 치명 이슈 없음
6. Golden file 테스트 전부 통과
7. 기존 테스트 regression 없음
```

---

## 6. Phase C (V1.5~V2) 예고

Phase B 완료 후 Phase C에서 추가되는 기능:

| 기능 | Scope | RFC |
|------|-------|-----|
| AI Command Input (Cmd+I) | V1.5 | 016 |
| AI Ghost Text (LLM 기반) | V1.5 | 016 |
| AI Explain Popover | V1.5 | 016 |
| User plugin parser (TOML) | V1.5 | 015 |
| Command search (Cmd+K) | V1.5 | 004 |
| Workflow (parameterized templates) | V1.5 | 004 |
| Block export (HTML/JSON/MD) | V1.5 | 004 |
| Smart completion (3-tier) | V2 | 004 |
| Editor-like input (CodeMirror) | V2 | 004 |
| Problems panel 연동 | V1.5 | 017 |
| Cargo/Python 파서 | V1.5 | 015 |
| 로컬 AI 모델 지원 | V2 | 016 |

---

## 관련 문서

- [011-scope-lock.md](./011-scope-lock.md) — V1/V1.5/V2 범위 정의
- [014-gates-and-acceptance.md](./014-gates-and-acceptance.md) — Gate 상세 기준
- [015-semantic-output-parser-pipeline.md](./015-semantic-output-parser-pipeline.md) — 파서 구현 스펙
- [016-ai-terminal-intelligence.md](./016-ai-terminal-intelligence.md) — AI 기능 스펙
- [017-ide-federation-cross-surface.md](./017-ide-federation-cross-surface.md) — Cross-surface 연결 스펙
