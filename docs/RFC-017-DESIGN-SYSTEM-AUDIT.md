# RFC-017: Design System Audit & Remediation Plan

**Status:** Draft
**Date:** 2026-03-12
**Author:** Claude Code (audit), songmin (review)

---

## 1. Executive Summary

Semantica IDE의 디자인 시스템은 **토큰 정의는 탄탄하지만, 채택률이 낮고 패턴 중복이 심각**하다.
`index.css`에 75+ 컬러, 7 spacing, 6 radius, 5 duration, 9 shadow 토큰이 정의되어 있으나,
실제 컴포넌트에서는 하드코딩과 프리미티브 우회가 광범위하게 발생하고 있다.

| Category | 건수 | Severity |
|----------|------|----------|
| Hardcoded colors (rgba/hex) | 161건 / 18 files | CRITICAL |
| Hardcoded font-size `text-[Xpx]` | 50+ / 20 files | CRITICAL |
| Fractional spacing (토큰 미매핑) | 1,269건 | CRITICAL |
| Duration 토큰 미사용 | 55건 | HIGH |
| Banner/Card/Badge 패턴 중복 | 54+ components | HIGH |
| Text 프리미티브 우회 | 161 files | HIGH |
| Hardcoded z-index | 6건 | MEDIUM |
| Hardcoded border-radius | 5건 | MEDIUM |
| backdrop-blur 중복 | 6건 | LOW |

---

## 2. Findings

### 2.1 CRITICAL — Hardcoded Colors (161건)

토큰 시스템 외부에서 직접 rgba/hex 값을 사용하는 케이스.

#### 2.1.1 Language / File-type Colors (90+건)

| File | Lines | Example |
|------|-------|---------|
| `shared/ui/primitives/FileIcon.tsx` | 25-313 | `"#3178c6"` (TS), `"#f0db4f"` (JS) 등 90+ hex |
| `features/code-lens/ui/CodeLensCard.tsx` | 39-46 | `"#3178c6"`, `"#f1e05a"` 등 8건 |
| `shared/views/explorer/ui/explorer/ProjectSectionHeader.tsx` | 10-25 | `"#3178c6"`, `"#3572A5"` 등 16건 |

**Solution:** `--color-lang-*` 토큰이 이미 정의되어 있음. 매핑 테이블을 만들어 일괄 교체.

#### 2.1.2 Graph Visualization Colors (20+건)

| File | Lines | Example |
|------|-------|---------|
| `features/graph-diff/ui/GraphCanvas.tsx` | 41-43 | `"#1a7f37"`, `"#cf222e"`, `"#9a6700"` |
| `features/graph-diff/ui/GraphTooltip.tsx` | 47-88 | `"#27272a"`, `"#d4d4d8"` 등 zinc palette |
| `features/graph-diff/ui/GraphLegend.tsx` | 23-34 | `"#22c55e"`, `"#ef4444"` 등 |
| `features/root-cause/ui/CausalChainGraph.tsx` | 15-23 | `rgba(247,118,142,0.12)` 등 |
| `features/system-lens/ui/LensMiniGraph.tsx` | 140-224 | `"#8b5cf6"`, `"#d0d7de"` |
| `widgets/gantt-timeline/GanttTimeline.tsx` | 11-14 | `"#3794ff"`, `"#89d185"` 등 |
| `widgets/semantic-diff/SemanticDiffPanel.tsx` | 13-24 | `"#d18616"`, `"#b267e6"` |

**Solution:** `--color-chart-*` 또는 `--color-graph-*` 시맨틱 토큰 도입.

#### 2.1.3 Shell / UI Chrome Colors (8건)

| File | Lines | Example |
|------|-------|---------|
| `app/shell/frames/TitleBar.tsx` | 148, 203, 343 | `rgba(139,92,246,0.25)`, `rgba(0,0,0,0.35)` |
| `app/shell/ShellStatusBar.tsx` | 235 | `"#2d2b55"` |
| `app/shell/frames/FloatingDock.tsx` | 34 | `rgba(0,0,0,0.3)` shadow |
| `widgets/prompt-box/PromptStatusBar.tsx` | 110 | `"#8b5cf6"` |
| `widgets/resource-monitor/ResourceMonitorPanel.tsx` | 174 | `"#666"` |

**Solution:** `--color-vsc-accent` 계열 토큰 + `--shadow-*` 토큰으로 교체.

---

### 2.2 CRITICAL — Hardcoded Font Sizes (50+건)

`--font-size-*` 토큰이 정의되어 있으나 `text-[Xpx]` 하드코딩이 광범위함.

| Hardcoded | Token Equivalent | 건수 | 주요 파일 |
|-----------|-----------------|------|----------|
| `text-[9px]` | `text-3xs` | 3 | CommitMessageCard, PromptStatusBar |
| `text-[10px]` | `text-2xs` | 12 | ShellStatusBar, TitleBar, FlowsSection, RepoExplainPanel |
| `text-[11px]` | `text-xs` | 15 | ShellStatusBar, EditorTabBar, AgentFrame, ExplorerView |
| `text-[11.25px]` | `text-xs` (근사) | 1 | ShellStatusBar |
| `text-[11.5px]` | `text-xs` (근사) | 1 | ShellStatusBar |
| `text-[12px]` | `text-sm` | 8 | TitleBar, NavBar |
| `text-[13px]` | `text-md` | 6 | TitleBar, NavBar, ExplorerView |

**Worst offenders:**
- `ConversationSearchOverlay.tsx` — 14건
- `ShellStatusBar.tsx` — 5건
- `TitleBar.tsx` — 7건
- `OutputView.tsx` — 9건

**Solution:** 일괄 `text-[Xpx]` → `text-{token}` 치환.

---

### 2.3 CRITICAL — Fractional Spacing (1,269건)

CSS 토큰 스케일(`--space-xs: 4px` ~ `--space-3xl: 48px`)에 **2px, 6px, 10px 단계가 누락**되어
개발자들이 Tailwind 프랙셔널 값을 대량 사용.

| Class | Count | px | 가장 가까운 토큰 |
|-------|-------|----|----------------|
| `gap-0.5` | 66 | 2px | 없음 |
| `gap-1.5` | 285 | 6px | 없음 |
| `gap-2.5` | 21 | 10px | 없음 |
| `p-0.5` / `py-0.5` / `px-0.5` | 280 | 2px | 없음 |
| `p-1.5` / `py-1.5` / `px-1.5` | 514 | 6px | 없음 |
| `p-2.5` / `py-2.5` / `px-2.5` | 102 | 10px | 없음 |

**Solution:** 스페이싱 스케일 확장:

```css
--space-2xs: 2px;   /* gap-0.5 대응 */
--space-xs:  4px;   /* 기존 유지 */
--space-sm:  6px;   /* NEW — gap-1.5 대응 (기존 8px에서 조정) */
--space-md:  8px;   /* NEW (기존 12px에서 조정) */
--space-lg:  12px;  /* 기존 유지 */
--space-xl:  16px;  /* 기존 유지 */
--space-2xl: 24px;  /* 기존 유지 */
--space-3xl: 32px;  /* 기존 유지 */
--space-4xl: 48px;  /* 기존 유지 */
```

> Note: 스케일을 변경하면 기존 `--space-sm`(8px), `--space-md`(12px) 참조 전수 조사 필요.
> 대안으로 기존 스케일 유지하며 누락 단계만 추가하는 방식도 가능.

---

### 2.4 HIGH — Duration Token 미사용 (55건)

`--duration-*` 토큰이 정의되어 있으나, Tailwind `duration-*` 클래스가 토큰과 연결되지 않음.

| Hardcoded | Token Equivalent | 건수 |
|-----------|-----------------|------|
| `duration-75` | `--duration-instant` (0ms) / custom | 1 |
| `duration-100` | `--duration-fast` (80ms) 근사 | 15 |
| `duration-150` | `--duration-normal` (120ms) 근사 | 24 |
| `duration-200` | `--duration-slow` (180ms) 근사 | 13 |
| `duration-300` | `--duration-glacial` (250ms) 근사 | 1 |
| `duration-500` | 없음 | 2 |

**Solution:** `tailwind.config`에서 `transitionDuration` 확장하여 토큰 매핑:
```js
transitionDuration: {
  instant: 'var(--duration-instant)',
  fast:    'var(--duration-fast)',
  normal:  'var(--duration-normal)',
  slow:    'var(--duration-slow)',
  glacial: 'var(--duration-glacial)',
}
```

---

### 2.5 HIGH — Component Pattern Duplication

#### 2.5.1 Banner 중복 (7개 독립 구현)

`InlineBanner` 프리미티브가 있으나 5개 위젯이 자체 배너 스타일 재구현:

| Component | Uses InlineBanner? | Custom Styling |
|-----------|-------------------|----------------|
| `InlineBanner` (shared) | base | `rounded-lg` + icon + variant colors |
| `ContextBanner` | YES | InlineBanner + ContextBreakdownBar |
| `ApprovalBanner` | NO | `bg-vsc-warning/5` + custom layout |
| `ScopeViolationBanner` | NO | Icon + text + buttons |
| `PatchSimulationBanner` | NO | Expandable, risk-based colors |
| `PlanModeBanner` | NO | `bg-vsc-info/5` + StepTimeline |
| `IssuePipelineBanner` | NO | Badge + StepTimeline |
| `BudgetAlerts` | NO | Container + alert divs |

**Solution:** `InlineBanner`에 `neutral`, `accent` variant 추가 + `actions` slot 지원.

#### 2.5.2 Card 중복 (37개 독립 구현, CardBase 없음)

공통 패턴: `border + gap-2 + p-3 + rounded-lg + hover:bg-*`를 각각 재구현.

| Component | Styling |
|-----------|---------|
| `AgentCard` | CVA variants (유일하게 체계적) |
| `CodeLensCard` | `backdrop-blur-sm border-vsc-border/20 rounded-lg` |
| `ImpactScoreCard` | `bg-vsc-surface-1 border-vsc-border/15 rounded-md` |
| `SearchResultCard` | Custom padding/border |
| 33개 추가... | 각각 border opacity, padding, radius 다름 |

**Solution:** `CardBase` 컴포지트 도입 (`AgentCard`의 CVA 패턴 참조).

#### 2.5.3 Badge 중복 (12개 커스텀 구현)

`Badge` 프리미티브(CVA 기반)가 있으나 12개 위젯이 자체 뱃지 구현:

`ImpactSeverityBadge`, `DocStatusBadge`, `ExitCodeBadge`, `LensGutterBadge`,
`ProvenanceBadge`, `CompactResultBadge`, `McpStatusBadge`, `PipelineBadge`,
`SessionCostBadge`, `FilePermalinkBadge`, `IndexStatusBadge`, `ConflictBadge`

**Solution:** `Badge` CVA에 domain-specific variant 추가하거나, 각 뱃지가 `Badge`를 래핑하도록 리팩터.

#### 2.5.4 ListRow 우회 (7건)

`ListRow` 프리미티브가 있으나 동일한 `hover:bg-vsc-list-hover` 패턴을 재구현:

`SessionRow`, `ToolCallRow`, `FileChangeRow`, `WorkspaceFileRow`, `NodeRow`, `AffectedPathRow`, `CauseCandidateRow`

#### 2.5.5 Text 프리미티브 우회 (161 files)

`<Text>` 컴포넌트 대신 `<span className="text-vsc-*">` 직접 사용.

**Top 10 worst offenders:**

| File | 건수 |
|------|------|
| `IntentBar.tsx` | 14 |
| `TaskDetailPanel.tsx` | 12 |
| `FindingsView.tsx` | 11 |
| `IntentTab.tsx` | 11 |
| `ConversationSearchOverlay.tsx` | 10 |
| `SymbolsView.tsx` | 9 |
| `SearchView.tsx` | 9 |
| `ProblemsView.tsx` | 9 |
| `ModulesSection.tsx` | 9 |
| `DiffLegend.tsx` | 9 |

---

### 2.6 MEDIUM — Hardcoded z-index (6건)

| File | Line | Value | Should Be |
|------|------|-------|-----------|
| `terminal/ui/AICommandInput.tsx` | 72 | `z-[22]` | `z-[--z-overlay]` (20) |
| `terminal/ui/CommandSearchOverlay.tsx` | 252 | `z-[24]` | `z-[--z-overlay]` |
| `terminal/ui/AIExplainPopover.tsx` | 63, 67 | `z-[22]`, `z-[23]` | `z-[--z-overlay]` |
| `terminal/ui/JumpToBottom.tsx` | 30 | `z-[15]` | `z-[--z-floating]` (15) |
| `terminal/ui/AIGhostText.tsx` | 37 | `z-[11]` | `z-[--z-sticky]` (10) |

---

### 2.7 MEDIUM — Hardcoded Border Radius (5건)

| File | Lines | Value | Should Be |
|------|-------|-------|-----------|
| `app/shell/frames/NavBar.tsx` | 135, 161, 186, 275 | `rounded-[8px]` | `rounded-lg` |
| `features/graph-diff/ui/DiffToolbarExtension.tsx` | 43 | `rounded-[3px]` | `rounded-sm` |

---

### 2.8 LOW — backdrop-blur 중복 (6건)

`Dialog`, `AlertDialog`, `SlideDrawer`, `BottomSheet`, `SessionSwitcher`, `FeaturePanel` 모두
`backdrop-blur-[2px]` 하드코딩. `--blur-overlay: 2px` 토큰으로 통일 권장.

---

### 2.9 POSITIVE — Well-Designed Areas

- **Overlay/Modal 시스템**: `OverlayPortal` + `useOverlayBehavior` 일관적 사용
- **Border radius**: 514건 중 509건이 토큰 매핑 (`rounded-sm` ~ `rounded-full`)
- **Shadow tokens**: 59건 중 대부분 `shadow-sm/md/lg` 사용
- **z-index tokens**: 50건 중 44건이 `z-[--z-*]` 패턴 사용

---

## 3. Remediation Plan

### Phase 1: Quick Wins (Low Risk, High Impact)

| # | Task | Files | Effort |
|---|------|-------|--------|
| 1.1 | `text-[Xpx]` → `text-{token}` 일괄 치환 | 20 files | S |
| 1.2 | `rounded-[8px]` → `rounded-lg`, `rounded-[3px]` → `rounded-sm` | 2 files | XS |
| 1.3 | 하드코딩 z-index → `z-[--z-*]` 토큰 | 5 files | XS |
| 1.4 | `backdrop-blur-[2px]` → `backdrop-blur-overlay` 토큰 | 6 files | XS |

### Phase 2: Token Infrastructure (Foundation)

| # | Task | Scope | Effort |
|---|------|-------|--------|
| 2.1 | Spacing 스케일에 누락 단계 추가 (`--space-2xs`, 등) | index.css + tailwind.config | S |
| 2.2 | Duration 토큰을 Tailwind에 매핑 | tailwind.config | XS |
| 2.3 | `--color-lang-*` 토큰 매핑 테이블 작성 | index.css | S |
| 2.4 | `--color-chart-*` 그래프용 시맨틱 토큰 도입 | index.css | S |

### Phase 3: Component Consolidation (High Impact)

| # | Task | Components | Effort |
|---|------|-----------|--------|
| 3.1 | `InlineBanner` variant 확장 → 5개 배너 리팩터 | 7 files | M |
| 3.2 | `CardBase` 컴포지트 도입 → top 10 카드 마이그레이션 | 11 files | M |
| 3.3 | 커스텀 Badge → `Badge` CVA 확장 | 12 files | M |
| 3.4 | ListRow 우회 컴포넌트 → `ListRow` 래핑 | 7 files | S |

### Phase 4: Primitive Adoption (Long-tail)

| # | Task | Scope | Effort |
|---|------|-------|--------|
| 4.1 | Top 10 Text 우회 파일 → `<Text>` 마이그레이션 | 10 files | M |
| 4.2 | Shell hardcoded colors → 토큰 교체 | 5 files | S |
| 4.3 | Graph hardcoded colors → `--color-chart-*` 교체 | 8 files | M |
| 4.4 | Language colors → `--color-lang-*` 교체 | 3 files | S |

### Phase 5: Guardrails (Prevention)

| # | Task | Effort |
|---|------|--------|
| 5.1 | ESLint rule: `no-hardcoded-color` (rgba/hex in TSX) | S |
| 5.2 | ESLint rule: `no-arbitrary-text-size` (`text-[Xpx]` 금지) | S |
| 5.3 | ESLint rule: `no-hardcoded-z-index` (numeric z-[N] 금지) | XS |
| 5.4 | Storybook 토큰 문서 페이지 | M |

---

## 4. Priority Matrix

```
Impact
  ^
  |  P1(1.1-1.4)   P3(3.1-3.4)
  |     Quick          Component
  |     Wins           Consolidation
  |
  |  P2(2.1-2.4)   P4(4.1-4.4)
  |     Token          Primitive
  |     Infra          Adoption
  |
  +-------------------------> Effort
       Low              High
```

**Recommended execution order:** P1 → P2 → P3 → P4 → P5

---

## 5. Out of Scope

- Spacing 프랙셔널 값의 일괄 제거 (1,269건은 점진적 마이그레이션)
- Text 프리미티브 161 파일 전수 교체 (Top 10만 우선)
- Overlay/Modal 시스템 (이미 잘 설계됨, 변경 불필요)

---

## 6. Success Metrics

| Metric | Current | Target (P1-P3 완료 후) |
|--------|---------|----------------------|
| Hardcoded colors | 161건 | < 20건 (lang colors 제외) |
| `text-[Xpx]` | 50건 | 0건 |
| Hardcoded z-index | 6건 | 0건 |
| Banner 중복 구현 | 6개 | 1개 (InlineBanner variants) |
| Card 패턴 비표준 | 37개 | < 15개 |
| Badge 중복 | 12개 | < 5개 |
