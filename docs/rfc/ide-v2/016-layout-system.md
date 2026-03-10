# RFC-016: Layout System Architecture (v2)

| Field      | Value                                               |
|------------|-----------------------------------------------------|
| ID         | RFC-016-LAYOUT-SYSTEM                               |
| Status     | **Implemented v3** (Phase 1–7 complete)              |
| Date       | 2026-03-10                                          |
| Owner      | Semantica DevOS Platform                            |
| Parent     | RFC-015-V2 Monorepo Structure                       |
| Depends On | RFC-012 Platform Constitution, RFC-015 Monorepo     |
| Scope      | UI 레이아웃 타입 정의, View 시스템, 컴포넌트 계층, z-order, 네이밍 규약 |

---

## 1. Summary

이 문서는 Semantica IDE의 **전체 UI 시스템 아키텍처**를 정의한다.

화면에 존재하는 모든 UI 요소를 **Layout Type → Frame → View → Primitive** 4계층으로 분류하고,
각 계층의 역할·네이밍·상호작용·z-order·접근성 규약을 정한다.

### 설계 원칙

| 원칙 | 설명 |
|------|------|
| **Content-agnostic Frames** | Frame(컨테이너)은 View(콘텐츠)에 대해 아무것도 모른다. Registry를 통해서만 연결한다 |
| **View portability** | Panel View는 여러 Frame에 배치될 수 있다. Surface View는 Canvas 전용이다. Non-View UI(Overlay, Transient)는 Frame/Registry 바깥에서 독립 동작한다 (§1.1) |
| **Single source of truth** | 모든 View와 Frame은 각각 하나의 Registry에 등록된다. 중복 정의 없음 |
| **Progressive disclosure** | 레이아웃은 단순한 기본값에서 시작해서 유저가 점진적으로 커스터마이징한다 |
| **Platform adaptive** | 같은 Layout Type이라도 VSCode webview / Tauri desktop / 모바일에서 다르게 렌더될 수 있다 |
| **External state for portability** | View의 장수명 상태는 항상 외부 store(Jotai atom)에 둔다. DOM reparenting 불가를 전제한다 (§7.2) |

### 1.1 View Taxonomy

View portability 원칙을 정확히 적용하려면 세 가지 범주를 구분해야 한다:

| 범주 | ViewKind | Frame 이동 | Registry | 예시 |
|------|----------|-----------|----------|------|
| **Panel View** | `"panel"` | Dock ↔ Tray ↔ Floating | `ViewRegistry` | ExplorerView, TerminalView, ProblemsView |
| **Surface View** | `"surface"` | Canvas 전용 (이동 불가) | `SurfaceRegistry` | ChatView, EditorView, ReviewView |
| **Non-View UI** | — | Frame 밖 (포탈/인라인) | 등록 안 함 | Dialog, Toast, Tooltip, Peek |

- **Panel View**는 `ViewDefinition.frames` 배열에 명시된 Frame 사이를 자유롭게 이동한다.
- **Surface View**는 Canvas의 keep-alive 라우터 안에서만 존재하며, Dock이나 Floating에 배치할 수 없다.
- **Non-View UI**는 Overlay·Transient·Inline 타입의 요소로, Registry에 등록되지 않고 자체 생명주기를 가진다.

```typescript
type ViewKind = "panel" | "surface";

interface ViewDefinition {
  readonly kind: ViewKind;
  // ...이하 §4.1 참조
}
```

### 레퍼런스

| 제품 | 참고 포인트 |
|------|-----------|
| **VSCode** | 6-zone shell, Activity Bar, Panel, Editor Group, Peek, inline chat |
| **Zed** | 아무 View든 아무 Dock에 드래그 배치, GPU 렌더링 |
| **JetBrains Fleet** | Tool Window 시스템, floating detach |
| **Figma** | Floating 팔레트, 캔버스, 인라인 편집, 컴포넌트 패널 |
| **Framer** | Left/Right 패널, Canvas, Properties Inspector |
| **Linear** | Command palette, 모달 시트, hover card |
| **Arc Browser** | Command Bar, Space, Little Arc (mini floating) |
| **Raycast** | 전체가 Overlay Palette — 극도로 세련된 키보드 UX |
| **macOS** | 윈도우 매니저, Menu Bar, Notification Center, Sheet, HUD |
| **iPadOS** | Stage Manager, Slide Over, Split View |

---

## 2. Layout Type Taxonomy

화면에 존재하는 모든 UI를 **8가지 Layout Type**으로 분류한다.

```
 ┌─ 1 CHROME ──────────────────────────────────────────────────────────┐
 │  Title Bar · Tab Bar · Breadcrumb · Status Bar                      │
 ├──────────┬──────────────────────────────────────┬───────────────────┤
 │2 DOCK    │  3 CANVAS                            │  2 DOCK           │
 │ left     │  메인 작업 영역                       │  right            │
 │          │  (에디터·채팅·캔버스·그래프)            │                   │
 │          ├──────────────────────────────────────┤                   │
 │          │  4 TRAY                              │                   │
 │          │  보조 패널 (터미널·문제·출력)           │                   │
 ├──────────┴──────────────────────────────────────┴───────────────────┤
 │  1 CHROME (Status Bar)                                              │
 └─────────────────────────────────────────────────────────────────────┘

 ┌─ 5 FLOATING WM ─────┐    z-layer: floating    ← Window Manager 서브시스템
 │  자유 윈도우           │
 └─────────────────────┘

 ┌─ 6 OVERLAY ──────────────────────────┐    z-layer: modal
 │  Modal · Dialog · Drawer · Sheet     │
 │  Palette · Lightbox                  │
 └──────────────────────────────────────┘

 ┌─ 7 TRANSIENT ────────────────────────┐    z-layer: tooltip/toast
 │  Tooltip · Toast · Popover           │
 │  Context Menu · HoverCard · Dropdown │
 └──────────────────────────────────────┘

 ┌─ 8 INLINE ──────────────────────────┐     z-layer: none (flow 내)
 │  Peek · Inline Diff · Inline Chat   │
 │  Cell Output · Inline Rename         │
 └─────────────────────────────────────┘
```

---

### 2.1 Chrome

**앱의 구조적 뼈대. 콘텐츠가 아닌 "프레임 자체".**

| 속성 | 값 |
|------|------|
| 위치 | top edge, bottom edge (고정) |
| 이동 | 불가 |
| 리사이즈 | 불가 |
| 콘텐츠 교체 | 불가 (상태 표시만) |
| 숨김 | Focus Mode에서 TitleBar 숨김 / Zen Mode에서 전부 숨김 |
| z-layer | `--z-base` (0) |

#### Chrome 요소 목록

| 이름 | 위치 | 역할 |
|------|------|------|
| **TitleBar** | top | 앱 아이콘, Surface 탭, 검색, 레이아웃 토글, 설정. macOS traffic lights / Tauri 드래그 영역 |
| **StatusBar** | bottom | 현재 Surface, Git branch, Layout Presets, Split 토글, 알림, Focus 토글 |
| **Breadcrumb** | top (TitleBar 아래, 선택적) | 현재 파일 경로, 심볼 네비게이션 (에디터 Surface 전용) |

#### Chrome의 규약

- Chrome은 **항상 렌더**된다 (Focus Mode에서 TitleBar만 숨김, StatusBar는 유지)
- Zen Mode에서는 Chrome 전체 숨김 (§7.3 참조)
- Chrome 안에 View를 배치하지 않는다
- Chrome은 앱 전체 컨텍스트(Surface, branch, mode)를 표시한다
- Tauri에서는 TitleBar가 OS 타이틀바 역할을 겸한다 (`-webkit-app-region: drag`)

---

### 2.2 Dock

**edge에 고정된 패널 컨테이너. 탭으로 View 전환. 접기/펼치기/리사이즈.**

| 속성 | 값 |
|------|------|
| 위치 | left, right (고정 edge) |
| 이동 | 불가 (edge 변경은 설정으로) |
| 리사이즈 | 한 축 (폭만) |
| 콘텐츠 교체 | **탭으로 View 전환** |
| 숨김 | 토글 (collapse), Focus Mode에서 자동 |
| z-layer | `--z-base` (0) |
| View 개수 | 다수 (탭 그룹) |

#### Dock 인스턴스

| 이름 | edge | 기본 폭 | 범위 | Activity Bar |
|------|------|---------|------|-------------|
| **SidebarDock** | left | 240px | 160–480px | 있음 (아이콘 스트립 40px) |
| **AgentDock** | right | 420px | 300–700px | 없음 (단일 콘텐츠) |

#### Activity Bar

SidebarDock 전용. 세로 아이콘 스트립으로 View 전환.

| 속성 | 값 |
|------|------|
| 폭 | 40px (고정) |
| 아이콘 | View의 `icon` 필드에서 가져옴 |
| 활성 표시 | 좌측 2px accent 바 |
| 배치 | SidebarDock 왼쪽 |

#### Dock의 규약

- Dock은 `ViewRegistry`에서 `kind: "panel"` && `frames` 에 `"dock-left"` 또는 `"dock-right"`인 View를 가져온다
- View는 Dock 안에서 `Suspense + lazy()`로 로딩된다
- 접힌 상태에서도 Activity Bar는 선택적으로 보일 수 있다 (VSCode 스타일)
- View를 Dock에서 **Floating으로 떼어내기 (detach)** 가능 (`detachable: true`인 View만)

---

### 2.3 Canvas

**메인 작업 영역. 유저가 직접 작업하는 핵심 공간.**

| 속성 | 값 |
|------|------|
| 위치 | center (Dock 사이) |
| 이동 | 불가 |
| 리사이즈 | Dock/Tray가 리사이즈되면 자동 조정 |
| 콘텐츠 교체 | **Surface 라우팅** (keep-alive) |
| 숨김 | 불가 (항상 존재) |
| z-layer | `--z-base` (0) |
| 분할 | 수직/수평 Split View |

#### Canvas의 구성

```
┌─ Canvas ─────────────────────────────────────────┐
│ ┌─ Surface A (active) ─┐ ┌─ Surface B (split) ─┐ │
│ │                      │ │                     │ │
│ │  ChatView            │ │  EditorView         │ │
│ │  EditorView          │ │  ReviewView         │ │
│ │  GraphView           │ │  ...                │ │
│ │  ...                 │ │                     │ │
│ └──────────────────────┘ └─────────────────────┘ │
└──────────────────────────────────────────────────┘
```

#### Surface

Canvas 안에서 라우팅되는 최상위 View 단위. `ViewKind = "surface"`.

| 속성 | 값 |
|------|------|
| 전환 | TitleBar의 Surface 탭 클릭, 키보드 단축키, Intent 라우팅 |
| keep-alive | 방문한 Surface는 `display:none`으로 유지 (상태 보존) |
| 분할 | primary + secondary Surface 동시 표시 |
| 등록 | `SurfaceRegistry`에 등록 |

#### Canvas의 규약

- Canvas는 항상 최소 1개의 Surface를 표시한다
- Surface는 Canvas 전용이다 (Dock, Floating에 배치 불가) — `ViewKind = "surface"`
- Surface 간 전환은 `activeSurfaceAtom`으로 관리
- Split View는 `splitDirectionAtom` + `secondarySurfaceAtom`으로 관리
- 각 Surface는 내부적으로 자체 라우팅(페이지/탭)을 가질 수 있다

---

### 2.4 Tray

**Canvas 하단에 종속된 보조 패널. 탭으로 View 전환. Canvas와 높이를 나눔.**

| 속성 | 값 |
|------|------|
| 위치 | Canvas 하단 (Canvas에 종속) |
| 이동 | 불가 |
| 리사이즈 | 한 축 (높이만, 100–500px) |
| 콘텐츠 교체 | **탭으로 View 전환** |
| 숨김 | 토글, Focus Mode에서 자동 |
| z-layer | `--z-base` (0) |
| 최대화 | 가능 (`calc(100vh - 80px)`) |
| View 개수 | 다수 (탭, 동시 마운트) |

#### Tray vs Dock 차이

| | Dock | Tray |
|---|------|------|
| 종속 | ShellLayout 직속 | Canvas에 종속 |
| 축 | 세로 (좌우 edge) | 가로 (하단) |
| Canvas 관계 | 독립 (Canvas 옆) | 종속 (Canvas 높이를 나눔) |
| 최대화 | 불가 | 가능 (Canvas를 덮음) |

#### Tray의 규약

- Tray는 Canvas 영역 안에서 높이를 나눈다 (Dock과 독립)
- 모든 탭의 View는 **동시 마운트** (`display:none`으로 숨김) — 스크롤/상태 유지
- 같은 탭 재클릭 시 최대화 토글
- View를 Tray에서 Floating으로 떼어내기 가능 (`detachable: true`인 View만)

---

### 2.5 Floating (Window Manager Subsystem)

**자유 배치 윈도우. macOS 윈도우 매니저 스타일의 독립 서브시스템.**

Floating은 단순 Layout Type이 아니라 **Window Manager(WM) 서브시스템**으로 설계한다.
Dock/Tray는 고정 슬롯에 View를 보여주지만, Floating WM은 윈도우 생명주기·z-stack·스냅·최소화를 직접 관리한다.

| 속성 | 값 |
|------|------|
| 위치 | 자유 (x, y 좌표) |
| 이동 | 드래그 |
| 리사이즈 | 자유 (8방향) |
| 콘텐츠 교체 | 1:1 (윈도우당 1 View) |
| 숨김 | 최소화 → Floating Dock |
| z-layer | `--z-floating` (15, 가변) |
| 스냅 | edge 스냅 (좌/우/상 반분할) |
| 최대화 | 가능 |
| 다수 공존 | 가능 (z-stack으로 관리) |

#### Floating WM 책임

| 책임 | 설명 |
|------|------|
| **Window Lifecycle** | create → move/resize → minimize → restore → close |
| **Z-Stack Management** | 클릭 시 bring-to-front, z-order 재계산 |
| **Snap Engine** | edge 근접 시 반분할 미리보기, 스냅 |
| **Minimize Dock** | 최소화된 윈도우를 아이콘 바로 관리 |
| **Window Grouping** | 탭 그룹 (미래 기능) |

#### Floating 생명주기

```
Dock/Tray의 View
    │
    ▼  detach (ViewDefinition.detachable === true)
┌─ Floating Window ─────────┐
│  [Title] [_][□][📌][✕]    │  ← 최소화, 최대화, 도킹복귀, 닫기
│  ┌─────────────────┐      │
│  │   View 콘텐츠    │      │  ← unmount → remount (§7.2 state contract)
│  └─────────────────┘      │
└───────────────────────────┘
    │
    ▼  attach (📌)
Dock/Tray로 복귀 (unmount → remount)
```

#### Floating Dock (최소화 바)

```
┌──────────────────────────────────────────────────────┐
│  화면 하단 중앙                                       │
│  ┌──────┐ ┌──────┐ ┌──────┐                          │
│  │ >_ T │ │ ⚠ P │ │ 📄 O │  ← 최소화된 윈도우 아이콘  │
│  └──────┘ └──────┘ └──────┘                          │
└──────────────────────────────────────────────────────┘
```

#### Floating의 규약

- Floating은 `floatingWindowMapAtom`으로 관리 (§6.2)
- 각 윈도우는 독립적 z-order를 가짐 (클릭 시 bring-to-front)
- 최소화 시 Floating Dock에 아이콘으로 표시
- 스냅: 드래그 중 edge 근접 시 반분할 미리보기, 놓으면 스냅
- Floating 윈도우끼리 탭 그룹으로 묶기 (미래 기능)
- Detach/attach 시 DOM reparenting 아님 — unmount → remount (§7.2)

---

### 2.6 Overlay

**화면 위에 뜨는 모달 계열. 배경을 차단하고 포커스를 독점.**

| 속성 | 값 |
|------|------|
| 위치 | 중앙 또는 edge (variant에 따라) |
| 이동 | 불가 |
| 리사이즈 | 불가 (프리셋 크기) |
| 배경 차단 | **있음** (backdrop + blur) |
| 포커스 트랩 | **있음** |
| 스크롤 락 | **있음** (body) |
| ESC 닫기 | **있음** (스택 최상위만 반응) |
| z-layer | `--z-modal` (30) |
| 스택 | LIFO (여러 Overlay 중첩 가능) |

#### Overlay Variants

| Variant | 위치 | 크기 | 진입 애니메이션 | 레퍼런스 |
|---------|------|------|----------------|---------|
| **Modal** | 중앙 | sm/md/lg/xl | fade + scale | VSCode Settings, Figma Export |
| **Dialog** | 중앙 | sm/md | fade + scale | Alert, Confirm, Prompt |
| **Drawer** | left/right edge | 고정 폭 (320–640px) | slide-in | Figma right panel, Linear filter |
| **Sheet** | bottom edge | 40vh/75vh | slide-up | iOS 공유시트, 모바일 액션 |
| **Palette** | top 중앙 | 고정 폭 | fade + slide-down | VSCode ⌘P, Raycast, Arc ⌘T |
| **Lightbox** | 전체화면 | 100% | fade | 이미지 뷰어, Diff 전체화면 |

#### Overlay vs Transient: 행동 계층과 의미 계층

Overlay와 Transient는 구현 레벨에서 공유하는 부분이 많다 (포탈, 포지셔닝, ESC 처리).
그러나 **의미 계층(semantic layer)**에서 명확히 구분한다:

| 축 | Overlay | Transient |
|----|---------|-----------|
| **의도** | 유저 결정을 요구 (차단) | 보조 정보 제공 (비차단) |
| **배경 차단** | ✓ (backdrop) | ✗ |
| **포커스 트랩** | ✓ | ✗ |
| **스크롤 락** | ✓ | ✗ |
| **스택 관리** | `useOverlayStack` LIFO | 독립 (스택 없음) |
| **공유 구현** | `OverlayPortal`, `useFloatingPosition` | `OverlayPortal`, `useFloatingPosition` |

구현 시 `useOverlayBehavior` 훅이 두 계층의 교차점:
- Overlay variant → `focusTrap: true, scrollLock: true, backdrop: true`
- Transient variant → `focusTrap: false, scrollLock: false, backdrop: false`

#### Overlay Stack

```typescript
// LIFO 스택. ESC는 최상위만 닫는다.
// 예: Modal 위에 Dialog → ESC → Dialog 닫힘 → ESC → Modal 닫힘

overlayStack: [
  { id: "settings-modal", type: "modal" },
  { id: "confirm-dialog", type: "dialog" },  // ← top, ESC가 이것만 닫음
]
```

#### Overlay의 규약

- 모든 Overlay는 `OverlayPortal`을 통해 `document.body`에 렌더
- `useOverlayBehavior` 훅으로 ESC/click-outside/focus-trap/scroll-lock 일괄 처리
- `useOverlayStack`으로 LIFO 스택 등록 — 최상위만 ESC에 반응
- Overlay는 View를 담지 않는다 (자체 콘텐츠를 가짐) — Non-View UI
- Sheet variant는 swipe-to-dismiss 지원

---

### 2.7 Transient

**일시적으로 나타났다 사라지는 비차단 UI.**

| 속성 | 값 |
|------|------|
| 위치 | 트리거 기준 (anchor) 또는 고정 (toast) |
| 이동 | 불가 |
| 배경 차단 | **없음** |
| 포커스 트랩 | **없음** |
| 지속 | 일시적 (hover 동안, 자동 소멸, 명시적 닫기) |
| z-layer | `--z-tooltip` (35) / `--z-toast` (40) |

#### Transient Variants

| Variant | 트리거 | 지속 시간 | 인터랙션 | 위치 | z |
|---------|--------|----------|----------|------|---|
| **Tooltip** | hover, focus | hover 동안 | 읽기만 | anchor 기준, auto-flip | tooltip (35) |
| **Toast** | 이벤트 | 자동 소멸 (4s) | dismiss만 | 고정 (top-right) | toast (40) |
| **Popover** | click | 명시적 닫기 | **인터랙티브** | anchor 기준, auto-flip | overlay (20) |
| **ContextMenu** | right-click | 선택 시 닫힘 | 메뉴 선택 | 커서 위치 | modal (30) |
| **HoverCard** | hover | hover 동안 | **인터랙티브** | anchor 기준, pointer bridge | overlay (20) |
| **Dropdown** | click | 선택 시 닫힘 | 메뉴 선택 | anchor 기준 | overlay (20) |

#### 포지셔닝 엔진

모든 anchor-based Transient는 공유 포지셔닝 엔진을 사용:

```
1. computePlacement(anchor, floating, placement, align)
   → 기본 위치 계산

2. flipStrategy(position, floating, viewport)
   → 공간 부족 시 반대편으로 flip

3. shiftStrategy(position, floating, viewport)
   → cross-axis 방향 viewport 클램핑

4. useFloatingPosition() 훅이 1-2-3을 통합
   → scroll/resize 시 자동 재계산
```

#### Transient의 규약

- Tooltip: `role="tooltip"`, 순수 텍스트, pointer-events-none
- Toast: `role="status" aria-live="polite"`, 최대 5개 스택, FIFO 소멸
- Popover: `role="dialog" aria-modal="false"`, click-outside로 닫힘
- ContextMenu: keyboard navigation (↑↓), sub-menu 지원
- HoverCard: **pointer bridge** — 트리거와 카드 사이 gap에서도 닫히지 않음

---

### 2.8 Inline

**콘텐츠 흐름 안에 삽입되는 확장 UI. z-layer 없이 document flow에 참여.**

| 속성 | 값 |
|------|------|
| 위치 | 콘텐츠 흐름 내 (특정 줄, 블록 아래/위) |
| 이동 | 불가 |
| 리사이즈 | 불가 (콘텐츠에 맞춤) |
| z-layer | 없음 (document flow) |
| 배경 차단 | **없음** |
| 접기/펼치기 | 있음 |

#### Inline Variants

| Variant | 위치 | 레퍼런스 |
|---------|------|---------|
| **Peek** | 에디터 줄 아래 | VSCode "Peek Definition" — 인라인 미니 에디터 |
| **InlineDiff** | 에디터 줄 | Cursor inline diff — 삭제/추가 하이라이트 |
| **InlineChat** | 에디터 줄 아래 | Cursor ⌘K — 인라인 AI 입력 + 결과 |
| **CellOutput** | 코드 블록 아래 | Jupyter cell output, REPL 결과 |
| **InlineRename** | 텍스트 위 | Figma 더블클릭 rename, VSCode F2 |
| **InlineAnnotation** | 줄 옆 (gutter/margin) | Git blame, CodeLens, 에러 인라인 표시 |

#### Inline의 규약

- Inline은 **Canvas/Surface 내부에서만** 사용
- Document flow를 밀어냄 (위아래 콘텐츠가 이동)
- 닫기: ESC 또는 명시적 닫기 버튼
- Inline은 Registry에 등록하지 않음 — Surface 내부 구현 (Non-View UI)

---

## 3. Component Hierarchy

전체 UI 컴포넌트를 **5계층**으로 구분한다.

```
Layer 4 ─ Frame        ShellLayout, SidebarFrame, TrayFrame, FloatingFrame, ...
Layer 3 ─ View         ExplorerView, TerminalView, ChatView, ...
Layer 2 ─ Composite    CommandPalette, ContextMenu, ActionBar, AgentCard, ...
Layer 1 ─ Primitive    Button, Icon, Badge, Text, Spinner, Tabs, ...
Layer 0 ─ Token        color, spacing, radius, shadow, z-index, animation
```

### 3.1 Layer 0: Token

디자인 토큰. CSS 변수로 정의.

```css
/* Color */
--color-vsc-bg, --color-vsc-fg, --color-vsc-accent, ...

/* Spacing */
--space-xs (4px), --space-sm (8px), --space-md (12px), ...

/* Size */
--height-row-xs (20px), --height-row-sm (24px), --height-row-md (28px), ...

/* Radius */
--radius-sm (2px), --radius-md (4px), --radius-lg (6px), ...

/* Shadow */
--shadow-sm, --shadow-md, --shadow-lg, --shadow-sheet, --shadow-panel, --shadow-modal

/* Z-Index */
--z-base (0), --z-sticky (10), --z-floating (15), --z-overlay (20),
--z-modal (30), --z-tooltip (35), --z-toast (40)

/* Animation */
--ease-spring, --duration-fast (100ms), --duration-normal (200ms), --duration-slow (300ms)
```

### 3.2 Layer 1: Primitive

최소 단위 UI 컴포넌트. **도메인 무관. 재사용 극대화.**

| 카테고리 | 컴포넌트 |
|---------|---------|
| **Display** | `Text`, `Icon`, `Badge`, `Kbd`, `Separator`, `Spinner`, `Skeleton`, `StatusDot`, `StreamingCursor` |
| **Input** | `Button`, `Input`, `Checkbox`, `RadioGroup`, `Select`, `SegmentedControl`, `ToolbarButton` |
| **Feedback** | `ProgressBar`, `BarChart`, `ExitCodeBadge`, `ProvenanceBadge`, `DurationLabel` |
| **Layout** | `Accordion`, `Collapsible`, `Tabs`, `Breadcrumbs`, `Pagination`, `FormField` |
| **Overlay primitive** | `OverlayPortal`, `ModalOverlay`, `Dialog`, `AlertDialog`, `ConfirmDialog`, `SlideDrawer`, `BottomSheet`, `Popover`, `Tooltip`, `Toast`, `HoverCard`, `FeaturePanel` |
| **Code** | `CodeBlockActions`, `HighlightedText` |

#### Primitive 규약

- props만으로 동작 (atom/context 의존 최소화)
- `className` prop으로 스타일 확장 허용
- `React.memo` + `forwardRef` 기본
- 접근성: ARIA role/label 필수
- 테스트: 각 primitive는 단위 테스트 필수

### 3.3 Layer 2: Composite

Primitive를 조합한 복합 컴포넌트. **도메인 약간 포함 가능.**

| 카테고리 | 컴포넌트 |
|---------|---------|
| **Menu** | `CommandPalette`, `ContextMenu`, `DropdownMenu` |
| **Card** | `AgentCard`, `ListRow`, `EmptyState` |
| **Bar** | `ActionBar`, `StatusLine`, `IconLabel` |
| **Timeline** | `StepTimeline` |
| **Panel helper** | `LazyPanel` (Suspense + lazy wrapper) |

### 3.4 Layer 3: View

**Frame에 배치되는 독립적 기능 UI. 핵심 콘텐츠.**

View는 `ViewRegistry` 또는 `SurfaceRegistry`에 등록되며, `kind`에 따라 배치 가능 범위가 결정된다.

#### Panel Views (`kind: "panel"`)

| View | 기본 Frame | 가능한 Frame | 설명 |
|------|-----------|-------------|------|
| **ExplorerView** | dock-left | dock-left, floating | 파일 트리, 가상 스크롤, 컨텍스트 메뉴 |
| **SearchView** | dock-left | dock-left, floating | 전역 파일 검색, regex/case/glob 필터 |
| **SymbolsView** | dock-left | dock-left, floating | 심볼 아웃라인, 종류별 그룹핑 |
| **FindingsView** | dock-left | dock-left, floating | 린트/분석 결과, severity 필터 |
| **ProblemsView** | tray | tray, floating | LSP 진단, severity 필터, 파일별 그룹 |
| **OutputView** | tray | tray, floating | 빌드/LSP 로그, 채널 필터, 가상 스크롤 |
| **EventLogView** | tray | tray, floating | Agent 이벤트, 카테고리 필터 |
| **TerminalView** | tray | dock-left, tray, floating | xterm.js, 세션, AI ghost text, block nav |
| **AgentChatView** | dock-right | dock-right, floating | AI Agent 채팅 (AgentDock 전용) |
| **RootCauseView** | floating | floating, tray | 원인 분석 시각화 |
| **DataflowView** | floating | floating, tray | 데이터플로우 분석 |

#### Surface Views (`kind: "surface"`)

| View | 설명 |
|------|------|
| **ChatView** | 대화 UI, 메시지 리스트, 프롬프트 |
| **EditorView** | CodeMirror 에디터 |
| **ReviewView** | 코드 리뷰 diff |
| **GraphView** | 의존성/콜 그래프 시각화 |
| **ReasoningView** | AI 추론 과정 표시 |
| **ReplayView** | 세션 리플레이 |
| **AgentView** | Agent 오케스트레이션 |
| **OverviewView** | 프로젝트 오버뷰 |

#### View 규약

- View는 Frame에 대해 **아무것도 모른다** — 자기 크기를 모름
- `width: 100%, height: 100%`로 부모(Frame)를 채움
- View는 atom을 직접 사용 가능 (Primitive와 다름)
- View는 `ViewRegistry`(panel) 또는 `SurfaceRegistry`(surface)에 등록 필수
- View의 장수명 상태는 반드시 **외부 store(Jotai atom)**에 둔다 — detach/attach 시 unmount/remount되므로

### 3.5 Layer 4: Frame

**View를 담는 컨테이너. 크롬/탭/리사이즈 등 "틀" 기능.**

| Frame | Layout Type | Frame ID | 역할 |
|-------|-------------|----------|------|
| **ShellLayout** | — | `"shell"` | 6-zone 마스터 레이아웃 |
| **TitleBar** | chrome | `"chrome-title"` | 상단 타이틀/탭/검색 |
| **StatusBar** | chrome | `"chrome-status"` | 하단 상태/프리셋/토글 |
| **SidebarFrame** | dock | `"dock-left"` | 좌측 Activity Bar + View 슬롯 |
| **AgentFrame** | dock | `"dock-right"` | 우측 AI 패널 + View 슬롯 |
| **SurfaceRouter** | canvas | `"canvas"` | keep-alive Surface 라우팅 |
| **TrayFrame** | tray | `"tray"` | 하단 탭 + View 슬롯 |
| **FloatingFrame** | floating | `"floating-{windowId}"` | 드래그/리사이즈 윈도우 |
| **FloatingLayer** | floating | — | FloatingFrame 오케스트레이션 |
| **FloatingDock** | floating | — | 최소화 바 |

> **Frame Identity**: 모든 Frame은 고유한 `FrameSlot` ID를 가진다.
> ViewRegistry의 `frames` 배열은 이 ID를 참조한다. Floating은 윈도우 생성 시 동적 ID를 부여받는다.

#### Frame 규약

- Frame은 **View를 모른다** — Registry에서 가져올 뿐
- Frame은 `children` 또는 Registry lookup으로 View를 받는다
- Frame은 `Suspense + lazy()`로 View를 로딩한다
- Frame은 자체 상태(visible, width, activeTab)를 atom으로 관리

---

## 4. Registry System

### 4.0 설계 원칙: 분산 자가 등록 (Distributed Self-Registration)

Registry는 **빈 컨테이너 + API**만 제공한다. View/Surface 정의는 각 feature/surface 모듈이 자기 자신을 등록한다.

```
                   ┌──────────────────────────┐
                   │  viewRegistry.ts          │
                   │  (빈 Map + API)           │
                   └──────────┬───────────────┘
                              │ registerView()
          ┌───────────────────┼───────────────────┐
          │                   │                   │
features/explorer/  features/terminal/  features/problems/
  index.ts            index.ts            index.ts
  registerView(...)   registerView(...)   registerView(...)
```

**왜 중앙 배열이 아닌가:**

| | 중앙 배열 (`VIEW_REGISTRY[]`) | 분산 자가 등록 (`registerView()`) |
|---|---|---|
| **View 추가 시** | registry 파일 + feature 파일 수정 | feature 파일만 수정 |
| **merge conflict** | 같은 배열에 여러 명이 추가 → 충돌 | 각자 다른 파일 → 충돌 없음 |
| **정의 위치** | registry에서 찾아야 함 | feature 안에 같이 있음 (colocation) |
| **삭제** | 2곳 수정 | feature 디렉토리만 삭제 |
| **플러그인/동적 View** | 불가 | 가능 (런타임 registerView) |
| **코드 리뷰** | "이 View 어디서 정의됐지?" | feature/index.ts 보면 됨 |

**등록 트리거**: `bootstrapFeatures.ts`에서 각 feature를 import하면 모듈 스코프의 `registerView()` 호출이 자동 실행된다. 이미 프로젝트에서 `registerBootstrapFeature()` 패턴으로 사용 중인 방식과 동일.

### 4.1 ViewRegistry

모든 Panel View의 **단일 진실 소스 (SSOT)**. 빈 레지스트리 + 조회 API.

```typescript
// src/app/shell/model/viewRegistry.ts

type ViewKind = "panel" | "surface";

export interface ViewDefinition {
  /** 고유 ID */
  readonly id: string;
  /** View 종류 — panel은 Frame 이동 가능, surface는 Canvas 전용 */
  readonly kind: ViewKind;
  /** 표시 이름 */
  readonly title: string;
  /** Codicon 아이콘 이름 */
  readonly icon: string;
  /** 배치 가능한 Frame 목록 (kind: "panel"만 해당) */
  readonly frames: readonly FrameSlot[];
  /** 기본 배치 Frame */
  readonly defaultFrame: FrameSlot;
  /** 키보드 단축키 (표시용) */
  readonly shortcut?: string;
  /** Lazy-loaded 컴포넌트 */
  readonly component: React.LazyExoticComponent<React.ComponentType>;
  /** 정렬 우선순위 (낮을수록 먼저) */
  readonly priority?: number;

  // ─── v2 추가 필드 ──────────────────

  /** View가 활성화되기 위한 조건 (예: 에디터가 열려있을 때만) */
  readonly availability?: () => boolean;
  /** 동일 View의 다중 인스턴스 허용 여부. false면 싱글턴 */
  readonly singleton?: boolean;
  /** 레이아웃 복원 시 포함 여부 */
  readonly restorable?: boolean;
  /** Floating으로 떼어낼 수 있는지 */
  readonly detachable?: boolean;
  /** 앱 시작 시 미리 로딩 (Suspense 스킵) */
  readonly preload?: boolean;
  /** 상태 지속성 범위 */
  readonly persistence?: PersistenceScope;
  /** View가 제공하는 Command 목록 (Command Palette 통합) */
  readonly commands?: readonly ViewCommand[];
}

export type FrameSlot =
  | "dock-left"      // SidebarFrame
  | "dock-right"     // AgentFrame
  | "tray"           // TrayFrame
  | "floating";      // FloatingFrame

// Surface는 별도 SurfaceRegistry 사용, FrameSlot에 포함하지 않음

// ─── Registry (빈 컨테이너) ──────────────
const views = new Map<string, ViewDefinition>();

// ─── Public API ──────────────────────────
export function registerView(def: ViewDefinition): void {
  if (views.has(def.id)) throw new Error(`View "${def.id}" already registered`);
  views.set(def.id, def);
}

export function getViewsForFrame(frame: FrameSlot): readonly ViewDefinition[] {
  return [...views.values()]
    .filter((v) => v.frames.includes(frame))
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
}

export function getViewById(id: string): ViewDefinition | undefined {
  return views.get(id);
}

export function getAllViews(): readonly ViewDefinition[] {
  return [...views.values()];
}
```

#### 자가 등록 예시

```typescript
// src/features/explorer/index.ts
import { lazy } from "react";
import { registerView } from "@/app/shell/model/viewRegistry";

registerView({
  id: "explorer",
  kind: "panel",
  title: "Explorer",
  icon: "files",
  frames: ["dock-left", "floating"],
  defaultFrame: "dock-left",
  shortcut: "⌘⇧E",
  singleton: true,
  detachable: true,
  restorable: true,
  persistence: "workspace",
  priority: 10,
  component: lazy(() => import("./ui/ExplorerView")),
});

// 필요 시 bootstrap hook도 같이 등록
export { useExplorerSync } from "./model/useExplorerSync";
```

```typescript
// src/app/bootstrapFeatures.ts — import만 추가하면 자동 등록
import "@/features/explorer";       // ← registerView() 자동 실행
import "@/features/search";
import "@/features/terminal";
import "@/features/problems";
// ...
```

### 4.2 SurfaceRegistry

Canvas 전용 Surface 등록. 동일한 분산 자가 등록 패턴.

```typescript
// src/surfaces/surfaceRegistry.ts

export interface SurfaceDefinition {
  readonly id: SurfaceId;
  readonly label: string;
  readonly icon: string;
  readonly component: React.LazyExoticComponent<React.ComponentType>;
  readonly priority?: number;
  /** 상태 지속성 범위 */
  readonly persistence?: PersistenceScope;
}

const surfaces = new Map<SurfaceId, SurfaceDefinition>();

export function registerSurface(def: SurfaceDefinition): void {
  if (surfaces.has(def.id)) throw new Error(`Surface "${def.id}" already registered`);
  surfaces.set(def.id, def);
}

export function getSurface(id: SurfaceId): SurfaceDefinition | undefined {
  return surfaces.get(id);
}

export function getAllSurfaces(): readonly SurfaceDefinition[] {
  return [...surfaces.values()].sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
}
```

#### Surface 자가 등록 예시

```typescript
// src/surfaces/chat/index.ts
import { lazy } from "react";
import { registerSurface } from "@/surfaces/surfaceRegistry";

registerSurface({
  id: "chat",
  label: "Chat",
  icon: "comment-discussion",
  persistence: "session",
  priority: 10,
  component: lazy(() => import("./ChatView")),
});
```

### 4.3 Multi-Instance: ViewDefinition vs ViewInstance

하나의 `ViewDefinition`에서 여러 인스턴스가 생길 수 있다 (예: 터미널 세션 2개).

```typescript
interface ViewInstance {
  /** 인스턴스 고유 ID (예: "terminal-1", "terminal-2") */
  readonly instanceId: string;
  /** 원본 ViewDefinition ID */
  readonly viewId: string;
  /** 현재 배치된 Frame */
  readonly currentFrame: FrameSlot;
  /** 인스턴스별 상태 (터미널 세션 ID 등) */
  readonly params?: Record<string, unknown>;
}

// singleton: true인 View → ViewInstance는 항상 1개
// singleton: false인 View → 여러 ViewInstance 가능
//
// ViewInstance는 런타임 atom으로 관리:
// viewInstancesAtom: Map<string, ViewInstance>
```

### 4.4 OverlayRegistry (선택적)

Dialog/Sheet 등 자주 쓰이는 Overlay를 등록.

```typescript
export interface OverlayDefinition {
  readonly id: string;
  readonly render: () => React.ReactNode;
  readonly priority?: number;
}

export function registerOverlay(def: OverlayDefinition): void;
```

### 4.5 DX Recipes: 새 View/Surface 추가 가이드

#### Recipe 1: 새 Panel View 추가 (Tray)

```bash
# 1. feature 디렉토리 생성
mkdir -p src/features/my-feature/{model,ui}

# 2. View 컴포넌트 작성
cat > src/features/my-feature/ui/MyFeatureView.tsx << 'EOF'
export default function MyFeatureView() {
  return <div className="w-full h-full">My Feature</div>;
}
EOF

# 3. 자가 등록
cat > src/features/my-feature/index.ts << 'EOF'
import { lazy } from "react";
import { registerView } from "@/app/shell/model/viewRegistry";

registerView({
  id: "my-feature",
  kind: "panel",
  title: "My Feature",
  icon: "beaker",
  frames: ["tray", "floating"],
  defaultFrame: "tray",
  singleton: true,
  detachable: true,
  component: lazy(() => import("./ui/MyFeatureView")),
});
EOF

# 4. bootstrap에 import 추가 (1줄)
echo 'import "@/features/my-feature";' >> src/app/bootstrapFeatures.ts
```

**끝. Frame 코드 수정 0줄.** TrayFrame이 `getViewsForFrame("tray")`를 호출하면 자동으로 탭에 표시된다.

#### Recipe 2: 새 Surface 추가 (Canvas)

```bash
# 1. surface 디렉토리 생성
mkdir -p src/surfaces/my-surface

# 2. View 컴포넌트 작성
cat > src/surfaces/my-surface/MySurfaceView.tsx << 'EOF'
export default function MySurfaceView() {
  return <div className="w-full h-full">My Surface</div>;
}
EOF

# 3. 자가 등록
cat > src/surfaces/my-surface/index.ts << 'EOF'
import { lazy } from "react";
import { registerSurface } from "@/surfaces/surfaceRegistry";

registerSurface({
  id: "my-surface",
  label: "My Surface",
  icon: "preview",
  priority: 50,
  component: lazy(() => import("./MySurfaceView")),
});
EOF

# 4. bootstrap에 import 추가 (1줄)
echo 'import "@/surfaces/my-surface";' >> src/app/bootstrapFeatures.ts
```

**끝. TitleBar 탭에 자동 표시.** SurfaceRouter가 `getAllSurfaces()`로 라우팅 대상을 자동 수집.

#### Recipe 3: 기존 View에 Floating 지원 추가

```typescript
// features/problems/index.ts 의 registerView에 한 줄 추가
frames: ["tray", "floating"],  // "floating" 추가
detachable: true,              // 추가
```

**끝.** TrayFrame의 탭에 "Pop Out" 버튼이 자동 표시된다 (`detachable: true`인 View만).

#### 팀 작업 시 conflict 시나리오

```
Developer A: features/search/ 작업     → search/index.ts 수정
Developer B: features/problems/ 작업   → problems/index.ts 수정
Developer C: surfaces/graph/ 작업      → graph/index.ts 수정

충돌 가능 지점: bootstrapFeatures.ts (각자 import 1줄 추가)
→ 서로 다른 줄이므로 git auto-merge 가능. 실질적 충돌 확률 ≈ 0
```

---

## 5. Z-Order Specification

### 5.1 Z-Index Layers

```
z: 40  ─── TOAST          (항상 최상위)
z: 35  ─── TOOLTIP         (Toast 바로 아래)
z: 30  ─── MODAL           (Overlay: Dialog, Drawer, Sheet, Palette)
z: 20  ─── OVERLAY         (Transient: Popover, HoverCard, Dropdown, ContextMenu)
z: 15  ─── FLOATING        (Floating 윈도우, 개별 z-order 가변)
z: 10  ─── STICKY          (스크롤 고정 헤더, breadcrumb)
z:  0  ─── BASE            (Chrome, Dock, Canvas, Tray, Inline)
```

### 5.2 Floating z-order

Floating 윈도우끼리는 독립적 z-order를 가진다:

```
z: 15 + zOrder(0~99)

예: 3개 Floating 윈도우
  Terminal: z = 15 + 2 = 17  (최상위, 마지막 클릭)
  Output:   z = 15 + 1 = 16
  Problems: z = 15 + 0 = 15  (최하위)
```

클릭 시 해당 윈도우의 `zOrder`를 max+1로 업데이트.

### 5.3 Overlay Stack

Overlay는 LIFO 스택으로 관리. 같은 z-layer(`--z-modal`)를 공유하되, DOM 순서로 겹침:

```
overlayStack: [
  { id: "settings", type: "modal" },       // 먼저 열림 (아래)
  { id: "confirm",  type: "dialog" },      // 나중 열림 (위, ESC 대상)
]
```

- ESC: 스택 최상위만 닫힘
- Click outside: 현재 Overlay만 닫힘
- Focus trap: 최상위 Overlay 안에서만 Tab 순환

---

## 6. State Management

### 6.1 Shell State Atoms

```typescript
// ─── Dock state ──────────────────────
sidebarVisibleAtom:    boolean     // SidebarFrame 표시 여부
sidebarWidthAtom:      number      // SidebarFrame 폭 (px)
activeSidebarViewAtom: string      // SidebarFrame 활성 View ID

agentPanelVisibleAtom: boolean     // AgentFrame 표시 여부
agentPanelWidthAtom:   number      // AgentFrame 폭 (px)

// ─── Tray state ──────────────────────
trayVisibleAtom:       boolean     // TrayFrame 표시 여부
trayHeightAtom:        number      // TrayFrame 높이 (px)
activeTrayViewAtom:    string      // TrayFrame 활성 View ID
trayMaximizedAtom:     boolean     // TrayFrame 최대화 여부

// ─── Canvas state ────────────────────
activeSurfaceAtom:     SurfaceId   // 현재 활성 Surface
splitDirectionAtom:    "none"|"h"|"v"
secondarySurfaceAtom:  SurfaceId|null
splitRatioAtom:        number      // 0~1

// ─── Focus/Zen mode ─────────────────
focusModeAtom:         boolean     // TitleBar 숨김, Dock+Tray 숨김, StatusBar 유지
zenModeAtom:           boolean     // 모든 Chrome+Dock+Tray 숨김
focusRestoreAtom:      { sidebar, agent, tray } | null

// ─── Layout Presets ──────────────────
// coding, review, debug, presentation, agent-only
applyLayoutPresetAtom: (preset) => void
```

### 6.2 Floating State Atoms

```typescript
floatingWindowMapAtom: Map<string, FloatingWindowState>

interface FloatingWindowState {
  /** ViewInstance ID (§4.3) */
  instanceId:   string
  /** ViewDefinition ID */
  viewId:       string
  position:     { x, y }
  size:         { width, height }
  zOrder:       number
  minimized:    boolean
  maximized:    boolean
  snappedTo:    SnapEdge | null
  /** 원래 Frame (attach 시 복귀용) */
  originFrame:  FrameSlot
}
```

### 6.3 Overlay Stack Atoms

```typescript
overlayStackAtom: OverlayEntry[]

interface OverlayEntry {
  id:      string
  type:    "modal" | "dialog" | "drawer" | "sheet" | "palette"
  dismiss: (() => void) | null
}

topOverlayAtom:  OverlayEntry | null  // derived
```

---

## 7. Interaction Patterns

### 7.1 View 이동 (Drag & Drop, 미래)

```
SidebarFrame의 ExplorerView 탭
  → 드래그 시작
  → TrayFrame 위로 이동
  → 드롭 → ExplorerView가 TrayFrame으로 이동
  → ViewInstance.currentFrame 업데이트
```

규칙:
- View의 `frames` 배열에 포함된 Frame으로만 이동 가능
- Canvas(Surface)는 이동 대상이 아님 — `kind: "surface"`

### 7.2 Detach / Attach — State Contract

**핵심 원칙: DOM reparenting이 아니라 unmount → remount이다.**

```
TrayFrame의 TerminalView 탭 → "Pop Out" 버튼
  → TrayFrame에서 View unmount
  → FloatingFrame 생성
  → FloatingFrame에서 View remount (새 인스턴스)
  → View가 Jotai atom에서 상태 복원

FloatingFrame의 "📌 Dock back" 버튼
  → FloatingFrame에서 View unmount
  → 원래 Frame에서 View remount
  → FloatingFrame 제거
```

#### State Contract

React DOM reparenting은 불가능하다. 따라서:

| 항목 | 규약 |
|------|------|
| **장수명 상태** | 반드시 **외부 store** (Jotai atom, Zustand 등)에 둔다 |
| **로컬 state** | `useState`/`useRef` 상태는 detach 시 소실됨을 인지한다 |
| **허용되는 소실** | 스크롤 위치, 임시 UI 상태 (collapsible open/closed), 포커스 위치 |
| **소실되면 안 되는 것** | 터미널 세션, 검색 쿼리, 필터 설정, 정렬 상태 → 반드시 atom |
| **xterm.js 같은 특수 케이스** | 세션 ID를 atom으로 관리하고, remount 시 같은 세션에 재연결 |

```typescript
// ✅ Good — Detach 후에도 상태 유지
const searchQueryAtom = atom("");
function SearchView() {
  const [query, setQuery] = useAtom(searchQueryAtom);
  // ...
}

// ❌ Bad — Detach 시 상태 소실
function SearchView() {
  const [query, setQuery] = useState("");
  // ...
}
```

### 7.3 Focus Mode vs Zen Mode

두 가지 몰입 모드를 구분한다:

| | Focus Mode | Zen Mode |
|---|-----------|----------|
| **단축키** | `⌘\` | `⌘K Z` |
| **TitleBar** | 숨김 | 숨김 |
| **StatusBar** | **유지** (모드 표시, 탈출 버튼) | **숨김** |
| **Dock** | 숨김 | 숨김 |
| **Tray** | 숨김 | 숨김 |
| **Canvas** | 전체화면 | 전체화면 + padding 추가 (타이포그래피 집중) |
| **복원** | `focusRestoreAtom`에서 복원 | 동일 |
| **탈출** | `ESC` or `⌘\` | `ESC ESC` (더블) or `⌘K Z` |

```
Focus Mode 활성화 시:
  1. focusRestoreAtom ← 현재 sidebar/agent/tray visible 저장
  2. Chrome(TitleBar) 숨김, StatusBar 유지
  3. Dock(SidebarFrame, AgentFrame) 숨김
  4. Tray(TrayFrame) 숨김
  5. Canvas 전체화면

Zen Mode 활성화 시:
  1~4 동일
  5. StatusBar 숨김
  6. Canvas 전체화면 + 좌우 padding (max-width: 800px 센터링)
```

### 7.4 Layout Presets

| Preset | Sidebar | Agent | Tray | Tray View | Surface |
|--------|---------|-------|------|-----------|---------|
| Coding | ✓ | ✓ | ✓ | Terminal | Editor |
| Review | ✓ | ✓ | ✓ | Problems | Review |
| Debug | ✗ | ✓ | ✓ | Terminal | Editor |
| Present | ✗ | ✗ | ✗ | — | Editor |
| Agent | ✗ | ✓ | ✓ | EventLog | Chat |

> **주의: Preset의 Tray View / Surface 컬럼은 View ID 문자열이다.**
> Preset 정의는 Shell 레이어(`shellAtoms.ts`)에 있으므로 View ID 참조가 허용된다.
> 단, Preset이 참조하는 View ID가 실제 등록되어 있는지는 런타임에 `getViewById()`로 검증한다.
> 등록되지 않은 ID는 무시하고 기본값으로 fallback.

### 7.5 Intent Routing Contract

Intent(사용자 의도)가 어떤 Surface/View를 활성화할지 결정하는 규약.

#### 왜 Intent가 필요한가 — 현재 코드의 문제

현재 코드베이스에서 Feature/View가 Frame atom을 직접 조작하는 위반이 발생하고 있다:

```typescript
// ❌ 현재: Feature가 Frame atom을 직접 조작 (역방향 커플링)
// EditorContextMenu.tsx
setBottomPanel("self-explain");        // View ID 하드코딩
setBottomPanelVisible(true);           // Frame 가시성 직접 조작

// useTerminalIntentDispatch.ts
setBottomPanel("problems");            // View ID 하드코딩

// DocDriftPanel.tsx
import { agentPanelVisibleAtom } from "shellBridgeAtoms";  // Frame atom 직접 import
```

이 패턴의 문제:
1. **View가 Frame을 안다** — content-agnostic 원칙 위반
2. **View ID 하드코딩** — ID 변경 시 여러 파일 수정 필요
3. **Frame 가시성 로직 분산** — 패널 열기/닫기 로직이 여기저기 흩어짐

#### Intent 기반 단방향 흐름

```
Feature/View                    Shell (intentRouter)              Frame
    │                                │                              │
    │  dispatchIntent("show-view",   │                              │
    │    { viewId: "problems" })     │                              │
    │ ─────────────────────────────→ │                              │
    │                                │  1. getViewById("problems")  │
    │                                │  2. defaultFrame → "tray"    │
    │                                │  3. trayVisibleAtom ← true   │
    │                                │  4. activeTrayViewAtom ←     │
    │                                │     "problems"               │
    │                                │ ────────────────────────────→ │
    │                                │                              │  TrayFrame 렌더
```

```typescript
// ─── Intent 타입 ──────────────────────────────

type IntentAction =
  | { action: "show-view";    viewId: string; params?: Record<string, unknown> }
  | { action: "show-surface"; surfaceId: SurfaceId; params?: Record<string, unknown> }
  | { action: "toggle-frame"; frame: FrameSlot }
  | { action: "apply-preset"; preset: LayoutPresetId };

// ─── Dispatch API (Feature/View가 사용) ──────

// Jotai write-only atom — Feature에서 import 가능한 유일한 Shell 접점
const dispatchIntentAtom = atom(null, (get, set, intent: IntentAction) => {
  switch (intent.action) {
    case "show-view": {
      const view = getViewById(intent.viewId);
      if (!view) return;  // 등록 안 된 ID → 무시
      const frame = view.defaultFrame;
      // Frame 가시성 + 활성 View를 한 곳에서 처리
      if (frame === "tray") {
        set(trayVisibleAtom, true);
        set(activeTrayViewAtom, intent.viewId);
      } else if (frame === "dock-left") {
        set(sidebarVisibleAtom, true);
        set(activeSidebarViewAtom, intent.viewId);
      }
      break;
    }
    case "show-surface": {
      const surface = getSurface(intent.surfaceId);
      if (!surface) return;
      set(activeSurfaceAtom, intent.surfaceId);
      break;
    }
    // ...
  }
});
```

```typescript
// ✅ After: Feature는 Intent만 발행 — Frame atom을 모름
// EditorContextMenu.tsx
const dispatch = useSetAtom(dispatchIntentAtom);
dispatch({ action: "show-view", viewId: "self-explain" });

// useTerminalIntentDispatch.ts
dispatch({ action: "show-view", viewId: "problems" });

// DocDriftPanel.tsx
dispatch({ action: "toggle-frame", frame: "dock-right" });
```

#### Intent 규약

- `dispatchIntentAtom`은 Feature/View가 Shell과 소통하는 **유일한 공식 경로**
- Shell atom 직접 조작 (`trayVisibleAtom.set(...)`) 은 Shell 내부(`frames/`, `model/`)에서만 허용
- Feature/View는 `shellAtoms`를 절대 import하지 않는다 (§7.6 Import Boundary 참조)
- Intent handler가 View 존재 여부를 검증하고, Frame 가시성 + View 활성화를 **원자적**으로 처리

### 7.6 Import Boundary — 레이어 간 의존성 규칙

Frame/View 분리를 코드 레벨에서 강제하기 위한 import 규칙.

```
┌─────────────────────────────────────────────────────┐
│                    의존 방향 (→)                      │
│                                                      │
│  features/   ──→  shared/     ←──  app/shell/        │
│  surfaces/   ──→  shared/     ←──  app/shell/        │
│                                                      │
│  features/ ✗──→ app/shell/model/shellAtoms  ← 금지!  │
│  surfaces/ ✗──→ app/shell/model/shellAtoms  ← 금지!  │
│  features/ ──→  app/shell/model/viewRegistry ← OK    │
│  features/ ──→  dispatchIntentAtom           ← OK    │
└─────────────────────────────────────────────────────┘
```

#### Import 매트릭스

| From \ To | `shared/` | `shell/model/viewRegistry` | `shell/model/shellAtoms` | `dispatchIntentAtom` | `shell/frames/` |
|-----------|-----------|---------------------------|-------------------------|---------------------|----------------|
| **features/** | ✅ | ✅ (등록만) | ❌ 금지 | ✅ | ❌ 금지 |
| **surfaces/** | ✅ | — | ❌ 금지 | ✅ | ❌ 금지 |
| **shell/frames/** | ✅ | ✅ (조회만) | ✅ | ✅ | ✅ (내부) |
| **shell/model/** | ✅ | ✅ | ✅ (내부) | ✅ | — |
| **widgets/** | ✅ | — | ❌ 금지 | ✅ | ❌ 금지 |

#### 현재 위반 사항 및 마이그레이션

| 파일 | 현재 (위반) | 변경 후 |
|------|-----------|---------|
| `EditorContextMenu.tsx` | `setBottomPanel("self-explain")` | `dispatch({ action: "show-view", viewId: "self-explain" })` |
| `useTerminalIntentDispatch.ts` | `setBottomPanel("problems")` | `dispatch({ action: "show-view", viewId: "problems" })` |
| `helpActions.ts` | `store.set(activeBottomPanelAtom, "agent-log")` | `store.set(dispatchIntentAtom, { action: "show-view", viewId: "agent-log" })` |
| `DocDriftPanel.tsx` | `import { agentPanelVisibleAtom }` | `dispatch({ action: "toggle-frame", frame: "dock-right" })` |
| `useSystemLensActions.ts` | Shell atom 직접 접근 | `dispatchIntentAtom` 사용 |

#### ESLint 강제 (선택적)

```jsonc
// .eslintrc — no-restricted-imports 룰로 경계 강제
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [
        {
          "group": ["**/app/shell/model/shellAtoms*"],
          "importNames": ["*"],
          "message": "Feature/View에서 shellAtoms 직접 import 금지. dispatchIntentAtom을 사용하세요."
        }
      ]
    }]
  },
  "overrides": [
    {
      "files": ["src/app/shell/**"],
      "rules": { "no-restricted-imports": "off" }
    }
  ]
}
```

#### shellBridgeAtoms 폐기

현재 `shared/lib/atoms/shellBridgeAtoms.ts`가 Shell atom을 re-export해서 Feature/View가 쉽게 접근할 수 있게 해주고 있다. 이것이 역방향 커플링의 근본 원인이다.

```
// ❌ 현재: shellBridgeAtoms.ts — 경계를 허무는 re-export
export { bottomPanelVisibleAtom, agentPanelVisibleAtom } from "../../app/shell/model/shellAtoms";

// ✅ 변경: shellBridgeAtoms.ts를 dispatchIntentAtom 기반으로 교체
// 또는 @deprecated 후 삭제
```

**마이그레이션**: Phase 5 (Atom 리네이밍)에서 shellBridgeAtoms의 Shell atom re-export를 모두 제거하고, 소비자를 `dispatchIntentAtom`으로 전환한다.

---

## 8. Persistence Specification

### 8.1 Persistence Scope

각 View/Surface/Frame의 상태는 어디까지 지속되는지 명시한다.

```typescript
type PersistenceScope =
  | "none"       // 앱 종료 시 소실. 임시 상태.
  | "session"    // 탭/윈도우 닫기까지 유지. sessionStorage 또는 in-memory atom.
  | "workspace"  // 워크스페이스(프로젝트) 단위로 유지. localStorage key에 workspace ID 포함.
  | "global";    // 모든 워크스페이스에서 유지. 사용자 설정 수준.
```

#### Persistence Scope 매핑

| 상태 | Scope | 저장소 |
|------|-------|--------|
| **Shell layout** (sidebar 폭, tray 높이, 패널 가시성) | `workspace` | localStorage |
| **활성 Surface/View** | `workspace` | localStorage |
| **Floating 윈도우 위치/크기** | `session` | in-memory atom |
| **Split View 설정** | `workspace` | localStorage |
| **Layout Preset 선택** | `workspace` | localStorage |
| **에디터 커서/스크롤** | `workspace` | localStorage |
| **검색 쿼리/필터** | `session` | in-memory atom |
| **터미널 세션 목록** | `session` | in-memory atom |
| **사용자 테마/폰트** | `global` | localStorage |
| **단축키 커스텀** | `global` | localStorage |

### 8.2 Workspace Restore

앱 시작 시 `workspace` scope 상태를 복원하는 순서:

```
1. localStorage에서 workspace ID로 저장된 레이아웃 읽기
2. Shell atoms 초기화 (sidebar/tray/agent 가시성, 폭/높이)
3. 활성 Surface 복원
4. Dock/Tray 활성 View 복원
5. restorable: true인 View만 복원 대상
```

---

## 9. Animation Specification

### 9.1 진입/퇴장 애니메이션

| Layout Type | 진입 | 퇴장 | Duration |
|-------------|------|------|----------|
| **Dock** | slide-in (edge 방향) | slide-out (edge 방향) | 200ms spring |
| **Tray** | slide-up | slide-down | 200ms spring |
| **Floating** | scale(0.95→1) + fade | scale(1→0.95) + fade | 200ms spring / 150ms ease |
| **Overlay (Modal)** | scale(0.96→1) + fade | fade-out | 200ms spring / 180ms ease |
| **Overlay (Drawer)** | slide-in (edge) | slide-out (edge) | 250ms spring / 180ms ease |
| **Overlay (Sheet)** | slide-up | slide-down (또는 swipe) | 250ms ease-out / 180ms ease |
| **Overlay (Palette)** | fade + slide-down(4px) | fade-out | 150ms ease / 120ms ease |
| **Transient (Tooltip)** | fade-in | fade-out | 150ms / 100ms |
| **Transient (Toast)** | slide-in-right | slide-out-right | 200ms / 150ms |
| **Transient (Popover)** | fade-in | fade-out | 150ms / 150ms |
| **Inline** | expand height (0→auto) | collapse height (auto→0) | 200ms ease |

### 9.2 리사이즈 애니메이션

- Dock/Tray 리사이즈: **애니메이션 없음** (드래그 중 즉시 반영)
- Tray 최대화 토글: `200ms cubic-bezier(0.34, 1.56, 0.64, 1)` (spring)
- Focus Mode 토글: `height/opacity 200ms ease` (Chrome), instant (Dock/Tray)
- Floating 스냅: `left/top/width/height 300ms ease-spring`

### 9.3 Tab 전환 애니메이션

- Surface 탭: 활성 탭 하단 2px accent underline (`tab-underline-in 200ms spring`)
- Dock/Tray 탭: 동일 패턴
- Activity Bar: 좌측 2px accent 바 (`tab-underline-in 200ms spring`)

---

## 10. Accessibility

### 10.1 ARIA Roles

| Layout Type | role | aria-* |
|-------------|------|--------|
| Chrome (TitleBar) | `banner` | — |
| Chrome (StatusBar) | `contentinfo` | — |
| Dock | `complementary` | `aria-label="Sidebar"` |
| Canvas | `main` | — |
| Tray | `complementary` | `aria-label="Panel"` |
| Floating | `dialog` | `aria-label="{View title} — Floating"` |
| Overlay (Modal/Dialog) | `dialog` | `aria-modal="true"` |
| Overlay (Drawer) | `dialog` | `aria-modal="true"` |
| Overlay (Palette) | `combobox` + `listbox` | `aria-expanded` |
| Transient (Tooltip) | `tooltip` | — |
| Transient (Toast) | `status` | `aria-live="polite"` |
| Transient (Popover) | `dialog` | `aria-modal="false"` |
| Transient (ContextMenu) | `menu` | `aria-orientation="vertical"` |
| Inline | — | `aria-expanded` |

### 10.2 키보드 네비게이션

| 동작 | 단축키 |
|------|--------|
| Surface 탭 전환 | `⌘1`~`⌘9` |
| Sidebar 토글 | `⌘B` |
| Tray 토글 | `⌘J` |
| Agent 패널 토글 | `⌘K ⌘K` |
| Focus Mode | `⌘\` |
| Zen Mode | `⌘K Z` |
| Command Palette | `⌘⇧P` |
| Quick File Open | `⌘P` |
| Overlay 닫기 | `ESC` (스택 최상위만) |
| Floating 최소화 | `ESC` (최상위 윈도우) |
| 탭 간 이동 (Dock/Tray) | `⌘⇧E/F/O/M/U/L` (각 View 단축키) |

### 10.3 Focus 관리

| 상황 | 포커스 이동 |
|------|-----------|
| Overlay 열림 | 첫 focusable 요소로 이동, trap |
| Overlay 닫힘 | 트리거 요소로 복원 |
| Dock 열림 | 활성 View의 첫 요소로 이동 |
| Floating 열림 | 윈도우 내 첫 요소로 이동 |
| Tab 전환 | 새 탭 콘텐츠의 첫 요소로 이동 |

---

## 11. Naming Convention

### 11.1 파일 네이밍

| 계층 | 패턴 | 예시 |
|------|------|------|
| Frame | `{Name}Frame.tsx` 또는 `{Name}Bar.tsx` | `SidebarFrame.tsx`, `TitleBar.tsx`, `FloatingFrame.tsx` |
| View | `{Name}View.tsx` | `ExplorerView.tsx`, `TerminalView.tsx`, `ChatView.tsx` |
| Composite | `{Name}.tsx` | `CommandPalette.tsx`, `ContextMenu.tsx` |
| Primitive | `{Name}.tsx` | `Button.tsx`, `Icon.tsx`, `Dialog.tsx` |

### 11.2 디렉토리 구조

```
src/
├── app/
│   ├── bootstrapFeatures.ts          # ★ import로 View/Surface 등록 트리거
│   ├── featureRegistry.ts
│   ├── shell/
│   │   ├── ShellLayout.tsx           # 6-zone 마스터 레이아웃 (거의 안 바뀜)
│   │   ├── frames/                   # ★ Frame 컴포넌트 (안정 레이어)
│   │   │   ├── TitleBar.tsx
│   │   │   ├── StatusBar.tsx
│   │   │   ├── SidebarFrame.tsx      # getViewsForFrame("dock-left") → 탭 자동 생성
│   │   │   ├── AgentFrame.tsx
│   │   │   ├── TrayFrame.tsx         # getViewsForFrame("tray") → 탭 자동 생성
│   │   │   ├── FloatingFrame.tsx
│   │   │   ├── FloatingLayer.tsx
│   │   │   └── FloatingDock.tsx
│   │   ├── components/
│   │   │   ├── ActivityBar.tsx
│   │   │   ├── CommandPaletteTrigger.tsx
│   │   │   ├── LayoutToggleGroup.tsx
│   │   │   └── IntentIndicator.tsx
│   │   └── model/
│   │       ├── viewRegistry.ts       # ★ 빈 Map + registerView() API
│   │       ├── shellAtoms.ts
│   │       ├── floatingAtoms.ts
│   │       └── intentRouter.ts
│   └── ...
│
├── features/                          # ★ 각 feature가 자가 등록
│   ├── explorer/
│   │   ├── index.ts                   # registerView({ id: "explorer", ... })
│   │   ├── model/
│   │   └── ui/ExplorerView.tsx
│   ├── search/
│   │   ├── index.ts                   # registerView({ id: "search", ... })
│   │   └── ui/SearchView.tsx
│   ├── terminal/
│   │   ├── index.ts                   # registerView({ id: "terminal", ... })
│   │   ├── model/
│   │   └── ui/TerminalView.tsx
│   ├── problems/
│   │   ├── index.ts                   # registerView({ id: "problems", ... })
│   │   └── ui/ProblemsView.tsx
│   ├── output/
│   │   ├── index.ts                   # registerView({ id: "output", ... })
│   │   └── ui/OutputView.tsx
│   ├── event-log/
│   │   ├── index.ts                   # registerView({ id: "event-log", ... })
│   │   └── ui/EventLogView.tsx
│   └── ...                            # 100+ 기존 features (건드리지 않음)
│
├── surfaces/                          # ★ 각 surface가 자가 등록
│   ├── surfaceRegistry.ts             # 빈 Map + registerSurface() API
│   ├── SurfaceRouter.tsx              # getAllSurfaces()로 라우팅 대상 자동 수집
│   ├── chat/
│   │   ├── index.ts                   # registerSurface({ id: "chat", ... })
│   │   └── ChatView.tsx
│   ├── editor/
│   │   ├── index.ts                   # registerSurface({ id: "editor", ... })
│   │   └── EditorView.tsx
│   ├── review/
│   │   ├── index.ts                   # registerSurface({ id: "review", ... })
│   │   └── ReviewView.tsx
│   └── ...
│
└── shared/ui/
    ├── primitives/     # Layer 1
    ├── composites/     # Layer 2
    ├── layouts/        # Layout helpers (ScrollArea, StickyHeader)
    └── tokens.ts       # Layer 0
```

#### 파일 역할 요약

| 파일 | 수정 빈도 | 역할 |
|------|----------|------|
| `viewRegistry.ts` | **거의 안 바뀜** | 빈 Map + API (인프라) |
| `surfaceRegistry.ts` | **거의 안 바뀜** | 빈 Map + API (인프라) |
| `frames/*.tsx` | **거의 안 바뀜** | Frame은 "틀" — View를 모름 |
| `features/{name}/index.ts` | **각 개발자가 독립 수정** | View 정의 + 자가 등록 |
| `surfaces/{name}/index.ts` | **각 개발자가 독립 수정** | Surface 정의 + 자가 등록 |
| `bootstrapFeatures.ts` | **import 1줄 추가만** | 등록 트리거 (auto-merge 가능) |

### 11.3 이름 변경 매핑

| 현재 이름 | 새 이름 | 이유 |
|-----------|---------|------|
| `ShellTopBar` | `TitleBar` | Chrome 타입 명확화 |
| `ShellSidebar` | `SidebarFrame` | Dock Frame |
| `ShellAgentPanel` | `AgentFrame` | Dock Frame |
| `ShellBottomPanel` | `TrayFrame` | Tray Frame (Canvas 종속) |
| `ShellStatusBar` | `StatusBar` | Chrome 타입 |
| `FloatingWindow` | `FloatingFrame` | Floating Frame |
| `FloatingWindowLayer` | `FloatingLayer` | 간결화 |
| `FloatingWindowDock` | `FloatingDock` | 간결화 |
| `SurfaceTabBar` | **삭제** | TitleBar에 통합됨 (죽은 코드) |
| `ExplorerPanel` | `ExplorerView` | View 계층 |
| `SearchPanel` | `SearchView` | View 계층 |
| `SymbolsPanel` | `SymbolsView` | View 계층 |
| `FindingsPanel` | `FindingsView` | View 계층 |
| `ProblemsPanel` | `ProblemsView` | View 계층 |
| `OutputPanel` | `OutputView` | View 계층 |
| `EventLogPanel` | `EventLogView` | View 계층 |
| `TerminalPanel` (features/) | `TerminalView` | View 계층 |
| `TerminalPanel` (shell/panels/) | **삭제** | 죽은 코드 |
| `ChatSurface` | `ChatView` | Surface도 View의 일종 |
| `EditorSurface` | `EditorView` | Surface도 View의 일종 |
| `panelRegistry` | `viewRegistry` | View 통합 |
| `shellAtoms` 내 `bottomPanel*` | `tray*` | Tray 네이밍 |
| `activeSidebarPanelAtom` | `activeSidebarViewAtom` | View 네이밍 |
| `activeBottomPanelAtom` | `activeTrayViewAtom` | View + Tray |

---

## 12. Responsive Behavior

### 12.1 브레이크포인트

| 이름 | 폭 | 동작 |
|------|------|------|
| **compact** | < 600px | Dock → Drawer로 전환, Tray 숨김 |
| **regular** | 600–1200px | SidebarDock 접힘, AgentDock 접힘 |
| **wide** | > 1200px | 모든 Dock/Tray 표시 가능 |

### 12.2 Platform 적응

| Platform | TitleBar | Dock | Floating |
|----------|----------|------|----------|
| **Tauri desktop** | Custom (traffic lights + drag) | 전체 지원 | 전체 지원 |
| **VSCode webview** | VSCode 네이티브 타이틀바 사용 | 전체 지원 | 전체 지원 |
| **Mobile (미래)** | 간소화 | Sheet로 전환 | 지원 안 함 |

---

## 13. Migration Checklist

### Phase 1: Registry + Naming (비파괴적)
- [x] `viewRegistry.ts` 생성 — 빈 Map + `registerView()` API + `ViewDefinition` 타입 (v2 필드 포함)
- [x] 기존 `panelRegistry.ts`를 `viewRegistry.ts`로 래핑 (backward-compat shim)
- [x] `surfaceRegistry.ts` 생성 — 빈 Map + `registerSurface()` API
- [x] `dispatchIntentAtom` 생성 (§7.5)
- [x] 각 feature `index.ts`에서 `registerView()` 자가 등록
- [x] 각 surface `index.ts`에서 `registerSurface()` 자가 등록
- [x] `bootstrapFeatures.ts`에 feature/surface import 추가

### Phase 2: Frame 리네이밍
- [x] `ShellTopBar` → `TitleBar`
- [x] `ShellSidebar` → `SidebarFrame`
- [x] `ShellBottomPanel` → `TrayFrame`
- [x] `ShellAgentPanel` → `AgentFrame`
- [x] `FloatingWindow` → `FloatingFrame`
- [x] `frames/` 디렉토리 생성, Frame 컴포넌트 이동

### Phase 3: View 리네이밍 + 이동
- [x] `shell/panels/ExplorerPanel` → `features/explorer/ui/ExplorerView`
- [x] `shell/panels/SearchPanel` → `features/search/ui/SearchView`
- [x] `shell/panels/SymbolsPanel` → `features/symbols/ui/SymbolsView`
- [x] `shell/panels/FindingsPanel` → `features/findings/ui/FindingsView`
- [x] `shell/panels/ProblemsPanel` → `features/problems/ui/ProblemsView`
- [x] `shell/panels/OutputPanel` → `features/output/ui/OutputView`
- [x] `shell/panels/EventLogPanel` → `features/event-log/ui/EventLogView`
- [x] `features/terminal/ui/TerminalPanel` → `features/terminal/ui/TerminalView`
- [x] Surface 컴포넌트: `*Surface` → `*View` (backward-compat alias 포함)

### Phase 4: 죽은 코드 정리
- [x] `SurfaceTabBar.tsx` 삭제
- [x] `shell/panels/` 디렉토리 전체 삭제 (모든 View가 `features/*/ui/`로 이동 완료)
- [x] `panelRegistry.ts` 삭제 (viewRegistry로 완전 대체)
- [x] `surfaceTabs.ts` 삭제 (surfaceRegistry로 완전 대체)
- [x] `ShellSidebar.tsx`, `ShellAgentPanel.tsx`, `ShellBottomPanel.tsx`, `ShellTopBar.tsx` 삭제 (deprecated shim)
- [x] `shellAtoms.ts` (root-level shim), `panelRegistry.ts` (root-level shim) 삭제
- [x] `FloatingWindow.tsx`, `FloatingWindowDock.tsx`, `FloatingWindowLayer.tsx` (deprecated shim) 삭제

### Phase 5: Atom 리네이밍 + Import Boundary 적용
- [x] `bottomPanelVisibleAtom` → `trayVisibleAtom` (primary rename, alias 제거)
- [x] `bottomPanelHeightAtom` → `trayHeightAtom` (primary rename)
- [x] `activeBottomPanelAtom` → `activeTrayViewAtom` (primary rename)
- [x] `bottomPanelMaximizedAtom` → `trayMaximizedAtom` (primary rename)
- [x] `activeSidebarPanelAtom` → `activeSidebarViewAtom` (primary rename)
- [x] `toggleBottomPanelAtom` → `toggleTrayAtom` (primary rename)
- [x] `FloatingWindowState.panelId` → `viewId` (전체 floating 시스템)
- [x] `shellBridgeAtoms.ts` 삭제 완료 (참조 0건)
- [x] 위반 파일 마이그레이션 → `dispatchIntentAtom` 사용으로 전환:
  - [x] `EditorContextMenu.tsx` — `setBottomPanel(...)` → `dispatch()`
  - [x] `useTerminalIntentDispatch.ts` — `setBottomPanel(...)` → `dispatch()`
  - [x] `helpActions.ts` — `store.set(activeBottomPanelAtom, ...)` → `dispatch()`
  - [x] `DocDriftPanel.tsx` — `agentPanelVisibleAtom` import → `dispatch()`
  - [x] `useSystemLensActions.ts` — Shell atom 접근 → `dispatch()`
- [x] ESLint `no-restricted-imports` 룰 추가 (§7.6)

### Phase 6: z-index 정리
- [x] `--z-floating: 15` CSS 변수 — 이미 존재 확인
- [x] `--z-floating-dock: 16` CSS 변수 — 이미 존재 확인
- [x] Floating 관련 z-index를 CSS 변수로 통일 — 이미 적용 확인

### Phase 7: Persistence + Intent
- [x] Persistence scope를 각 View/Surface에 설정 (`registerView()`/`registerSurface()` 호출 시 `persistence` 필드)
- [x] Workspace restore 로직 — `ZoneManager.loadShellLayout()`에서 `getViewById()` 검증 추가
- [x] Layout Presets에서 View ID 런타임 검증 — `applyLayoutPresetAtom`에서 `getViewById()` 검증 추가

---

## Appendix A: Full Layout Type Comparison Matrix

| 속성 | Chrome | Dock | Canvas | Tray | Floating | Overlay | Transient | Inline |
|------|--------|------|--------|------|----------|---------|-----------|--------|
| **위치** | edge 고정 | edge 고정 | center | canvas 하단 | 자유 | 중앙/edge | anchor/고정 | flow 내 |
| **이동** | ✗ | ✗ | ✗ | ✗ | 드래그 | ✗ | ✗ | ✗ |
| **리사이즈** | ✗ | 한 축 | 자동 | 한 축 | 자유 | ✗ | ✗ | ✗ |
| **View 교체** | ✗ | 탭 | 라우팅 | 탭 | 1:1 | ✗ | ✗ | ✗ |
| **배경 차단** | — | — | — | — | ✗ | ✓ | ✗ | — |
| **포커스 트랩** | — | — | — | — | ✗ | ✓ | ✗ | — |
| **z-layer** | base(0) | base(0) | base(0) | base(0) | floating(15) | modal(30) | tooltip(35)/toast(40) | none |
| **접기** | focus only | ✓ | ✗ | ✓ | 최소화 | 닫기 | 자동 소멸 | 접기 |
| **다수 공존** | — | ≤3 | 1+split | 1 | 무제한 | 스택 | 스택 | 다수 |
| **스크롤 락** | — | — | — | — | ✗ | ✓ | ✗ | — |
| **ESC 닫기** | — | — | — | — | 최소화 | ✓(top만) | 일부 | ✓ |
| **ViewKind** | — | panel | surface | panel | panel | — | — | — |

---

## Appendix B: Glossary

| 용어 | 정의 |
|------|------|
| **Layout Type** | UI 컨테이너의 8가지 행동 분류 (Chrome, Dock, Canvas, Tray, Floating, Overlay, Transient, Inline) |
| **Frame** | Layout Type을 구현하는 컨테이너 컴포넌트. View를 담는 틀. 고유 Frame ID를 가짐 |
| **View** | Frame에 배치되는 독립적 기능 UI. ViewKind에 따라 panel 또는 surface |
| **ViewKind** | `"panel"` (Frame 이동 가능) 또는 `"surface"` (Canvas 전용) |
| **ViewDefinition** | View의 정적 정의 (Registry에 등록). 컴포넌트, 아이콘, 허용 Frame 등 |
| **ViewInstance** | View의 런타임 인스턴스. singleton이 아니면 여러 인스턴스 가능 |
| **Surface** | Canvas Frame 내에서 라우팅되는 최상위 View. keep-alive. ViewKind = "surface" |
| **Composite** | Primitive를 조합한 복합 UI 컴포넌트 |
| **Primitive** | 최소 단위 UI 컴포넌트. 도메인 무관 |
| **Token** | 디자인 토큰. CSS 변수 (색상, 간격, 그림자, z-index 등) |
| **Registry** | View/Surface/Overlay를 등록하고 Frame이 조회하는 중앙 저장소 |
| **Activity Bar** | SidebarDock의 세로 아이콘 스트립. View 전환용 |
| **Floating Dock** | 최소화된 Floating 윈도우를 아이콘으로 모아놓는 하단 바 |
| **Floating WM** | Floating Window Manager 서브시스템. 윈도우 생명주기, z-stack, 스냅 관리 |
| **Overlay Stack** | Overlay의 LIFO 스택. ESC는 최상위만 닫음 |
| **Pointer Bridge** | HoverCard에서 트리거와 카드 사이 gap을 안전 영역으로 설정하는 기법 |
| **Detach** | Dock/Tray의 View를 Floating으로 분리. unmount → remount |
| **Attach** | Floating의 View를 원래 Dock/Tray로 복귀. unmount → remount |
| **Intent** | 사용자 의도를 나타내는 액션. Surface/View를 여는 유일한 공식 경로 |
| **dispatchIntentAtom** | Feature/View → Shell 단방향 통신의 유일한 접점. Frame atom 직접 접근 금지 |
| **Import Boundary** | 레이어 간 의존성 규칙. Feature/View는 shellAtoms를 import할 수 없다 |
| **shellBridgeAtoms** | (폐기 예정) Shell atom을 re-export하는 파일. Import Boundary 위반의 근본 원인 |
| **PersistenceScope** | 상태 지속성 범위: none / session / workspace / global |
| **Focus Mode** | TitleBar 숨김 + Dock/Tray 숨김, StatusBar는 유지 |
| **Zen Mode** | 모든 Chrome/Dock/Tray 숨김, Canvas 전체화면 + 타이포그래피 집중 |

---

## Appendix C: Changelog

### v3.0 — Implementation Complete (전 Phase 구현 완료)

| 영역 | 구현 내용 |
|------|----------|
| **Phase 1A** | `viewRegistry.ts` (빈 Map + registerView API), `surfaceRegistry.ts`, `intentRouter.ts` (dispatchIntentAtom) 생성 |
| **Phase 1B** | 7개 feature 디렉토리 생성 (explorer, search, symbols, findings, problems, output, event-log) + terminal 수정. 각 index.ts에서 `registerView()` 자가 등록 |
| **Phase 1C** | 13+1(settings) surface index.ts에서 `registerSurface()` 자가 등록. bootstrapFeatures.ts에 side-effect import 추가 |
| **Phase 2** | `frames/` 디렉토리 생성, 7개 Frame 컴포넌트 이동+리네이밍. Frame들이 viewRegistry/surfaceRegistry 직접 조회 |
| **Phase 3** | 7개 *Panel → *View 리네이밍, features/*/ui/로 이동. explorer/ 하위 디렉토리 포함. backward-compat shim 유지 |
| **Phase 4** | SurfaceTabBar.tsx 삭제, shell/panels/TerminalPanel.tsx 삭제. panelRegistry/surfaceTabs @deprecated 마킹 |
| **Phase 5** | 6개 atom alias 추가 (tray*/activeSidebarView*). 5개 위반 파일 → dispatchIntentAtom 전환. shellBridgeAtoms.ts 삭제. ESLint no-restricted-imports 적용 |
| **Phase 6** | z-index CSS 변수 이미 존재 확인 (--z-floating, --z-floating-dock). Floating 컴포넌트 이미 CSS 변수 사용 |
| **Phase 7** | applyLayoutPresetAtom에 getViewById() 런타임 검증 추가. ZoneManager.loadShellLayout()에 복원 View ID 검증 추가 |

### v2.1 — 분산 자가 등록 + Import Boundary (DX + 아키텍처 강화)

| 섹션 | 변경 |
|------|------|
| §4.0 | **신규** — 분산 자가 등록 설계 원칙. 중앙 배열 vs 자가 등록 비교 테이블 |
| §4.1 ViewRegistry | 중앙 `VIEW_REGISTRY[]` 배열 제거 → 빈 `Map` + `registerView()` API. 자가 등록 예시 코드 추가 |
| §4.2 SurfaceRegistry | 동일 패턴 적용. 자가 등록 예시 코드 추가 |
| §4.5 | **신규** — DX Recipes (Panel View 추가, Surface 추가, Floating 지원 추가, 팀 conflict 시나리오) |
| §7.4 Layout Presets | View ID 참조에 대한 런타임 검증 규칙 추가 |
| §7.5 Intent Routing | **전면 재작성** — 현재 위반 사례 분석, `dispatchIntentAtom` 기반 단방향 흐름 설계, 코드 예시 |
| §7.6 | **신규** — Import Boundary (레이어 간 의존성 규칙, Import 매트릭스, 위반 목록, ESLint 강제, shellBridgeAtoms 폐기) |
| §11.2 디렉토리 구조 | bootstrapFeatures.ts 역할 명시, features/*/index.ts 자가 등록 패턴 반영, 파일 역할 요약 테이블 추가 |
| §13 Migration | Phase 1에 자가 등록 태스크 추가, Phase 5에 Import Boundary 적용 + 위반 파일 마이그레이션 추가 |
| Appendix B | dispatchIntentAtom, Import Boundary, shellBridgeAtoms 용어 추가 |

### v2.0 — 구조적 개선

| 섹션 | 변경 |
|------|------|
| §1 설계 원칙 | "External state for portability" 원칙 추가 |
| §1.1 | **신규** — View Taxonomy (Panel View / Surface View / Non-View UI) |
| §2.1 Chrome | Focus Mode vs Zen Mode 구분 |
| §2.5 Floating | **Window Manager Subsystem**으로 재정의, WM 책임 테이블 추가 |
| §2.6 Overlay | **Overlay vs Transient 행동/의미 계층 분리** 테이블 추가 |
| §3.4 View | Panel Views / Surface Views 테이블 분리, ViewKind 적용 |
| §3.5 Frame | **Frame Identity** (고유 FrameSlot ID) 추가 |
| §4.1 ViewRegistry | v2 필드 추가: availability, singleton, restorable, detachable, preload, persistence, commands |
| §4.1 | FrameSlot에서 `"canvas"` 제거 (Surface는 별도 Registry) |
| §4.3 | **신규** — ViewDefinition vs ViewInstance 다중 인스턴스 모델 |
| §6.1 | `zenModeAtom` 추가 |
| §6.2 | `originFrame`, `instanceId` 필드 추가 |
| §7.2 | **Detach/Attach State Contract** 전면 재작성. DOM reparenting 불가, 외부 store 필수 |
| §7.3 | **신규** — Focus Mode vs Zen Mode 비교 테이블 |
| §7.5 | **신규** — Intent Routing Contract |
| §8 | **신규 섹션** — Persistence Specification (scope, 매핑, workspace restore) |
| §13 | Phase 7 (Persistence + Intent) 추가 |
| Appendix A | ViewKind 행 추가 |
| Appendix B | 12개 용어 추가/업데이트 |
