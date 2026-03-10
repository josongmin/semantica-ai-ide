# RFC-007~009 리뷰 (적용 완료)

통합 정리: [REF-CONSOLIDATION](REF-CONSOLIDATION.md) 4절.

---

## 1. 적용된 수정 요약

| RFC | 수정 |
|-----|------|
| 007 | error-schema.v1: scope_hint 추가, error_code 패턴 완화. 10.3 tool-protocol Error 매핑 |
| 008 | plugin-manifest: contributes minProperties 1 (tools 또는 workflows 최소 1개) |
| 009 | 선행에서 RFC-007 제거 (로컬 개발과 에러 직접 의존 없음) |
| gates | RFC-007~009 Gate 11개 gates.v1.yaml 등록 |

---

## 2. 정합성 체크리스트

- [x] RFC-007 ↔ RFC-005: Event Log, Control Bus, AgentErrorV1
- [x] RFC-008 ↔ RFC-005, 006: ir/ vs plugins/ manifest 경로, capability negotiation
- [x] RFC-009 ↔ RFC-006: fixture-schema, gate-fixture-replay

---

## 3. 남은 작업 (선택)

1. agent-protocol Control.CONTROL_ERROR payload: AgentErrorV1 $ref 명시
2. ir/plugin-manifest ↔ plugins/plugin-manifest 매핑 규칙 문서화
3. error-catalog ↔ tool-protocol Error category 매핑 표준화
