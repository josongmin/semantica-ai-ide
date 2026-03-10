# RFC-TERMINAL-011: V1 Scope Lock — 범위 분리 & Scope Gate

| Field | Value |
|-------|-------|
| ID | RFC-TERMINAL-011-SCOPE-LOCK |
| Status | Draft |
| Date | 2026-03-09 |
| Owner | Semantica DevOS |
| Audience | IDE Team, Engine Team, Agent Team |
| Parent | RFC-TERMINAL-010-CONSTITUTION |
| Scope | V1 / V1.5 / V2 범위 고정, 구현 순서 |

---

## 1. Scope 분리 원칙

> 처음부터 Warp의 모든 면을 다 따라가려 하면 범위가 과도하게 커진다.
> 핵심은 **입력 UX와 고급 workflow는 V2로 미루는 것**이다.

```
V1   = 기본기 + Warp급 핵심 UX + AI 확장 기초
V1.5 = polish + export + workflow
V2   = modern input + smart completion + advanced workflow
```

---

## 2. V1 Scope Gate

V1은 아래만 포함한다. 이 범위를 넘는 기능은 V1 PR에서 거부한다.

| 구분 | 포함 | 관련 RFC |
|------|------|----------|
| PTY + xterm raw viewport | **포함** | 001, 005 |
| multi session / tabs | **포함** | 001 |
| command boundary tracking | **포함** | 001, 005 |
| command blocks | **포함** | 004, 005 |
| sticky header | **포함** | 004 |
| command rail | **포함** | 004, 005 |
| search / filter / fold | **포함** | 004 |
| parsed diagnostic / file-link / url | **포함** | 000, 004 |
| agent provenance badge | **포함** | 002, 003 |
| replay / rerun basic | **포함** | 000 |
| policy guard runtime | **포함** | 003 |
| alt-screen / TUI fallback | **포함** | 005 |
| classic / hybrid mode | **포함** | 005, 010 |

### V1 완료 기준

- gate-comp 전부 통과
- gate-fallback 전부 통과
- gate-ux 핵심 항목 (G-UX-01 ~ G-UX-07) 통과
- gate-agent 핵심 항목 (G-AGENT-01 ~ G-AGENT-05) 통과
- gate-perf 치명 이슈 없음

---

## 3. V1.5 Scope Gate

V1 안정화 이후. UX polish와 공유/내보내기 기능 중심.

| 구분 | 포함 | 관련 RFC |
|------|------|----------|
| progress overlay | **포함** | 004 |
| block summary footer | **포함** | 004 |
| export / share block | **포함** | 004 |
| workflow / snippet picker | **포함** | 004 |
| terminal mini map | **포함** | 004 |
| richer parsed actions | **포함** | 000 |

### V1.5 진입 조건

- V1 gate 전부 통과
- V1 production 안정 확인

---

## 4. V2 Scope Gate

입력 UX 혁신과 고급 workflow. 가장 비용이 높은 기능들.

| 구분 | 포함 | 관련 RFC |
|------|------|----------|
| modern input editor (CodeMirror) | **포함** | 004 |
| smart completion (3-layer) | **포함** | 004 |
| command palette integrated search | **포함** | 004 |
| team workflow registry | **포함** | 004 |
| remote execution hooks | **포함** | 000 |
| multi-agent richer terminal UX | **포함** | 003 |
| semantic mode full | **포함** | 010 |

### V2 진입 조건

- V1.5 gate 전부 통과
- input editor 프로토타입 완료
- completion pipeline 설계 확정

---

## 5. 명시적 제외 (Not In Scope — 전 버전)

| 항목 | 이유 |
|------|------|
| tmux 대체 | 제품 방향 아님 |
| SSH orchestration UI | 별도 surface |
| K8s dashboard | terminal 범위 아님 |
| full debugger UI | 별도 surface |
| remote dev 전체 orchestration | v3+ 검토 |
| terminal renderer 자체 구현 | xterm.js 사용, ROI 낮음 |

---

## 6. 구현 Phase 매핑

RFC 005에서 정의한 3-Phase 구현과 Scope의 대응:

| Phase | Scope | 핵심 |
|-------|-------|------|
| Phase A (compatibility lock) | V1 전반 | PTY + raw viewport + fallback |
| Phase B (hybrid UX) | V1 후반 | blocks + rail + parsing + agent |
| Phase C (Warp-level polish) | V1.5 ~ V2 | input editor + workflow + completion |

---

## 관련 문서

- [010-constitution.md](./010-constitution.md) — 비가역 원칙 (상위)
- [014-gates-and-acceptance.md](./014-gates-and-acceptance.md) — Gate 상세 & Acceptance 기준
- [004-warp-level-ux.md](./004-warp-level-ux.md) — Warp급 UX 스펙
- [005-compatibility-and-components.md](./005-compatibility-and-components.md) — 컴포넌트 구조 & Phase 정의
