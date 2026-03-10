# RFC-TERMINAL-014: Gates & Acceptance — 게이트 체계, 수용 기준, 설정, 성능 예산

| Field | Value |
|-------|-------|
| ID | RFC-TERMINAL-014-GATES-AND-ACCEPTANCE |
| Status | Draft |
| Date | 2026-03-09 |
| Owner | Semantica DevOS |
| Audience | IDE Team, QA Team, Agent Team |
| Parent | RFC-TERMINAL-010-CONSTITUTION |
| Scope | 전체 Gate 체계, Acceptance 기준, 설정 체계, 성능 Gate, Merge 조건 |

---

## 1. 상위 Gate 그룹

| 그룹 | 목적 |
|------|------|
| **gate-comp-*** | terminal 기본 호환성 |
| **gate-ux-*** | Warp급 UX |
| **gate-agent-*** | AI/agent 확장 |
| **gate-perf-*** | 성능/응답성 |
| **gate-fallback-*** | 강등/복구 안정성 |

---

## 2. Compatibility Gates

→ 상세: [012-compatibility-contract.md](./012-compatibility-contract.md)

| Gate ID | 영역 | 기준 |
|---------|------|------|
| G-COMP-01 | shell 기본동작 | zsh/bash/pwsh에서 입력/출력/resize/exit 정상 |
| G-COMP-02 | ANSI 처리 | color/style/cursor 이동 정상 |
| G-COMP-03 | clipboard | copy/paste/selection 정상 |
| G-COMP-04 | IME | 한글 입력 정상 |
| G-COMP-05 | alt-screen | vim/nvim/less/top/htop에서 깨짐 없음 |
| G-COMP-06 | multiplexer | tmux attach 사용 가능 |
| G-COMP-07 | interactive finder | fzf류 상호작용 정상 |
| G-COMP-08 | long output | 대량 로그에서 응답성 유지 |
| G-COMP-09 | resize | rapid resize에서도 뷰/pty sync 정상 |
| G-COMP-10 | fallback | semantic failure 시 raw-only 자동 강등 |

---

## 3. UX Gates

| Gate ID | 기능 | 완료 기준 |
|---------|------|----------|
| G-UX-01 | command block | start/end/status/exit/duration 표시 |
| G-UX-02 | sticky header | 긴 로그에서 현재 block context 유지 |
| G-UX-03 | command rail | failed/running/current block jump 가능 |
| G-UX-04 | search / filter / fold | command 단위 검색/필터/접기 가능 |
| G-UX-05 | block action | rerun/copy output/copy command 동작 |
| G-UX-06 | parsed link | file:line/url/port 클릭 가능 |
| G-UX-07 | error surfacing | diagnostic summary 또는 error list 제공 |
| G-UX-08 | session status | running/exited/failed 상태 표시 |
| G-UX-09 | task awareness | dev-server/watch/progress 감지 기본 제공 |
| G-UX-10 | no-break guarantee | overlay가 selection/cursor/input 방해 안 함 |

---

## 4. Agent Extension Gates

| Gate ID | 기능 | 완료 기준 |
|---------|------|----------|
| G-AGENT-01 | provenance | command source user/agent/task 구분 |
| G-AGENT-02 | session ownership | agent-owned session 구분 가능 |
| G-AGENT-03 | reveal policy | on-failure/always/never 정책 동작 |
| G-AGENT-04 | approval policy | dangerous command 승인 요구 |
| G-AGENT-05 | command completion | exitCode/duration/parsed errors 반환 |
| G-AGENT-06 | rerun as user | agent command 재실행 가능 |
| G-AGENT-07 | bridge isolation | agent 실패가 terminal 본체 안 깨뜨림 |

---

## 5. Performance Gates

성능은 수치까지 너무 일찍 박기보다, 우선 budget 성격을 고정한다.

| Gate ID | 항목 | 원칙 |
|---------|------|------|
| G-PERF-01 | stream append | output streaming 중 input stall 금지 |
| G-PERF-02 | long log | 대량 로그에서도 스크롤 응답성 유지 |
| G-PERF-03 | overlay cost | overlay off 시 raw mode overhead 극소 |
| G-PERF-04 | search | command/block 검색이 체감 지연 없이 동작 |
| G-PERF-05 | memory cap | session buffer 상한과 pruning 정책 존재 |
| G-PERF-06 | parser overhead | parser 실패/지연이 raw 출력 막지 않음 |
| G-PERF-07 | resize | rapid resize에서도 event storm 안정 처리 |
| G-PERF-08 | virtualization | large output에서 렌더 비용 선형 폭증 방지 |

---

## 6. Fallback Gates

| Gate ID | 상황 | 기준 |
|---------|------|------|
| G-FALL-01 | marker 없음 | raw terminal only, block 없음, terminal 정상 |
| G-FALL-02 | command tracker 실패 | plain session mode, raw 출력 유지 |
| G-FALL-03 | parser 실패 | raw output only, decoration 없음 |
| G-FALL-04 | overlay layout 실패 | overlay off, terminal 정상 |
| G-FALL-05 | alt-screen 진입 | classic/raw-only, vim/less/top 정상 |
| G-FALL-06 | unknown control burst | semantic off, 안전 강등 |
| G-FALL-07 | provenance 없음 | user/custom source로 표시 |
| G-FALL-08 | agent bridge 실패 | terminal 단독 동작, agent 기능만 비활성 |

---

## 7. Acceptance 기준 ("됐다"의 기준)

### 7.1 Command Block

- [ ] command start/end 잡힘
- [ ] exit code 표시됨
- [ ] duration 표시됨
- [ ] rerun/copy 가능

### 7.2 Classic Fallback

- [ ] vim/nvim/less/top/htop/tmux 사용 가능
- [ ] semantic off 되어도 raw terminal 정상

### 7.3 Parsed Actions

- [ ] file:line jump 가능
- [ ] url 클릭 가능
- [ ] port open 가능

### 7.4 Agent Bridge

- [ ] agent session 생성
- [ ] provenance 보임
- [ ] completion 결과 받음
- [ ] dangerous command 승인 필요

> 이 기준을 문서화하지 않으면 구현 완료 판단이 모호해진다.

---

## 8. 설정 체계

### 8.1 사용자 설정

| 설정 키 | 기본값 | 설명 |
|---------|--------|------|
| `terminal.mode.default` | `hybrid` | 기본 모드 |
| `terminal.overlay.enabled` | `true` | overlay 활성화 |
| `terminal.fallback.autoRawOnly` | `true` | 이상 시 자동 강등 |
| `terminal.commandRail.visible` | `true` | rail 표시 |
| `terminal.stickyHeader.enabled` | `true` | sticky header 표시 |
| `terminal.search.defaultScope` | `commands` | 검색 기본 범위 |
| `terminal.semantic.parsing` | `default` | parser 사용 수준 |
| `terminal.agent.provenance.visible` | `true` | provenance 표시 |
| `terminal.agent.revealPolicy.default` | `on-failure` | 기본 reveal 정책 |
| `terminal.policy.mode` | `required-for-dangerous` | 승인 정책 |
| `terminal.buffer.maxLines` | 적정 기본값 | 버퍼 상한 |
| `terminal.classic.forceForTui` | `true` | TUI 시 classic 강제 |

### 8.2 Workspace 설정

| 설정 키 | 설명 |
|---------|------|
| `terminal.policy.allowPatterns` | 자동 허용 명령 패턴 |
| `terminal.policy.denyPatterns` | 차단 명령 패턴 |
| `terminal.workflow.registry` | 프로젝트 명령 템플릿 |
| `terminal.parser.enabledKinds` | parser 종류별 on/off |
| `terminal.agent.exec.defaultSessionMode` | dedicated/reuse/detached 기본 |
| `terminal.compatibility.forceClassicCommands` | 특정 command raw-only 강제 |

### 8.3 런타임 내부 설정

| 설정 키 | 설명 |
|---------|------|
| `marker.injection.enabled` | shell hook 삽입 on/off |
| `marker.parse.strictness` | marker 파싱 strict/lenient |
| `compatibility.unknownControlThreshold` | unknown sequence 임계값 |
| `overlay.layout.recomputeDebounceMs` | layout 재계산 debounce |
| `parser.batchWindowMs` | parsing batch window |
| `event.coalesce.enabled` | 고빈도 이벤트 압축 |
| `buffer.prune.strategy` | 오래된 line/block pruning |

---

## 9. Merge 조건

### 9.1 V1 최소 Merge 조건

```
P0/V1 기능은:
  gate-comp   → 전부 통과
  gate-fall   → 전부 통과
  gate-ux     → 핵심 항목 (01~07) 통과
  gate-agent  → 핵심 항목 (01~05) 통과
  gate-perf   → 치명 이슈 없음
```

> **UX보다 compatibility/fallback이 상위 게이트이다.**

### 9.2 Gate 우선순위 계층

```
  1st  gate-comp-*     ← 최우선 (호환성)
  2nd  gate-fall-*     ← 안전 강등
  3rd  gate-ux-*       ← UX 기능
  4th  gate-agent-*    ← agent 확장
  5th  gate-perf-*     ← 성능
```

### 9.3 PR 리뷰 체크리스트

모든 terminal 관련 PR은 아래를 확인한다:

- [ ] 헌법 §2.1 위반 없음 (Compatibility First)
- [ ] 헌법 §2.2 위반 없음 (PTY Source of Truth)
- [ ] 헌법 §2.3 위반 없음 (Overlay Non-Ownership)
- [ ] 헌법 §2.4 위반 없음 (Deterministic Fallback)
- [ ] 해당 gate 통과 확인
- [ ] V1 scope 범위 내인지 확인 ([011-scope-lock.md](./011-scope-lock.md))

---

## 10. Gate 추적 현황 템플릿

구현 진행 시 아래 표를 복사하여 상태를 추적한다.

| Gate | Status | PR | Note |
|------|--------|-----|------|
| G-COMP-01 | - | | |
| G-COMP-02 | - | | |
| G-COMP-03 | - | | |
| G-COMP-04 | - | | |
| G-COMP-05 | - | | |
| G-COMP-06 | - | | |
| G-COMP-07 | - | | |
| G-COMP-08 | - | | |
| G-COMP-09 | - | | |
| G-COMP-10 | - | | |
| G-UX-01 | - | | |
| G-UX-02 | - | | |
| G-UX-03 | - | | |
| G-UX-04 | - | | |
| G-UX-05 | - | | |
| G-UX-06 | - | | |
| G-UX-07 | - | | |
| G-UX-08 | - | | |
| G-UX-09 | - | | |
| G-UX-10 | - | | |
| G-AGENT-01 | - | | |
| G-AGENT-02 | - | | |
| G-AGENT-03 | - | | |
| G-AGENT-04 | - | | |
| G-AGENT-05 | - | | |
| G-AGENT-06 | - | | |
| G-AGENT-07 | - | | |
| G-PERF-01 | - | | |
| G-PERF-02 | - | | |
| G-PERF-03 | - | | |
| G-PERF-04 | - | | |
| G-PERF-05 | - | | |
| G-PERF-06 | - | | |
| G-PERF-07 | - | | |
| G-PERF-08 | - | | |
| G-FALL-01 | - | | |
| G-FALL-02 | - | | |
| G-FALL-03 | - | | |
| G-FALL-04 | - | | |
| G-FALL-05 | - | | |
| G-FALL-06 | - | | |
| G-FALL-07 | - | | |
| G-FALL-08 | - | | |

> Status: `-` = 미시작, `WIP` = 진행중, `PASS` = 통과, `FAIL` = 실패, `N/A` = 해당없음

---

## 관련 문서

- [010-constitution.md](./010-constitution.md) — 비가역 원칙 (상위)
- [011-scope-lock.md](./011-scope-lock.md) — V1/V1.5/V2 Scope Lock
- [012-compatibility-contract.md](./012-compatibility-contract.md) — 호환성 계약 상세
- [013-event-state-ssot.md](./013-event-state-ssot.md) — Event/State SSOT
