# RFC-TERMINAL-005: 일반 터미널 호환성 계약 & 최종 컴포넌트 구조

| Field | Value |
|-------|-------|
| ID | RFC-TERMINAL-005-COMPAT-COMPONENTS |
| Status | Draft |
| Date | 2026-03-09 |
| Owner | Semantica DevOS |
| Audience | IDE Team, Engine Team |
| Parent | RFC-TERMINAL-000 Overview |
| Depends On | RFC-TERMINAL-001 Architecture, RFC-TERMINAL-004 Warp-Level UX |
| Scope | PTY 호환성 계약, overlay 비활성화 조건, shell marker fallback, 2-layer 렌더링, 최종 컴포넌트 트리, 상태 모델, Rust 추가 모듈, 구현 순서 |
| Non-Goals | parser 상세 구현, agent bridge protocol (→ 001, 003), UX 디자인 상세 (→ 004) |

---

## 1. 설계 원칙

```
Raw terminal compatibility first
+ semantic augmentation second
+ never let overlay break PTY behavior
```

**절대 원칙:**

1. 실제 terminal behavior는 **xterm.js + PTY가 단독 책임**
2. Overlay는 **읽기/탐색/액션 보조**만 담당
3. Overlay가 input/cursor/selection/IME/alt-screen을 **가로채면 안 됨**
4. Agent/semantic 기능이 꺼져도 terminal은 **완전히 정상 동작**해야 함

---

## 2. 일반 터미널 호환성 계약

### 2.1 반드시 보존해야 하는 동작

이건 "보완 사항"이 아니라 **호환성 계약**으로 명시한다.

| 영역 | 보존 여부 |
|------|-----------|
| stdin/stdout/stderr raw stream | **필수** |
| ANSI 색상/escape sequence | **필수** |
| Cursor 이동 | **필수** |
| Copy/paste | **필수** |
| Selection | **필수** |
| IME 입력 (한글, 일본어 등) | **필수** |
| Resize (PTY window resize) | **필수** |
| Alt screen (alternate buffer) | **필수** |
| Full-screen TUI apps | **필수** |
| Shell job control (Ctrl+Z, bg, fg) | **필수** |
| tmux / vim / less / top / htop | **필수** |

> xterm.js raw layer가 담당하고, semantic overlay는 TUI/full-screen app이 감지되면 **자동 비활성화**.

### 2.2 Overlay 비활성화 조건

아래 상황에서는 자동으로 **classic rendering fallback**:

| 조건 | 감지 방법 |
|------|-----------|
| Alternate screen entered | ESC `[?1049h` / `[?47h` |
| Interactive full-screen app | alt screen + continuous output burst |
| Mouse reporting enabled | ESC `[?1000h` / `[?1003h` |
| Bracketed paste sensitive mode | ESC `[?2004h` (이건 overlay만 부분 비활성화) |
| Unknown cursor control burst | 초당 cursor move > threshold |

**대상 앱 (자동 감지):**

```
vim, nvim, less, more, man, top, htop, tmux attach, fzf full-screen,
nano, emacs -nw, mc, ranger, tig
```

**Fallback 시 남는 것:**

- Raw terminal view (xterm.js 100%)
- Session tabs
- Top toolbar 최소 기능 (kill / resize / copy)
- Semantic decorations **OFF**

**Fallback 복귀:**

- Alt screen exit 감지 → overlay 자동 복원
- 수동 복귀: toolbar에서 mode 재활성화

### 2.3 Shell Marker 원칙

Shell integration marker (`__SEM_TERM_CMD_START__` 등)는 **best-effort**이다.

**원칙 A:** Marker가 없더라도 terminal은 정상 동작해야 함.

**원칙 B:** Marker 실패 시 fallback:

```
command tracking unavailable
  → raw terminal only
  → no block boundary
  → no semantic summary
  → terminal itself still works perfectly
```

Marker는 **UX 강화용**이지 terminal 필수 전제가 아니다.

---

## 3. 모드 전략

| 모드 | 목적 | 입력 | 출력 | Overlay |
|------|------|------|------|---------|
| **Classic** | 일반 터미널 완전 호환 | xterm raw prompt | continuous stream | 최소 (tabs + toolbar만) |
| **Hybrid** (기본 추천) | 호환성 + UX | xterm raw + 외부 suggest | block boundary + sidecar | command rail + sticky header + decorations |
| **Semantic** | Warp급 UX | editor-like input (옵션) | full block layout | header + summary + actions + rail |

```
classic  = shell-first
hybrid   = compatibility-first + UX
semantic = UX-first but still PTY-safe
```

**모드 전환:**
- Settings에서 기본 모드 설정
- `Cmd+Shift+M` (terminal focused)로 모드 전환
- 세션별로 다른 모드 가능

---

## 4. 렌더링 구조

### 4.1 2-Layer 분리 (핵심)

Raw viewport와 overlay를 **같은 DOM 트리에서 섞지 않는다**.

```
TerminalViewportShell
  ├─ RawViewportHost       ← xterm.js mount (z-0)
  └─ OverlayRoot           ← absolute positioned React layer (z-10)
```

**DOM 구조:**

```tsx
<div className="relative h-full w-full">
  {/* Layer A: Raw terminal — xterm.js 단독 책임 */}
  <div ref={rawViewportRef} className="absolute inset-0 z-0" />

  {/* Layer B: Semantic overlay — 읽기/탐색/액션 보조 */}
  <div className="absolute inset-0 z-10 pointer-events-none">
    <TerminalOverlayRoot />
  </div>
</div>
```

**필수 규칙:**

- Overlay 기본은 `pointer-events-none`
- 클릭 가능한 action/button/link만 개별적으로 `pointer-events-auto`
- Raw selection/cursor/paste **방해 금지**

### 4.2 Block Layout 계산

Block은 DOM line parsing이 아니라, **command event + terminal row anchor** 기반으로 계산:

```
command-started
  → start row anchor capture
  → output chunks append
command-ended
  → end row anchor capture
  → layout compute
```

`TerminalViewportRaw`가 row metrics를 `terminalViewportMetrics.ts`로 넘기고,
`terminalBlockLayout.ts`가 최종 block 영역을 계산.

---

## 5. 화면 레이아웃

```
┌─ TerminalToolbar ─────────────────────────────────────────────┐
│ session actions │ mode toggle │ search │ filter │ raw/parsed  │
├─ TerminalTabs ────────────────────────────────────────────────┤
│ [zsh]  [Agent Lint]  [Agent Test]                             │
├─ TerminalSplitLayout ────────────────────────────────────────┤
│ CommandRail │ TerminalViewportShell                           │
│             │  ├─ RawViewport (xterm.js)                     │
│             │  └─ OverlayRoot                                │
│             │      ├─ CommandBlockLayer                      │
│             │      ├─ StickyHeaderLayer                      │
│             │      └─ DecorationLayer                        │
├─ TerminalInputBar (optional, semantic mode only) ────────────┤
│ ~/project (main) $ ██                                         │
└───────────────────────────────────────────────────────────────┘
```

### 5.1 Command Rail

```
┌─ Commands ──┐
│ ✗ pnpm lint │
│ ✗ pnpm test │
│ ✓ pnpm test │
│ ● pnpm dev  │
└─────────────┘
```

| 기능 | 설명 |
|------|------|
| Jump to command | 클릭 시 해당 block으로 스크롤 |
| Failed only filter | failed block만 표시 |
| Running command follow | running block 자동 추적 |
| Current visible highlight | viewport에 보이는 block 강조 |

### 5.2 Sticky Header

긴 output에서 현재 block context 유지:

```
┌─ Running  pnpm test ─── /workspace/app ─── user ─── 12.4s ──┐
```

| 표시 | 설명 |
|------|------|
| Status | running / succeeded / failed |
| Command | 명령어 |
| cwd | 실행 디렉토리 |
| Source | user / agent |
| Duration | 경과 시간 |

---

## 6. Input UX

### 6.1 Classic Compatibility 우선

**기본 입력은 PTY prompt 그대로** 살아 있어야 한다.

Modern input editor는 아래 두 조건에서만 활성화:
1. User가 명시적으로 활성화했을 때
2. Current session이 raw-safe 상태일 때 (alt screen 아님)

| 모드 | 입력 방식 |
|------|-----------|
| Classic | xterm 내부 입력 (PTY prompt 100%) |
| Hybrid | xterm 내부 입력 + 외부 history suggest overlay |
| Semantic | editor-like input 허용 (opt-in) |

> Warp처럼 "입력을 완전히 갈아엎는" 게 아니라 **점진적으로** 간다.

---

## 7. 상태 모델 추가분

기존 RFC의 sessions, commands, parsed events, per-session UI state에 더해:

### 7.1 Compatibility State

```typescript
interface TerminalCompatibilityState {
  isAltScreen: boolean;
  isInteractiveFullscreen: boolean;
  isMouseCaptureEnabled: boolean;
  forceRawOnly: boolean;
  reason?: "alt-screen" | "fullscreen-tui" | "mouse-capture" | "unknown-control-sequence";
}
```

### 7.2 Overlay State

```typescript
interface TerminalOverlayState {
  mode: TerminalMode;
  overlayEnabled: boolean;
  stickyHeaderEnabled: boolean;
  commandRailVisible: boolean;
  miniMapVisible: boolean;
  rawParsedSplit: "raw" | "parsed" | "split";
}
```

### 7.3 Command Layout

```typescript
interface TerminalCommandLayout {
  commandId: string;
  startRow: number;
  endRow: number;
  headerTopPx: number;
  footerBottomPx: number;
  isFolded: boolean;
}
```

### 7.4 Viewport State

```typescript
interface TerminalViewportState {
  scrollTop: number;
  viewportHeight: number;
  scrollAtBottom: boolean;
  activeVisibleCommandId?: string;
}
```

### 7.5 Atoms

```typescript
export const terminalModeAtom = atomWithStorage<TerminalMode>("terminal-mode", "hybrid");
export const terminalCompatibilityAtom = atom<Map<string, TerminalCompatibilityState>>(new Map());
export const terminalOverlayStateAtom = atom<Map<string, TerminalOverlayState>>(new Map());
export const terminalViewportStateAtom = atom<Map<string, TerminalViewportState>>(new Map());
export const terminalCommandLayoutAtom = atom<Map<string, TerminalCommandLayout[]>>(new Map());
```

---

## 8. Tauri Event 추가분

기존 `terminal://output`, `terminal://command-started`, `terminal://command-ended`, `terminal://parsed-event`, `terminal://task-state`에 더해:

| Event | Payload | 설명 |
|-------|---------|------|
| `terminal://compatibility-state` | `CompatibilityStatePayload` | alt screen / TUI 감지 |
| `terminal://overlay-mode-changed` | `{ sessionId, mode, overlayEnabled }` | overlay 모드 변경 |
| `terminal://command-layout-invalidated` | `{ sessionId }` | block layout 재계산 필요 |

```typescript
interface CompatibilityStatePayload {
  sessionId: string;
  isAltScreen: boolean;
  isInteractiveFullscreen: boolean;
  forceRawOnly: boolean;
  reason?: string;
}
```

---

## 9. Rust 추가 모듈

기존 terminal runtime (001-architecture)에 4개 추가:

```
apps/desktop/src-tauri/src/terminal/
  ... (기존 모듈 전부 유지)

  terminal_mode_detector.rs      # 🆕 semantic overlay 가능 상태 판정
  alt_screen_detector.rs         # 🆕 alternate screen 진입/이탈 감지
  control_sequence_guard.rs      # 🆕 unknown/unsafe control burst → raw-only fallback
  terminal_capability_state.rs   # 🆕 프론트로 전송할 compatibility state 관리
```

### 9.1 AltScreenDetector

```rust
pub struct AltScreenDetector {
    in_alt_screen: bool,
}

impl AltScreenDetector {
    /// ANSI output을 스캔하여 alt screen 진입/이탈 감지
    pub fn scan(&mut self, data: &[u8]) -> Option<AltScreenEvent>;
}

pub enum AltScreenEvent {
    Entered,
    Exited,
}
```

### 9.2 TerminalModeDetector

```rust
pub struct TerminalModeDetector {
    alt_screen: AltScreenDetector,
    mouse_capture: bool,
    control_burst_count: u32,
}

impl TerminalModeDetector {
    /// 현재 세션이 overlay 가능한 상태인지 판정
    pub fn can_overlay(&self) -> bool;

    /// ANSI output 스캔 후 상태 갱신, 변경 시 event emit
    pub fn process(&mut self, data: &[u8]) -> Option<CompatibilityStateChanged>;
}
```

---

## 10. 최종 컴포넌트 구조

### 10.1 Frontend

```
src/features/terminal/
  model/
    terminalTypes.ts                  # 전체 TypeScript 타입
    terminalAtoms.ts                  # 세션, 커맨드, 파싱 이벤트 atoms
    terminalSelectors.ts              # 파생 selectors
    terminalActions.ts                # write atoms / action dispatchers
    terminalFamilies.ts               # atomFamily (per-session, per-command)
    terminalMode.ts                   # mode atom + mode 전환 로직
    terminalPolicies.ts               # approval/safety policy atoms

  lib/
    terminalEventBus.ts               # Tauri event listener 등록
    terminalBridge.ts                 # AgentTerminalBridge façade
    terminalSearch.ts                 # command search 로직
    terminalParserHints.ts            # 프론트 측 보조 파서 (URL, file:line)
    terminalViewportMetrics.ts        # xterm.js row metrics → layout 연결
    terminalBlockLayout.ts            # command event + row anchor → block 영역 계산
    terminalCompatibility.ts          # alt screen / TUI 감지 → overlay 비활성화
    terminalHotkeys.ts                # terminal 전용 단축키 등록

  ui/
    TerminalPanel.tsx                 # 최상위 컨테이너 (bottom panel / surface)
    TerminalToolbar.tsx               # mode toggle, search, filter, raw/parsed
    TerminalTabs.tsx                  # 세션 탭바 + agent badge
    TerminalSplitLayout.tsx           # command rail + viewport 2-column
    TerminalViewportShell.tsx         # raw + overlay 2-layer 호스트
    TerminalViewportRaw.tsx           # xterm.js mount (핵심 — PTY 단독 책임)
    TerminalOverlayRoot.tsx           # absolute layer, pointer-events-none
    TerminalCommandRail.tsx           # command outline (좌측 mini navigator)
    TerminalCommandBlockLayer.tsx     # block header/footer/fold overlay
    TerminalStickyHeaderLayer.tsx     # 현재 visible command sticky header
    TerminalDecorationLayer.tsx       # parsed event decorations (file link, error)
    TerminalSearchBar.tsx             # Cmd+K command search
    TerminalSessionStatus.tsx         # 세션 상태 표시 (statusbar 연동)
    TerminalMiniMap.tsx               # block 전체 미니맵 (optional)
    TerminalEmptyState.tsx            # 세션 없을 때

    command/
      TerminalCommandBlock.tsx        # 개별 block 컨테이너
      TerminalCommandHeader.tsx       # $ command + status + duration + source badge
      TerminalCommandMeta.tsx         # cwd, env, timestamp (hover/expanded)
      TerminalCommandSummary.tsx      # parser 결과 요약 (errors, test results)
      TerminalCommandActions.tsx      # rerun, copy, export, explain, attach
      TerminalCommandOutputPreview.tsx # 접힘 시 tail N줄 프리뷰
      TerminalCommandErrorList.tsx    # parsed diagnostics 목록

    input/
      TerminalInputBar.tsx            # input 영역 컨테이너 (semantic mode)
      TerminalInputEditor.tsx         # multi-line editor (CodeMirror extension)
      TerminalHistorySuggest.tsx      # 타이핑 중 history ghost text
      TerminalWorkflowPicker.tsx      # workflow template 선택/인자 입력

    overlays/
      ParsedEventOverlay.tsx          # inline file link, stack trace
      ProgressOverlay.tsx             # progress bar / busy indicator
      PortBindingOverlay.tsx          # localhost:xxxx 감지 → preview 연결
      AgentProvenanceOverlay.tsx      # [Agent] badge + "why ran this?"
      ApprovalOverlay.tsx             # dangerous command 승인 요청

    compat/
      TerminalClassicModeBanner.tsx   # "Classic mode — overlay disabled" 알림
      TerminalAltScreenShield.tsx     # alt screen 감지 → overlay 숨김
      TerminalRawOnlyNotice.tsx       # marker 없음 → "raw only" 표시
```

### 10.2 Rust (Tauri)

```
apps/desktop/src-tauri/src/terminal/
  mod.rs
  terminal_manager.rs                 # 세션 lifecycle 총괄
  terminal_session.rs                 # 세션별 PTY + 상태
  pty_host.rs                         # OS별 PTY (portable-pty)
  shell_profile.rs                    # OS별 shell 감지
  shell_integration.rs                # preexec/precmd hook 주입
  ansi_decoder.rs                     # styled fragment + normalized text
  command_tracker.rs                  # marker → command state
  output_parser.rs                    # parser trait + registry
  output_parsers/
    mod.rs
    typescript.rs                     # tsc, eslint
    jest.rs                           # jest, vitest
    cargo.rs                          # cargo build/test, rustc
    python.rs                         # pytest, traceback
    generic.rs                        # file:line, URL, port
  task_detector.rs                    # dev server, watch, progress
  policy_guard.rs                     # dangerous command 차단/승인
  terminal_events.rs                  # Tauri event emit
  terminal_types.rs                   # Rust DTO

  # 🆕 호환성 모듈
  terminal_mode_detector.rs           # overlay 가능 상태 판정
  alt_screen_detector.rs              # alternate screen 진입/이탈
  control_sequence_guard.rs           # unknown burst → raw-only fallback
  terminal_capability_state.rs        # compatibility state → 프론트 전송
```

---

## 11. 컴포넌트 책임 상세

### 11.1 TerminalPanel.tsx

최상위 컨테이너.

| 책임 | 설명 |
|------|------|
| Active session 결정 | `activeTerminalSessionAtom` |
| Toolbar/tabs/viewport/overlay 배치 | 레이아웃 조합 |
| Classic/hybrid/semantic mode 스위치 | `terminalModeAtom` 기반 |
| Bottom panel / surface embedding | 어디에 렌더되든 동일하게 동작 |

### 11.2 TerminalViewportRaw.tsx

**가장 중요한 컴포넌트.**

| 책임 | 설명 |
|------|------|
| xterm.js mount | Terminal instance 생성/파괴 |
| Raw input/output | PTY stream 연결 |
| Cursor/selection/IME | xterm.js 기본 기능 |
| Copy/paste | 기본 동작 보존 |
| Resize observer | container 크기 변경 → PTY resize |
| Alt-screen 대응 | compatibility state 갱신 |
| Row metrics 제공 | block layout 계산용 |

> 이 컴포넌트는 **절대 semantic UI 책임을 가지면 안 됨**.

### 11.3 TerminalOverlayRoot.tsx

Viewport 위 absolute layer.

| 책임 | 설명 |
|------|------|
| Command block 위치 계산 | viewport metrics 기반 |
| Parsed decorations 표시 | file link, error highlight |
| Sticky header | 현재 visible block header |
| Block actions | rerun, copy, share |
| Agent provenance badge | `[Agent]` 표시 |
| **pointer-events-none 기본** | raw terminal 방해 금지 |

### 11.4 TerminalCommandRail.tsx

| 책임 | 설명 |
|------|------|
| Command outline | 전체 block 목록 |
| Failed/running jump | 상태별 필터 점프 |
| Status icon | `✓` `✗` `●` `⊘` |
| Current visible highlight | viewport 연동 |

### 11.5 TerminalInputEditor.tsx

| 책임 | 설명 |
|------|------|
| Multi-line command edit | `Shift+Enter` 줄바꿈 |
| Shell syntax highlight | CodeMirror extension |
| History suggestion | ghost text |
| Workflow/snippet insert | template 적용 |

**주의:** Classic mode에서는 아예 렌더하지 않음.

---

## 12. 검색 / 필터 / 폴드

### 12.1 Toolbar 구성

```
┌─ Toolbar ────────────────────────────────────────────────┐
│ [🔍 Search] │ Source: [All ▾] │ Status: [All ▾] │       │
│             │ user/agent/task │ running/failed/  │       │
│             │                 │ succeeded        │       │
│ [☐ Errors only] │ View: [Raw ▾ / Semantic / Split]     │
└──────────────────────────────────────────────────────────┘
```

### 12.2 폴드 단위

폴드는 **반드시 command 단위**로 고정.
개별 line 폴드는 하지 않음.

---

## 13. 안전 / 정책 UI

차단 로직은 **프론트에 두면 안 됨**. Rust side `PolicyGuard`가 판정.

프론트에서 할 일은 딱 2개:

| 역할 | 컴포넌트 |
|------|----------|
| 실행 전 approval UI | `ApprovalOverlay.tsx` |
| 실행 후 provenance/decision 표시 | `AgentProvenanceOverlay.tsx` |

---

## 14. 구현 순서

### Phase A — 호환성 잠금

> 이 단계가 끝나야 **terminal이라고 부를 수 있음**.

| 작업 | 산출물 |
|------|--------|
| `TerminalViewportRaw.tsx` 완성 | xterm.js PTY 연결 |
| Alt-screen / fullscreen detection | `alt_screen_detector.rs`, `terminalCompatibility.ts` |
| Raw-only fallback | `TerminalAltScreenShield.tsx` |
| Selection / copy / paste / IME / resize 검증 | 호환성 테스트 |
| vim / less / top / tmux 호환 테스트 | QA 체크리스트 |
| Session tabs + kill / resize | `TerminalTabs.tsx` |

### Phase B — Hybrid UX

| 작업 | 산출물 |
|------|--------|
| `TerminalOverlayRoot.tsx` | overlay layer |
| `TerminalCommandBlockLayer.tsx` | block header / footer / fold |
| `TerminalStickyHeaderLayer.tsx` | sticky header |
| `TerminalCommandRail.tsx` | command outline |
| Search / filter / fold | toolbar + search bar |
| Parsed decorations | file link, error highlight |
| Block actions | rerun, copy, export |

### Phase C — Warp-Level Polish

| 작업 | 산출물 |
|------|--------|
| Sticky header polish | duration, status animation |
| Progress overlay | progress bar, busy indicator |
| Command summary footer | errors / test results / port |
| Command export / share | markdown / JSON |
| Workflow / snippet picker | template 선택 + 인자 입력 |
| Semantic mode + input editor | `TerminalInputEditor.tsx` |
| AI completion ghost text | `TerminalHistorySuggest.tsx` |

---

## 15. QA 호환성 체크리스트

| 테스트 | 기대 결과 |
|--------|-----------|
| `vim file.txt` → 편집 → `:wq` | overlay 자동 비활성화 → 복귀 |
| `less output.log` → 스크롤 → `q` | alt screen 정상 동작 |
| `top` → resize → `q` | resize 정상, overlay 자동 복귀 |
| `tmux attach` → detach | 세션 정상 유지 |
| `fzf` → 선택 | mouse capture 정상 |
| 한글 입력 (IME) | 조합 중 커서 정상 |
| `Cmd+C` / `Cmd+V` | 복사/붙여넣기 정상 |
| 텍스트 드래그 선택 | overlay가 selection 방해 안 함 |
| `Ctrl+Z` (job control) | 프로세스 suspend 정상 |
| Shell marker 없는 환경 | raw terminal only, 기능 정상 |

---

## 관련 문서

- [000-overview.md](./000-overview.md) — 제품 정의 & 전체 기능 스펙
- [001-architecture.md](./001-architecture.md) — Tauri 구현 아키텍처 (PTY, parser, IPC)
- [003-agent-terminal-bridge.md](./003-agent-terminal-bridge.md) — Agent Bridge + Command Card + Activity Bar
- [004-warp-level-ux.md](./004-warp-level-ux.md) — Warp-Level UX (Block, Input Editor, Search, Workflow)
