# 용어 사전 (SSOT)

RFC 간 용어 혼재를 방지하기 위한 단일 진실. 모든 RFC는 이 문서를 따름.

---

## 1. 경로/폴더

| 용어 | 확정 | 비고 |
|------|------|------|
| ssot/ | **schemas/** | 업계 SOTA. OpenAPI/GraphQL 관례. [REPO-STRUCTURE](REPO-STRUCTURE.md) |
| contract/ | **contracts/** | 복수형 통일. [RFC-017](017.md) 2.1절 |
| capabilities/ | **plugins/** | [RFC-017](017.md) 2.1절 |
| gates/ (루트) | **schemas/agent-ux/gates/** | SSOT 내부. [RFC-017](017.md) 2.2절 |
| src/contracts/ | **packages/contracts/generated/** | Monorepo 시. [RFC-017](017.md) 4절 |
| packages/protocol | **packages/contracts** | RFC-020에서 protocol은 contracts의 별칭. 확정은 contracts |

---

## 2. 패키지

| 용어 | 확정 | 비고 |
|------|------|------|
| packages/protocol | packages/contracts | 동일 SSOT. RFC-020은 3채널 관점에서 protocol로 부르나, 코드/경로는 contracts |
| packages/orchestrator | packages/agent-runtime | [RFC-017](017.md) |
| packages/tooling-contracts | packages/tool-protocol | [RFC-020](020.md) 10.2절 |

---

## 3. Gate

**P0 Gate (필수)**: gate-contract, gate-performance, gate-fixtures, gate-fixture-replay. [REF-CONSOLIDATION](REF-CONSOLIDATION.md) 5절.

| 용어 | 확정 | 비고 |
|------|------|------|
| gate-replay | **gate-fixture-replay** | [RFC-001](001.md) 구칭 = [RFC-006](006.md) gate-fixture-replay |
| gate-replay-determinism | gate-replay-determinism | RFC-020 Gate. gate-fixture-replay와 별개 |
| gate-contract | gate-contract | protocol schema validation |
| gate-performance | gate-performance | [RFC-004](004.md) |
| gate-fixtures | gate-fixtures | golden 3종: LLM streaming, attachment, plugin API call |

---

## 4. 프로토콜/Delta

| 용어 | 확정 | 비고 |
|------|------|------|
| payload_ref | **BlobRef** | [REF-CONSOLIDATION](REF-CONSOLIDATION.md) 1절 |
| write_patch | write_patch | IR 생성. apply_patch와 별개 |
| apply_patch | apply_patch | 디스크 적용. 승인 대상 |
| SET_FINAL | **SET_MESSAGE_STATUS** (status=final) | [REF-CONSOLIDATION](REF-CONSOLIDATION.md) 1절 |
| ATTACHMENT_ADDED | **ADD_ATTACHMENT_REF** | [REF-CONSOLIDATION](REF-CONSOLIDATION.md) 1절 |
| tool.llm.generate | **ModelPort** | Tool 아님. Orchestrator가 ModelPort 호출 |

---

## 5. SSOT 파일 경로 (schemas/agent-ux/ 기준)

| 파일 | 경로 |
|------|------|
| Agent/Tool/Blob/Model 프로토콜 | contracts/*.v1.json |
| Gate 정의 | gates/gates.v1.yaml |
| IR 스키마 | ir/*.v1.json |
| 에러 스키마 | errors/*.v1.json |
| 플러그인 | plugins/*.v1.* |
| 정책 | policy/*.v1.yaml |

---

## 6. 참조

- [REF-CONSOLIDATION](REF-CONSOLIDATION.md): 모순 해소 상세
- [RFC-006](006.md) 2절: SSOT 구조
- [RFC-017](017.md) 2절: Monorepo 경로 변경
