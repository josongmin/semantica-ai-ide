# RFC (Request for Comments)

Agent UX 플러그인 설계 문서. 아키텍처와 구현 결정을 SSOT로 고정한다.

**프로젝트 범위**: [SCOPE](SCOPE.md) — 이 레포는 Agent UX **프론트엔드**만 구현. 뒷단(추론, 도구 실행, ModelPort 등)은 별도.

**불변 원칙**: [AGENT-UX-CONSTITUTION](../schemas/agent-ux/AGENT-UX-CONSTITUTION.md)

---

## 1. 문서 짜임새

### 1.1 계층

```
[Core]      000-006   아키텍처, 프로토콜, SSOT, 정합성
[Extension] 007-010, 013, 016-017, 020  에러/플러그인/개발/FSD/IR/업그레이드/Monorepo/3채널
[Backend]   011-012, 014-015, 018-019  Quanta/Model/Trajectory/Runtime/수렴 (별도 구현)
```

| 계층 | RFC | 역할 |
|------|-----|------|
| **Core** | [000](000.md) | 아키텍처, 3층, IR, Tool, Gate |
| | [001](001.md) | 3-버스, 성능 스택, 프로토콜 |
| | [002](002.md) | Webview 렌더러 뼈대 |
| | [003](003.md) | Jotai, perfCollector |
| | [004](004.md) | gate-performance, Test Harness |
| | [005](005.md) | 운영 모델, ModelPort, Blob, Event Log |
| | [006](006.md) | **정합성 SSOT** (Delta, Tool, Gate, Phase) |
| **Extension** | [007](007.md) | 에러 처리, Recovery UX |
| | [008](008.md) | 플러그인 SDK, Contribution API |
| | [009](009.md) | 로컬 개발 워크플로우 |
| | [010](010.md) | Feature-Sliced Design |
| | [013](013.md) | IR v2 (reversible) |
| | [016](016.md) | SOTA++ 업그레이드 (binary, queue, blob) |
| | [017](017.md) | Monorepo 아키텍처, 패키지 경계 잠금 |
| | [020](020.md) | 3채널 아키텍처 잠금 |
| **Backend** | [011](backend/011.md) ~ [019](backend/019.md) | [backend/](backend/README.md) |

### 1.2 의존 관계

```
000 (아키텍처)
├── 001 (성능/스택) ─┬─ 002 (렌더러) ─┬─ 003 (Jotai)
│                    │                  └─ 004 (gate-perf)
│                    └── 005 (운영 모델)
└── 006 (정합성 SSOT) ← 000~005 모순 해소
      ├── 007 (에러)  008 (플러그인)  009 (로컬 개발)
      ├── 010 (FSD)    013 (IR v2)  016 (SOTA++ 업그레이드)
      ├── 017 (Monorepo, 패키지 경계)  020 (3채널 잠금)
      ├── 021 (Surface Lifecycle & Layout)
      └── backend: 011 (Quanta) 012 (Model) 014~015 018~019
```

---

## 2. SOTA 버전 정의 (이 프로젝트 관련)

| 버전 | RFC 범위 | 기준 |
|------|----------|------|
| SOTA v0 | 000-002 | 초기 카탈로그 |
| **SOTA++ v1** | 000-010 | 제품급. Gate 강제, Fixture 3종, SSOT |
| **SOTA++ v2** | 000-016 | 업그레이드. Binary, ring buffer, blob 포맷 |
| **Monorepo** | 017 | Monorepo 아키텍처, 패키지 경계, Adapter |
| **3채널** | 020 | VSCode/IntelliJ/Web, Protocol First, Gate 세트 |

- SOTA++ v2 = SOTA++ + [RFC-016](016.md) (성능 업그레이드)
- Monorepo = [RFC-017](017.md) (구조 잠금)
- 뒷단 SOTA+++ (015, 018, 019) = [backend/](backend/README.md)

---

## 3. 읽기 경로

### 3.0 필수 정리 문서 (먼저 읽기)

1. [REPO-STRUCTURE](REPO-STRUCTURE.md) - P0 레포 구조 (도메인 + FSD)
2. [REF-CONSOLIDATION](REF-CONSOLIDATION.md) 5절 - P0 Gate 4개, 9절 - 구현 우선순위
3. [GLOSSARY](GLOSSARY.md) - 용어 통일

### 3.1 프론트엔드 구현자 (Webview/React)

**필수 읽기 순서:**

1. [001](001.md) Webview 성능 및 구현 스택 (React 19, TanStack Virtual, Jotai, 3-버스, DELTA_BATCH)
2. [002](002.md) 메시지 렌더러 뼈대 (virtualList, store, streaming, inputBuffer + 16ms commit)
3. [003](003.md) Jotai + perfCollector (atom-per-message, coalesce, 성능 측정)
4. [004](004.md) gate-performance, Playwright gate runner, testHarness (`window.__agentUx`)
5. [009](009.md) 로컬 개발 워크플로우 (mock-host, fixture-loader, webview-dev)
6. [010](010.md) Feature-Sliced Design (app/pages/widgets/features/entities/shared)
7. [016](016.md) 11절 — 프론트엔드 갭 분석 및 우선 구현 순서 (현재 vs RFC-001, types.ts → perfCollector → testHarness → store → streaming → MessageRow → VirtualMessageList → App)

**프론트엔드 핵심 스택 (RFC-001 고정):** React 19 + TanStack Virtual + Tailwind, Jotai atom-per-item, XState v5, DELTA_BATCH만 수신, 16ms commit 상한, virtualization 필수.

### 3.2 아키텍트 (전체 이해)

1. [000](000.md) 아키텍처
2. [006](006.md) 정합성 SSOT
3. [AGENT-UX-CONSTITUTION](../schemas/agent-ux/AGENT-UX-CONSTITUTION.md)

### 3.3 구현자 (Phase 순)

1. [000](000.md) [001](001.md) [006](006.md)
2. [002](002.md) [003](003.md) [004](004.md)
3. [005](005.md) [007](007.md) [008](008.md) [009](009.md)

### 3.4 Gate/SSOT 유지보수

1. [006](006.md) 2절 SSOT 구조, 8절 Gate
2. `schemas/agent-ux/gates/gates.v1.yaml` ([RFC-017](017.md) 2.2절: gates/ → schemas/ 이동)
3. [REF-CONSOLIDATION](REF-CONSOLIDATION.md)

---

## 4. SSOT 참조 (단일 테이블)

| 항목 | SSOT |
|------|------|
| 아키텍처, IR, 상태 머신 | [RFC-000](000.md) |
| 3-버스, 프로토콜, 성능 규칙 | [RFC-001](001.md), [RFC-005](005.md) |
| Delta, workspace 도구, Tool 네임스페이스, Gate | [RFC-006](006.md) |
| SSOT 폴더 구조 | [RFC-006](006.md) 2절 |
| Phase 정렬 | [RFC-006](006.md) 7절 |
| FSD 코드 구조 | [RFC-010](010.md), [2025-03-10-도메인-우선-FSD-하위-구조-전환](2025-03-10-도메인-우선-FSD-하위-구조-전환.md) |
| IR v2 (PlanIR/PatchIR/RunIR) | [RFC-013](013.md) |
| Binary, queue, blob 포맷 | [RFC-016](016.md) |
| Monorepo 구조, 패키지 경계, Adapter 전략 | [RFC-017](017.md) |
| **3채널 잠금: VSCode/IntelliJ/Web, Protocol First, Gate 세트** | [RFC-020](020.md) |
| **Surface Lifecycle, Per-Surface Layout, Eviction, Guard** | [RFC-021](021.md) |
| analysis.*, Model, Trajectory, Runtime, 수렴 | [backend/](backend/README.md) (011, 012, 014, 015, 018, 019) |

---

## 5. RFC 메타 (요약)

| RFC | 제목 | 상태 |
|-----|------|------|
| [000](000.md) | Agent UX 아키텍처 | Accepted |
| [001](001.md) | Webview 성능 및 구현 스택 | Accepted |
| [002](002.md) | 메시지 렌더러 뼈대 | Accepted |
| [003](003.md) | Jotai + perfCollector | Accepted |
| [004](004.md) | gate-performance 및 Test Harness | Accepted |
| [005](005.md) | 운영 모델 및 유스케이스 확장 | Accepted |
| [006](006.md) | 정합성 통합 및 SOTA++ 확정 | Accepted |
| [007](007.md) | 에러 처리 및 복구 UX | Accepted ([REVIEW](RFC-007-009-REVIEW.md)) |
| [008](008.md) | 플러그인 SDK 및 Contribution API | Accepted ([REVIEW](RFC-007-009-REVIEW.md)) |
| [009](009.md) | 로컬 개발 워크플로우 | Accepted ([REVIEW](RFC-007-009-REVIEW.md)) |
| [010](010.md) | Feature-Sliced Design 구조 | Draft |
| [013](013.md) | IR v2 Execution Contract | Draft |
| [016](016.md) | SOTA++ 업그레이드 잠금 | Draft |
| [017](017.md) | Monorepo 아키텍처 및 패키지 경계 잠금 | Draft |
| [020](020.md) | 3채널 아키텍처 잠금 | Accepted |
| [021](021.md) | Surface Lifecycle & Per-Surface Layout | Draft |
| [2025-03-10-도메인-우선-FSD-하위-구조-전환](2025-03-10-도메인-우선-FSD-하위-구조-전환.md) | 도메인 우선 + FSD 하위 구조 전환 | Draft |
| [011](backend/011.md) ~ [019](backend/019.md) | 뒷단 RFC | [backend/](backend/README.md) |

---

## 6. 유지보수 체크리스트 (SOTA++ 준수)

- [ ] SSOT 중복: Delta/Tool/Gate는 [RFC-006](006.md)만 정의, 타 RFC는 참조만
- [ ] 선행 관계: 006 선행=000~005, 007~010/013/016/017/020 선행에 006 포함
- [ ] Gate: P0 4개만 `schemas/agent-ux/gates/gates.v1.yaml`에 정의. [REF-CONSOLIDATION](REF-CONSOLIDATION.md) 5절
- [ ] 버전: SOTA++ v1(000~010), SOTA++ v2(016), Monorepo(017), 3채널(020)
- [ ] 용어: [GLOSSARY](GLOSSARY.md) 준수 (schemas/, contracts/, packages/contracts, gate-fixture-replay)
- [ ] DELTA_BATCH 마이그레이션: [RFC-016](016.md) 적용 시 DELTA_BATCH_BIN만 허용 ([REF-CONSOLIDATION](REF-CONSOLIDATION.md) 7절)
- [ ] 레포 구조: [REPO-STRUCTURE](REPO-STRUCTURE.md) P0 준수 (도메인 + FSD)
- [ ] Monorepo 전환 (보류): [RFC-017](017.md) 적용 시 schemas 경로, Gate 위치(`schemas/agent-ux/gates/`) 변경 반영
- [ ] 3채널 (보류): [RFC-020](020.md) 적용 시 gate-protocol-compat, gate-replay-determinism 등. 현재는 P0 Gate만 우선

---

## 7. 프론트엔드 관련 RFC 요약

| RFC | 제목 | 핵심 내용 |
|-----|------|-----------|
| [001](001.md) | Webview 성능 및 구현 스택 | React 19, TanStack Virtual, Jotai, 3-버스(Delta/Blob/Control), DELTA_BATCH, 16ms commit, virtualization, BlobRef |
| [002](002.md) | 메시지 렌더러 뼈대 | virtualList.tsx, store.ts, streaming.ts, inputBuffer + coalesce, Delta 타입, Phase B 최소 세트 |
| [003](003.md) | Jotai + perfCollector | atom-per-message, jotaiStore, MessageRow, perfCollector (postMessage rx/sec, ui commit/sec, long task) |
| [004](004.md) | gate-performance 및 Test Harness | schemas/agent-ux/gates/performance.v1.yaml, Playwright runner, testHarness (`window.__agentUx` open/inject/stream/interact) |
| [009](009.md) | 로컬 개발 워크플로우 | extension-host-mock, fixture-loader, webview-dev, mock host parity |
| [010](010.md) | Feature-Sliced Design | app → pages → widgets → features → entities → shared 의존 방향, FSD 폴더 구조 |
| [2025-03-10-도메인-우선-FSD-하위-구조-전환](2025-03-10-도메인-우선-FSD-하위-구조-전환.md) | 도메인 우선 + FSD 전환 | domains/ 하위 FSD, shared/entities, 마이그레이션 4단계 |

---

## 8. 보조 문서

| 문서 | 용도 |
|------|------|
| [GLOSSARY](GLOSSARY.md) | **용어 사전 SSOT** (contract/contracts, packages/protocol, gate-replay 등) |
| [REPO-STRUCTURE](REPO-STRUCTURE.md) | **P0 레포 구조** (도메인 기반 + FSD, 필수 vs 보류) |
| [REF-CONSOLIDATION](REF-CONSOLIDATION.md) | 모순 해소, P0 Gate, perfCollector, 구현 우선순위 |
| [RFC-007-009-REVIEW](RFC-007-009-REVIEW.md) | 007~009 적용 완료 리뷰 (모순 해결 기록) |
| [SCOPE](SCOPE.md) | 프로젝트 구현 범위 (프론트엔드 thin client, backend 참조용) |

---

## 9. 핵심 원칙 (000 + 001)

- **SSOT**: Delta, Tool, Gate는 [RFC-006](006.md) 참조. 개별 RFC는 확장만 정의
- **드리프트 봉쇄**: 계약(Protocol)으로만 통신, Gate로 검증
- **성능 구조화**: 델타 배치, ref 기반 blob, virtualization, 16ms commit 상한
- **확장성**: Tool/Workflow 플러그인 (Model/Index는 뒷단)

---

## 10. 문서 구조 표준

RFC 작성 시 메타 테이블 형식:

```
| 항목 | 값 |
|------|-----|
| 상태 | Accepted / Draft |
| 작성일 | YYYY-MM |
| 선행 | RFC-XXX, ... |
| 후속 | RFC-XXX, ... (해당 시) |
| SOTA++ | v1 / v2 (016) |
| SOTA+++ | v1 (015) / v2 (018) |
```
