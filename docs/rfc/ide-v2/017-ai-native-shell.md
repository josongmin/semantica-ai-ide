# RFC-017: AI-Native Shell — Dashboard-Style Navigation

**Status:** Draft
**Author:** System
**Date:** 2025-03-10
**Depends on:** RFC-016 (Layout System)

---

## 1. Motivation

현재 Semantica IDE는 전통적인 IDE 레이아웃(VSCode 패턴)을 따르고 있다:
- 아이콘 스트립 + 사이드바 콘텐츠 패널
- 에디터 중심 캔버스
- 하단 트레이 (Problems, Output, Terminal)

그러나 Semantica의 핵심 가치는 **AI Agent 중심 워크플로우**이며, 전통적 에디터 중심 레이아웃은 이에 맞지 않는다. Cube Cloud, Render, Linear 등 SaaS 대시보드처럼 **카테고리 기반 내비게이션**으로 전환하여 각 기능이 풀페이지 뷰를 차지하는 AI-native 경험을 제공한다.

### 비전 참고 (Cube Cloud IDE)

```
┌────┬──────────────────────────────────────────┐
│ 🏠 │  IDE    Workbooks                         │  ← 상단 모드 탭
│ 📋 ├────────────────────────────────────────────┤
│ 📊 │  ← Exit development mode    Compiling...  │  ← 서브헤더/상태바
│ 🔗 ├──────────┬─────────────────────────────────┤
│    │ Explorer │  Editor / Content Area          │
│ ↕  │  (tree)  │                                 │
│ 🕐 │          │                                 │
│ 💬 │          │                                 │
│ ⚡ │          │                                 │
│ 🔒 ├──────────┴─────────────────────────────────┤
│    │                                            │
│ ⚙  │  (하단 도구: Terminal, DB 등)              │
└────┴────────────────────────────────────────────┘
```

---

## 2. Goals

1. **카테고리 내비게이션**: 좌측 아이콘 스트립을 기능 카테고리로 재편
2. **풀페이지 뷰**: FeatureSheet → 풀 콘텐츠 영역으로 승격
3. **직각 디자인 시스템**: 모든 `rounded-*` 제거, 직선 디자인
4. **점진적 마이그레이션**: 기존 ViewRegistry + FeatureSheet + IntentRouter 인프라 유지
5. **IDE 모드 보존**: 기존 에디터+사이드바+트레이 레이아웃은 "IDE" 카테고리 내에서 그대로 유지

---

## 3. Design System Changes

### 3.1 Border Radius — Sharp Corners

**Before:**
```css
/* index.css @theme block */
--radius-sm: 2px;
--radius-md: 4px;
--radius-lg: 6px;
--radius-full: 9999px;
```

**After:**
```css
--radius-sm: 0px;
--radius-md: 0px;
--radius-lg: 0px;
--radius-full: 9999px;  /* badges/dots만 유지 */
```

**영향 범위:**
| Component | Current | After |
|-----------|---------|-------|
| Shell frames (FloatingFrame, TrayFrame tabs) | `rounded-lg`, `rounded-md`, `rounded-sm` | `rounded-none` (token이 0이므로 자동 적용) |
| Buttons (TitleBar, SidebarFrame) | `rounded-md`, `rounded-lg` | sharp |
| Input fields, dropdowns | `rounded-md` | sharp |
| Cards, panels | `rounded-lg` | sharp |
| Toast, tooltip | `rounded-md` | sharp |
| Badges, status dots | `rounded-full` | **유지** (원형 필요) |

> **마이그레이션**: CSS token 값만 0으로 변경하면 Tailwind `rounded-sm/md/lg` 사용하는 모든 컴포넌트에 일괄 적용됨. `rounded-full`은 별도 token이므로 영향 없음.

### 3.2 Shadows — Flatter

현재 `glass-panel` 블러 효과와 다층 그림자를 사용 중. 대시보드 스타일에서는 보더 구분선 위주로 전환.

**Before:**
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.08);
--shadow-md: 0 2px 6px rgba(0, 0, 0, 0.12);
--shadow-lg: 0 3px 10px rgba(0, 0, 0, 0.18);
```

**After:**
```css
--shadow-sm: none;
--shadow-md: 0 1px 3px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 2px 8px rgba(0, 0, 0, 0.15);
```

플로팅 윈도우(`--shadow-panel`, `--shadow-modal`)는 유지.

### 3.3 Border Emphasis

직각 디자인에서 영역 구분은 **보더**가 핵심. 현재 `border-vsc-border/40` (반투명)을 사용하는 곳이 많은데, 가시성을 높여야 함.

```css
/* 추가 token */
--color-vsc-divider: color-mix(in srgb, var(--color-vsc-border) 60%, transparent);
```

### 3.4 Typography — No Changes

현재 `--font-size-*` 토큰, `--line-height-*` 토큰은 변경 없음.

---

## 4. Navigation Architecture

### 4.1 NavCategory — New Concept

현재 ViewRegistry의 `FrameSlot`은 물리적 위치(`dock-left`, `tray` 등)를 나타낸다. 새로 **논리적 카테고리**를 도입한다.

```typescript
// src/app/shell/model/navRegistry.ts (NEW)

export type NavCategoryId =
  | "ide"           // Explorer, Editor, Search, Symbols
  | "agent"         // Chat, Background Agents, Pipeline, Intent
  | "graph"         // Knowledge Graph, Relations
  | "intelligence"  // Code Intelligence, Findings, Analysis
  | "architecture"  // Module Map, Dependencies, Architecture
  | "security"      // Vulnerability Scan, Audit, Review
  | "monitor";      // Jobs, Activity, Event Log

export interface NavCategory {
  readonly id: NavCategoryId;
  readonly label: string;
  readonly icon: string;
  readonly priority: number;  // sort order
}

export interface NavItem {
  readonly id: string;           // viewId or featureSheetId
  readonly categoryId: NavCategoryId;
  readonly label: string;
  readonly icon: string;
  readonly kind: "view" | "sheet" | "surface";
  readonly priority?: number;
  readonly badge?: () => number | boolean;  // reactive badge
}
```

### 4.2 Sidebar Transformation

**현재 SidebarFrame 구조:**
```
┌──────────┐
│IconStrip │ ← ViewRegistry "dock-left" 뷰들의 아이콘
│ (40px)   │
│          │
│          │
│──spacer──│
│          │
│ tray뷰들 │ ← ViewRegistry "tray" 뷰들의 아이콘
├──────────┤
│ Content  │ ← 선택된 뷰의 콘텐츠 렌더
│  Area    │
└──────────┘
```

**새로운 NavSidebar 구조:**
```
┌──────────┐
│ LOGO     │ ← 앱 로고 (Semantica)
│──────────│
│ 🖥 IDE   │ ← NavCategory: ide (active → 기존 IDE 레이아웃)
│ 🤖 Agent │ ← NavCategory: agent (active → 에이전트 대시보드)
│ 🔗 Graph │ ← NavCategory: graph
│ 🧠 Intel │ ← NavCategory: intelligence
│ 🏗 Arch  │ ← NavCategory: architecture
│ 🔒 Sec   │ ← NavCategory: security
│ 📊 Mon   │ ← NavCategory: monitor
│          │
│──spacer──│
│          │
│ 🖥 Term  │ ← 하단 도구: Terminal
│ 🗄 DB    │ ← 하단 도구: DB Connection
│ ⚙ Set   │ ← Settings
└──────────┘
```

### 4.3 Content Area Modes

NavCategory 선택에 따라 메인 콘텐츠 영역이 달라진다:

| Category | Content Mode | 설명 |
|----------|-------------|------|
| `ide` | **Classic Shell** | 기존 ShellLayout (sidebar explorer + editor + tray) |
| `agent` | **Dashboard** | Agent chat 풀페이지 + FeatureSheet 서브패널 |
| `graph` | **Surface** | Graph surface 풀페이지 |
| `intelligence` | **Dashboard** | Findings, Analysis 리스트뷰 |
| `architecture` | **Dashboard** | Module map, dependency graph |
| `security` | **Dashboard** | Vulnerability 스캔 결과 |
| `monitor` | **Dashboard** | Jobs, Activity 리스트뷰 |

**핵심**: `ide` 카테고리는 기존 6-zone ShellLayout을 그대로 embed.

```typescript
// src/app/shell/model/shellAtoms.ts (MODIFIED)

export const activeNavCategoryAtom = atom<NavCategoryId>("ide");

// ShellLayout은 activeNavCategory === "ide"일 때만 기존 레이아웃 표시
// 다른 카테고리일 때는 해당 카테고리의 풀페이지 콘텐츠 표시
```

---

## 5. Layout Structure Change

### 5.1 Before (RFC-016)

```
┌─────────────────────────────────────────────┐
│ TitleBar (surface tabs + GNB)              │
├──────────┬──────────────────┬───────────────┤
│ Sidebar  │ Canvas           │ Agent Panel   │
│ (icon +  │ (surfaces)       │ (chat)        │
│  content)│                  │               │
│          ├──────────────────┤               │
│          │ Tray             │               │
├──────────┴──────────────────┴───────────────┤
│ StatusBar                                   │
└─────────────────────────────────────────────┘
```

### 5.2 After (RFC-017)

```
┌────┬────────────────────────────────────────┐
│Nav │ TitleBar (context-aware header)        │
│Bar ├────────────────────────────────────────┤
│    │                                        │
│ 🖥 │  Content Area                          │
│ 🤖 │  (mode depends on active category)     │
│ 🔗 │                                        │
│ 🧠 │  ┌─ ide mode ──────────────────────┐  │
│ 🏗 │  │ Explorer │ Editor  │ Agent Panel│  │
│ 🔒 │  │          │         │            │  │
│ 📊 │  │          │ Tray    │            │  │
│    │  └──────────────────────────────────┘  │
│────│                                        │
│ 🖥 │  ┌─ dashboard mode ────────────────┐  │
│ 🗄 │  │ Full-page feature content       │  │
│ ⚙ │  │                                 │  │
│    │  └─────────────────────────────────┘  │
├────┴────────────────────────────────────────┤
│ StatusBar                                   │
└─────────────────────────────────────────────┘
```

### 5.3 NavBar Width

| State | Width |
|-------|-------|
| Collapsed (아이콘만) | 48px |
| Expanded (아이콘+라벨) | 200px |
| Hover-expand | 48px → 200px (overlay, `duration-normal`) |

Collapsed/Expanded 전환은 하단 토글 버튼 또는 `Cmd+B` 단축키.

---

## 6. Component Changes

### 6.1 New Components

| Component | Path | 역할 |
|-----------|------|------|
| `NavBar` | `src/app/shell/frames/NavBar.tsx` | 좌측 내비게이션 바 |
| `NavBarItem` | (NavBar 내부) | 개별 카테고리 아이콘+라벨 |
| `DashboardLayout` | `src/app/shell/frames/DashboardLayout.tsx` | 비-IDE 카테고리용 풀페이지 레이아웃 |
| `NavContextHeader` | `src/app/shell/frames/NavContextHeader.tsx` | 카테고리별 컨텍스트 헤더 (TitleBar 대체) |

### 6.2 Modified Components

| Component | 변경 내용 |
|-----------|----------|
| `ShellLayout.tsx` | NavBar 추가, `activeNavCategoryAtom` 기반 조건부 렌더링 |
| `SidebarFrame.tsx` | NavBar로 아이콘 스트립 이관, 순수 콘텐츠 패널만 남김 |
| `TitleBar.tsx` | Surface 탭 로직 → NavContextHeader로 이동, 단순화 |
| `ShellStatusBar.tsx` | 변경 없음 |

### 6.3 Deleted Components

| Component | 이유 |
|-----------|------|
| `FeatureBar` (이미 제거됨) | GNB 갤러리로 통합 완료 |

---

## 7. State Changes

### 7.1 New Atoms

```typescript
// shellAtoms.ts에 추가
export const activeNavCategoryAtom = atom<NavCategoryId>("ide");
export const navBarCollapsedAtom = atom(true);  // 기본 collapsed
export const toggleNavBarAtom = atom(null, (get, set) => {
  set(navBarCollapsedAtom, !get(navBarCollapsedAtom));
});
```

### 7.2 Intent Router Extension

```typescript
// intentRouter.ts IntentAction 확장
type IntentAction =
  | { action: "navigate"; categoryId: NavCategoryId }
  | { action: "show-view"; viewId: string }
  // ... 기존 액션들 유지
```

### 7.3 Layout Preset Extension

```typescript
// 기존 LayoutPreset에 navCategory 추가
export type LayoutPreset = "coding" | "review" | "debug" | "presentation" | "agent-only" | "dashboard";

// agent-only 프리셋 → activeNavCategory: "agent"로 매핑
```

---

## 8. CSS Token Changes Summary

| Token | Before | After | Impact |
|-------|--------|-------|--------|
| `--radius-sm` | 2px | 0px | 모든 `rounded-sm` 직각화 |
| `--radius-md` | 4px | 0px | 모든 `rounded-md` 직각화 |
| `--radius-lg` | 6px | 0px | 모든 `rounded-lg` 직각화 |
| `--radius-full` | 9999px | 9999px | 변경 없음 (badges) |
| `--shadow-sm` | box-shadow | none | 플랫 디자인 |
| `--shadow-md` | box-shadow | 경량화 | 플랫 디자인 |
| `--color-vsc-divider` | (신규) | border 60% | 영역 구분선 |
| `--nav-bar-w` | (신규) | 48px | NavBar collapsed 너비 |
| `--nav-bar-w-expanded` | (신규) | 200px | NavBar expanded 너비 |

---

## 9. Migration Plan

### Phase 1: Design Token (직각 디자인)
1. `index.css`의 `--radius-sm/md/lg` → `0px`
2. `--shadow-sm` → `none`
3. `--color-vsc-divider` 토큰 추가
4. 시각적 검증 — 깨지는 UI 확인 및 수정

### Phase 2: NavBar 도입
1. `navRegistry.ts` 생성 — NavCategory/NavItem 타입 + 레지스트리
2. `NavBar.tsx` 생성 — collapsed 아이콘 내비게이션
3. `ShellLayout.tsx` 수정 — TitleBar 좌측에 NavBar 배치
4. `activeNavCategoryAtom` 추가, 기본값 `"ide"`
5. 이 단계에서는 `ide` 카테고리만 동작 (기존 레이아웃 그대로)

### Phase 3: SidebarFrame 분리
1. SidebarFrame에서 아이콘 스트립 제거 (NavBar가 대체)
2. SidebarFrame → 순수 콘텐츠 패널
3. IDE 카테고리 내에서 기존 Explorer/Search/Symbols 뷰 유지

### Phase 4: Dashboard 모드
1. `DashboardLayout.tsx` 생성
2. 비-IDE 카테고리 선택 시 DashboardLayout 렌더
3. FeatureSheet → DashboardLayout 내 풀페이지 뷰로 승격
4. TitleBar → NavContextHeader (카테고리별 컨텍스트 헤더)

### Phase 5: 카테고리별 콘텐츠
1. Agent 카테고리: Chat 풀페이지 + 우측 서브패널
2. Graph 카테고리: Graph surface 풀페이지
3. Intelligence/Security/Monitor: 각 대시보드 뷰 구현

---

## 10. Backward Compatibility

- **IDE 모드**: `activeNavCategoryAtom === "ide"`일 때 기존 ShellLayout 100% 동일
- **ViewRegistry**: 변경 없음. `FrameSlot` 시스템 유지
- **FeatureSheet**: 유지. Dashboard 모드에서 풀페이지로 승격만
- **IntentRouter**: `navigate` 액션 추가만, 기존 액션 유지
- **키보드 단축키**: 기존 단축키 유지, NavBar 전환용 단축키 추가

---

## 11. Open Questions

1. **NavBar hover-expand vs click-expand**: Hover로 임시 확장 vs 토글 클릭? (Cube Cloud은 항상 collapsed)
2. **IDE 카테고리 내 서브 내비게이션**: 기존 Explorer/Search 전환을 어디서? NavBar 서브메뉴 or 기존 SidebarFrame 유지?
3. **Agent 카테고리 레이아웃**: Chat을 캔버스 영역에 풀로? 아니면 좌측 대화목록 + 우측 채팅?
4. **Terminal/DB를 하단 도구로 분리할 것인가**: NavBar 하단 고정 vs 별도 카테고리?

---

## 12. Design References

- [Cube Cloud IDE](https://cube.dev) — 아이콘 스트립 + 모드 탭 + 트리 탐색기
- [Render Dashboard](https://render.com) — 카테고리 좌측 내비 + 풀페이지 콘텐츠
- [Linear](https://linear.app) — 좌측 내비 collapsed/expanded 토글
- [Cursor](https://cursor.sh) — AI-native IDE (에디터 유지하되 AI 통합)
