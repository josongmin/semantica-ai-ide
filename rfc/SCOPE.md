# 프로젝트 범위

**이 프로젝트**: Agent UX 프론트엔드 (thin client)

뒷단 에이전트(추론, 도구 실행, 임베딩, ModelPort, EnginePort 등)는 별도 구현. 이 레포와 무관.

---

## 이 프로젝트 범위 (구현 대상)

| 구분 | 내용 |
|------|------|
| Webview/React 렌더러 | DELTA_BATCH 수신, 메시지/타임라인 표시 ([RFC-001](001.md), [RFC-002](002.md)) |
| inputBuffer, 16ms commit, coalesce | 스트리밍 처리 ([RFC-003](003.md)) |
| VirtualMessageList, MessageRow | virtualization |
| DevOverlay, ReplayPanel, testHarness | 개발/테스트 도구 ([RFC-004](004.md)) |
| Delta, BlobRef 타입 | 프로토콜 (수신/파싱) ([RFC-006](006.md)) |
| **레포 구조** | 도메인 기반 + FSD. [REPO-STRUCTURE](REPO-STRUCTURE.md) P0 |
| **P0 Gate** | gate-contract, gate-performance, gate-fixtures, gate-fixture-replay. [REF-CONSOLIDATION](REF-CONSOLIDATION.md) 5절 |
| SOTA++ v2 (보류) | DELTA_BATCH_BIN, ring buffer ([RFC-016](016.md) 11절) |

---

## 이 프로젝트 범위 아님 (참조용)

| 구분 | 문서 |
|------|------|
| 추론, ModelPort, EnginePort | [012](backend/012.md), [018](backend/018.md) |
| 도구 실행, Tool routing | [018](backend/018.md) |
| Quanta 엔진, analysis.* | [011](backend/011.md) |
| Session Actor, EventStore, reducer | [018](backend/018.md), [019](backend/019.md) |
| Trajectory evaluation | [014](backend/014.md) |
| 3채널 아키텍처 (VSCode/IntelliJ/Web) | [RFC-020](020.md) |

**Backend/Frontend 경계**: RFC-018 Event Sourcing이 프론트엔드 상태 관리에 영향을 줌. `packages/contracts`에서 **프론트엔드가 소비하는 이벤트 서브셋**을 명시적으로 정의하고, 이 부분만 contract으로 관리하는 것을 권장. Backend RFC 변경 시 해당 서브셋만 호환성 유지.
