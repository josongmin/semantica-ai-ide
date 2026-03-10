# RFC 통합 정리 (모순 해소)

모순 해소 및 SSOT 정렬 결과. SSOT/폴더/Delta/Tool/Gate 상세는 [RFC-006](006.md). SOTA+++ Gate는 [RFC-018](backend/018.md) 참조 (RFC-015 superseded).

**문서 짜임새, SOTA 버전 정의**: [README](README.md) 1절, 2절.  
**용어 사전 (SSOT)**: [GLOSSARY](GLOSSARY.md).  
**레포 구조 (P0, 도메인+FSD)**: [REPO-STRUCTURE](REPO-STRUCTURE.md).

---

## 1. 모순 해소 (RFC-006 확정)

| # | 모순 | 해결 |
|---|------|------|
| 1 | write_patch vs apply_patch | **apply_patch** (디스크 적용), **write_patch** (IR 생성) 둘 다 유지. 승인 대상은 apply_patch |
| 2 | payload_ref vs BlobRef | **BlobRef**로 통일 |
| 3 | SET_FINAL vs SET_MESSAGE_STATUS | **SET_MESSAGE_STATUS** (status=final) |
| 4 | ATTACHMENT_ADDED vs ADD_ATTACHMENT_REF | **ADD_ATTACHMENT_REF** |
| 5 | Delta 최소 세트 누락 | REMOVE_ATTACHMENT_REF, SET_ATTACHMENT_STATUS, SET_DIFF_LOADED 추가 |
| 6 | workspace 도구 목록 불일치 | 통합 목록 확정 |
| 7 | tool.llm.generate vs ModelPort | **ModelPort**. Orchestrator가 ModelPort 호출. Tool 아님 |
| 8 | Gate 경로 | `schemas/agent-ux/gates/` ([RFC-017](017.md) 2.2절) |
| 9 | SSOT 구조 | RFC-006 2절에 확정 |

---

## 2. SSOT/폴더/Delta/Tool/Gate

[RFC-006](006.md) 2절(폴더), 3~5절(Delta/Tool), 8절(Gate). [RFC-017](017.md) 적용 시 gates/는 `schemas/agent-ux/gates/`로 이동. Gate 정의: `schemas/agent-ux/gates/gates.v1.yaml` ([RFC-017](017.md) 2.2절).

---

## 3. perfCollector 필드명 (RFC-003 ↔ RFC-004)

| RFC-003 | RFC-004 | 통일 |
|---------|---------|------|
| inp.p95_ms | inp?.p95_ms | p95_ms |
| frames.over16_ratio | over16_ratio | over16_ratio |
| longTasks.count | longTasks?.count | count |
| - | heap.growth_mb | heap.growth_mb (004 추가) |

---

## 4. RFC-007~009 모순 및 해결

상세: [RFC-007-009-REVIEW](RFC-007-009-REVIEW.md).

### 4.1 error-schema (RFC-007)

- 기존: code, message, category, retryable
- AgentErrorV1: error_code, layer, severity, safe_message, debug_message
- 매핑: code→error_code, message→safe_message, category→layer

### 4.2 plugin-manifest 경로 (RFC-008)

| 경로 | 용도 |
|------|------|
| ir/plugin-manifest.v1.json | IR/런타임 표현 ([RFC-005](005.md)) |
| plugins/plugin-manifest.v1.schema.json | Contribution API manifest 검증 ([RFC-008](008.md)) |

### 4.3 Gate 별칭

- gate-replay ([RFC-001](001.md)) = gate-fixture-replay ([RFC-006](006.md)). 정의: `schemas/agent-ux/gates/gates.v1.yaml`

---

## 5. Gate (P0 필수만 우선)

### 5.1 P0 Gate 4개 (MVP, RFC-002~004 범위)

| Gate | 역할 |
|------|------|
| **gate-contract** | protocol schema validation, backward compat, large payload must be ref |
| **gate-performance** | [RFC-004](004.md) INP, long task, frame, heap, postMessage, commit 상한 |
| **gate-fixtures** | golden 3종: LLM streaming, file attachment, plugin API call |
| **gate-fixture-replay** | fixture replay → 기대 delta 일치 (test harness) |

**이 4개만** `schemas/agent-ux/gates/gates.v1.yaml`에 정의하고 우선 구현. Gate가 있으면 안전하다는 환상보다, **실제로 통과 가능한 Gate만** 유지.

### 5.2 보류 Gate (Phase 확장 시 적용)

| Phase | Gate | RFC |
|-------|------|-----|
| RFC-007 | gate-error-catalog, gate-recovery-matrix, gate-redaction, gate-ui-error-render | 007 |
| RFC-008 | gate-plugin-manifest-validate, gate-plugin-capability-collision, gate-plugin-permission, gate-plugin-fixtures | 008 |
| RFC-009 | gate-webview-standalone, gate-mock-host-parity | 009 |
| RFC-013 | gate-ir-replay-determinism, gate-patch-revert-valid, gate-step-partial-execution | 013 |
| Backend | gate-quanta-bridge-parity, gate-model-*, gate-agent-trajectory-*, gate-tool-*, gate-artifact-*, gate-ast-* | [backend/](backend/README.md) |

gate-codegen-drift, gate-reducer, gate-tools, gate-mock-tool, SOTA+++ Gate 13개 등은 해당 Phase 구현 시 추가.

---

## 6. SOTA+++ Gate (Backend 전용, 참조)

SOTA+++ v2 Gate 13개 ([RFC-018](backend/018.md)): gate-event-log-replayable, gate-ir-schema-zero-violation, gate-ir-semantic-guard, gate-tool-idempotency, gate-tool-dryrun-parity, gate-approval-policy-enforcement, gate-artifact-hash-stability, gate-agent-trajectory-golden, gate-recovery-trajectory, gate-ast-equivalence, gate-patch-revert-valid, gate-ir-replay-determinism, gate-step-partial-execution.

**이 프로젝트(프론트엔드) 범위 아님**. Backend 구현 시 참조. [backend/](backend/README.md) 018, 019.

---

## 7. RFC-016~020 확장 요약

**DELTA_BATCH 마이그레이션**: RFC-001~004 예시는 DELTA_BATCH(JSON). [RFC-016](016.md) 적용 시 DELTA_BATCH_BIN(msgpack)으로 전환, gate-contract에서 DELTA_BATCH 금지.

| RFC | 역할 | 내용 |
|-----|------|------|
| [016](016.md) | SOTA++ 업그레이드 | DELTA_BATCH_BIN (msgpack + Transferable), ring buffer + coalesce map, blob meta/payload 분리, ArtifactIndex 영속화(jsonl), sha256 정책 분리 |
| [017](017.md) | Monorepo 아키텍처 | Monorepo 구조, SSOT 배치 규칙, Adapter 전략, 패키지 경계 의존성 매트릭스, Gate Tier 분류, 기존 RFC 모순 해소 (2절) |
| [018](backend/018.md) | **SOTA+++ v2** | Session Actor + Event Sourcing + EnginePort + Deterministic Replay + Semantic Patch Equivalence. RFC-015 superseded. 13 Gate 확정 |
| [019](backend/019.md) | **수렴** | 전체 실행 흐름 단일 진실 다이어그램 (10단계). Budget/Determinism/Adapter Enforcement Point 통합. Analyzer Execution Contract 카탈로그. IDE/Interactive Readiness (latency contract, partial solve, confidence score, query streaming). 4 Gate 추가 |
| [020](020.md) | **3채널 잠금** | VSCode/IntelliJ/Web, Protocol First, Single Writer, Event Sourcing, Deterministic Replay, Gate 세트 (gate-protocol-compat, gate-replay-determinism, gate-render-performance-web, gate-adapter-contract, gate-e2e-session) |

**RFC-017 주요 변경**:
- `contract/` → `contracts/` (복수형 통일)
- `gates/` → `schemas/agent-ux/gates/` (SSOT 내부로 이동)
- RFC-010 FSD 구조를 `apps/*/src/` 내부에서 유지
- RFC-015 6 Layer를 `packages/` + `services/` 매핑
- RFC-009 `extension-host-mock`을 `apps/webview-dev/src/mock-host/`로 흡수
- Gate를 Tier 1(PR 필수)/Tier 2(CI 전체)/Tier 3(SOTA+++) 3단계로 분류

**RFC-019 수렴 내용**:
- 분산된 Budget 정책 (RFC-012/015/018) → Unified Budget Policy (`policy/budget.v1.yaml`)
- 분산된 Determinism 규칙 (RFC-013/014/015/018) → 단일 Determinism Policy (`policy/determinism.v1.yaml`)
- Tool metadata (RFC-015) → Analyzer Execution Contract (`policy/analyzer-contracts.v1.yaml`)로 확장 흡수
- IDE/Interactive latency contract, partial solve, confidence score, query streaming 신규

---

## 8. 용어 통일 (10번 모순 해소)

| 모순 | 해결 | 참조 |
|------|------|------|
| ssot/ vs schemas/ | **schemas/** | 업계 SOTA. [GLOSSARY](GLOSSARY.md) 1절, [REPO-STRUCTURE](REPO-STRUCTURE.md) |
| contract/ vs contracts/ | **contracts/** | [GLOSSARY](GLOSSARY.md) 1절, 000/005/011/012/015 수정 완료 |
| packages/protocol vs packages/contracts | **packages/contracts** 확정. protocol은 3채널 관점 별칭 | [GLOSSARY](GLOSSARY.md) 2절, [RFC-020](020.md) 10.1절 |
| gate-replay vs gate-fixture-replay | **gate-fixture-replay** | [GLOSSARY](GLOSSARY.md) 3절. gate-replay는 구칭 |
| capabilities/ vs plugins/ | **plugins/** | [RFC-017](017.md) 2.1절 |

---

## 9. 구현 우선순위 (권장)

| 순서 | RFC | 이유 |
|------|-----|------|
| 1 | RFC-002 | 동작하는 메시지 렌더러 (MVP) |
| 2 | RFC-003 | Jotai 전환 + perfCollector |
| 3 | RFC-004 | Gate 자동화 (SOTA v1 최소) |
| 4 | RFC-007 | 에러 처리 (UX 품질 기본) |
| 5 | RFC-010 | FSD 폴더 구조 (코드 증가 전) |
| 6 | RFC-009 | 로컬 개발 환경 |
| 7 | RFC-005 | ModelPort/Tool 연동 |
| 8 | RFC-008 | Plugin SDK |
| **보류** | RFC-016 | 바이너리 프로토콜 (perfCollector 실측 후) |
| **보류** | RFC-017 | 모노레포 (코드량 1만 줄 이상 후) |
| **보류** | RFC-020 3채널 | VSCode + Web 2채널로 시작. IntelliJ는 프로토콜 안정화 후 |

**원칙**: "완벽한 설계 후 구현"보다 "최소 설계 → 구현 → 학습 → 설계 보완" 사이클이 효과적.

### 9.2 P0 레포 구조 (도메인 + FSD)

[REPO-STRUCTURE](REPO-STRUCTURE.md): src/ FSD(app→pages→widgets→features→entities→shared), schemas/agent-ux/gates(P0 4개), tests. 단일 패키지 기준. Monorepo는 보류.

### 9.1 RFC-013 IR v2 revert 정책 (개선 제안)

"revert_diff가 없는 패치는 승인 불가"는 이론적으로 맞으나, riskLevel: LOW(파일 생성 등)인 패치는 revert 없이도 승인 허용하는 정책 옵션을 고려. [RFC-013](013.md) 적용 시 policy 옵션으로 확장 가능.
