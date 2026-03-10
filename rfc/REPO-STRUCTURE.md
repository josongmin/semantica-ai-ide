# 레포 구조 (최종안: 업계 SOTA 네이밍)

Nx, Turborepo, OpenAPI 관례를 반영한 폴더 구조. [REF-CONSOLIDATION](REF-CONSOLIDATION.md) 9절 구현 우선순위와 정렬.

---

## 1. 최종 구조

```
<repo_root>/
├── apps/                        # Deployable applications (Nx/Turborepo 표준)
│   └── webview-dev/             # 로컬 개발용 Webview
│
├── packages/                    # Shared packages (npm/pnpm 표준)
│   ├── extension-host/
│   ├── agent-runtime/
│   └── contracts/               # codegen 생성물 (Monorepo 시)
│
├── schemas/                     # Source schemas & specs (OpenAPI/GraphQL 관례)
│   └── agent-ux/                # Agent UX 도메인
│       ├── contracts/           # agent, tool, blob, model 프로토콜
│       ├── gates/               # P0 Gate 4개
│       │   ├── gates.v1.yaml
│       │   ├── contract.v1.yaml
│       │   └── performance.v1.yaml
│       └── dev/
│           └── fixtures/
│
├── tools/                       # Build, CI, codegen (업계 표준)
│   └── gate-runner/             # Gate 실행기 (보류)
│
├── src/                         # Webview UI (단일 패키지, 도메인 우선 FSD)
│   ├── app/
│   ├── domains/                 # 도메인별 surfaces, pages (chat, editor, overview, …)
│   ├── widgets/
│   ├── features/
│   ├── entities/
│   ├── shared/                  # shared/entities, shared/bootstrap, shared/views
│   └── contracts/               # schemas/ → codegen 생성물 (수동 편집 금지)
│
├── tests/
│   ├── fixtures/
│   └── gates/
│
├── rfc/                         # Design RFCs (Rust/React 관례)
│
├── scripts/                     # Shell scripts (선택)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 2. 폴더 네이밍 (업계 SOTA)

| 폴더 | 용도 | 참조 |
|------|------|------|
| **apps/** | 배포 가능한 애플리케이션 | Nx, Turborepo |
| **packages/** | 공유 패키지 | npm, pnpm workspaces |
| **schemas/** | 스키마/스펙 원본 (SSOT) | OpenAPI, GraphQL, JSON Schema |
| **tools/** | 빌드, CI, codegen | Nx, Turborepo tooling |
| **src/** | 메인 앱 소스 | 단일 패키지 표준 |
| **tests/** | 테스트 | 업계 표준 |
| **docs/** | 문서 | 업계 표준 |
| **scripts/** | 셸 스크립트 | npm scripts 보조 |

**schemas/ (구 ssot/)**: OpenAPI, GraphQL, JSON Schema 프로젝트에서 스키마 원본을 두는 관례. "Single Source of Truth"를 "schemas"로 표현.

---

## 3. FSD 의존 방향

```
shared → entities → features → widgets → pages → app
```

---

## 4. 도메인 ↔ FSD 매핑

| 도메인 | entities | features | widgets |
|--------|----------|----------|---------|
| Message | message | send-message, streaming | message-list, message-row |
| Session | session | - | - |
| Diff | diff | diff-review | diff-viewer |
| Timeline | timeline-event | - | timeline |
| Context | context-ref | context-injection | context-picker |

---

## 5. P0 vs 보류

| 구분 | P0 (필수) | 보류 |
|------|-----------|------|
| **루트** | apps/, packages/, schemas/, src/, tests/, docs/ | tools/, scripts/ |
| **schemas/** | contracts/, gates/, dev/fixtures | ir/, errors/, plugins/, policy/, eval/ |
| **구조** | 단일 패키지 src/ | Monorepo 전환 (RFC-017) |

---

## 6. 마이그레이션 (ssot → schemas)

기존 `ssot/` 폴더를 `schemas/`로 변경. [GLOSSARY](GLOSSARY.md) 1절.

```
ssot/agent-ux/  →  schemas/agent-ux/
```

---

## 7. 도메인 우선 전환 (완료)

2025-03-10 RFC에 따라 **도메인 우선 + FSD 하위** 구조로 전환 완료.

- **domains/**: chat, editor, overview, graph, replay, agent, agents, orchestrator, code, reasoning, timeline, review, tasks, settings (14개)
- **shared/entities/**: 교차 도메인 엔티티 (message, session, diff, tool-call 등)
- **shared/bootstrap/**: 전역 bootstrap features (approval-gate, send-message, terminal 등)

---

## 8. 참조

- [GLOSSARY](GLOSSARY.md): schemas/, contracts/, gates/
- [RFC-010](010.md): FSD 상세 (계층 우선)
- [2025-03-10-도메인-우선-FSD-하위-구조-전환](2025-03-10-도메인-우선-FSD-하위-구조-전환.md): 도메인 우선 + FSD 전환 계획
- [REF-CONSOLIDATION](REF-CONSOLIDATION.md) 5절: P0 Gate, 9절: 구현 우선순위
