# RFC-TERMINAL-CONSTITUTION-V1: AI-Native IDE Terminal 헌법

| Field | Value |
|-------|-------|
| RFC ID | RFC-TERMINAL-CONSTITUTION-V1 |
| Status | Draft |
| Date | 2026-03-09 |
| Scope | AI-Native IDE Terminal Architecture |
| Goal | Warp 수준 UX + 완전한 Terminal 호환성 보장 |
| Audience | Terminal / Runtime / Agent / UI |
| Applies To | Desktop IDE / Agent runtime |

---

## 1. 핵심 목적

본 RFC는 AI-Native IDE Terminal의 **헌법(Constitution)** 역할을 한다.

### 목표

1. 기본 Terminal 기능을 **절대적으로** 보장
2. Warp 수준 Modern Terminal UX 제공
3. AI / Agent / Semantic 확장 가능 구조 유지
4. 기능 확장 중에도 Terminal 안정성 훼손 방지

### Terminal 설계의 최상위 철학

```
Raw terminal compatibility is mandatory.
All other capabilities are additive layers.
```

---

## 2. Architecture Principle (절대 원칙)

### 2.1 Compatibility First

Terminal은 다음을 **항상** 보장해야 한다.

| 영역 | 요구사항 |
|------|---------|
| PTY | 단일 Source of Truth |
| Shell | bash / zsh / pwsh 정상 동작 |
| ANSI | escape sequence 완전 처리 |
| Input | keyboard / IME 정상 |
| Clipboard | copy / paste 정상 |
| Resize | window resize 안정 |
| TUI | vim / top / less / tmux 정상 |

> Semantic / AI 기능은 실패해도 Terminal은 정상 동작해야 한다.

### 2.2 PTY Source of Truth

Terminal 상태의 단일 진실은 **PTY process state**이다.

UI Overlay / Parser / Agent는 상태를 **참조만 가능**하며 소유 불가.

```
Shell
  ↓
PTY
  ↓
Terminal Renderer (xterm)
  ↓
Semantic Overlay
  ↓
Agent / UX layer
```

### 2.3 Overlay Non-Ownership

Overlay는 다음을 **절대 소유하지 않는다**.

| 영역 | 이유 |
|------|------|
| cursor | PTY가 관리 |
| selection | raw viewport |
| keyboard input | shell control |
| paste | terminal primitive |
| IME | OS input |

Overlay는 **visual augmentation만** 수행한다.

### 2.4 Deterministic Fallback

모든 확장 기능은 실패 시 **raw terminal로 자동 강등**되어야 한다.

- semantic failure
- parser failure
- overlay failure
- agent failure

fallback 결과: **raw terminal only**

사용자는 terminal 기능을 계속 사용할 수 있어야 한다.

### 2.5 Best-Effort Semantics

다음 기능은 **필수 조건이 아님**.

| 기능 | 특성 |
|------|------|
| command markers | optional |
| output parser | optional |
| provenance | optional |
| diagnostics | optional |
| semantic blocks | optional |

Terminal 동작은 이 기능들 없이도 완전해야 한다.

### 2.6 Agent Additive Principle

Agent 기능은 terminal **위에 얹힌다**.

```
Terminal core
   ↑
Agent integration
```

Agent failure가 terminal을 깨뜨려서는 안 된다.

---

## 3. Terminal Mode Contract

Terminal은 3가지 모드를 가진다.

| Mode | 설명 |
|------|------|
| **classic** | raw terminal only |
| **hybrid** | 기본 mode |
| **semantic** | 확장 UX |

### 3.1 Classic Mode

**특징**

- raw viewport
- no semantic overlay
- maximum compatibility

**사용 상황**

- TUI applications
- fallback
- manual switch

### 3.2 Hybrid Mode

**기본 모드**

- raw terminal 유지
- \+ semantic block UX
- \+ parsed decorations
- \+ command rail

TUI 진입 시 **자동 classic fallback**.

### 3.3 Semantic Mode

**확장 UX**

- block terminal UX
- rich command metadata
- advanced overlay

단, PTY 안정성은 동일하게 유지.

---

## 4. Scope Lock

### 4.1 V1 Scope

V1에 포함되는 기능:

| 영역 | 포함 |
|------|------|
| PTY execution | 포함 |
| xterm renderer | 포함 |
| session tabs | 포함 |
| command tracking | 포함 |
| command blocks | 포함 |
| sticky header | 포함 |
| command rail | 포함 |
| search / filter / fold | 포함 |
| parsed diagnostics | 포함 |
| provenance badge | 포함 |
| rerun basic | 포함 |
| policy guard | 포함 |
| alt screen fallback | 포함 |

### 4.2 V1.5 Scope

| 기능 |
|------|
| progress overlay |
| command summary |
| block export |
| workflow picker |
| terminal minimap |

### 4.3 V2 Scope

| 기능 |
|------|
| modern input editor |
| smart completion |
| shared workflow registry |
| multi-agent terminal |
| remote execution |

---

## 5. Compatibility Contract

Terminal은 다음 환경에서 정상 동작해야 한다.

### 5.1 Shell

- bash
- zsh
- pwsh

### 5.2 TUI Programs

- vim
- nvim
- less
- top
- htop
- tmux
- fzf

### 5.3 Toolchains

- cargo
- pytest
- npm
- pnpm

### 5.4 Interaction

보장 항목:

- keyboard input
- IME
- clipboard
- resize
- ansi colors
- cursor control

---

## 6. Fallback Contract

문제 발생 시 동작:

| 상황 | fallback |
|------|----------|
| marker 없음 | raw mode |
| parser 실패 | raw output |
| overlay 오류 | overlay off |
| TUI 진입 | classic mode |
| unknown escape | semantic off |
| agent failure | terminal only |

Fallback 원칙:

1. **자동** — 사용자 개입 없이 강등
2. **무소음** — 에러 팝업 없음 (status bar 표시 정도)
3. **복원 가능** — 원인 해소 시 상위 모드로 복원
4. **로그 기록** — 강등 발생 시 event log에 기록

---

## 7. Event Architecture

Terminal 이벤트는 **5개 그룹**으로 구성된다.

### 7.1 Session Events

- `terminal://session-created`
- `terminal://session-closed`
- `terminal://session-active-changed`

### 7.2 Command Events

- `terminal://command-started`
- `terminal://command-output`
- `terminal://command-completed`

### 7.3 Output Events

- `terminal://parsed-event`
- `terminal://diagnostic-detected`
- `terminal://port-detected`
- `terminal://link-detected`

### 7.4 Compatibility Events

- `terminal://alt-screen-enter`
- `terminal://alt-screen-exit`
- `terminal://fallback-triggered`
- `terminal://overlay-disabled`

### 7.5 Agent Events

- `terminal://agent-exec-started`
- `terminal://agent-exec-completed`
- `terminal://agent-provenance-update`
- `terminal://agent-approval-required`

---

## 8. UX Gate

Warp 수준 UX 최소 기준:

| Gate | 설명 |
|------|------|
| command block | command grouping |
| sticky header | context 유지 |
| command rail | navigation |
| search | command 검색 |
| filter | error only |
| block actions | rerun / copy |
| parsed links | file / url |
| session status | running state |

---

## 9. Agent Gate

Agent integration 최소 기준:

| Gate | 설명 |
|------|------|
| provenance | command source |
| session ownership | agent session |
| approval | dangerous commands |
| rerun | user rerun |
| completion | exit code |

---

## 10. Performance Gate

| Gate | 목표 |
|------|------|
| streaming | input block 금지 |
| large output | scroll 성능 유지 |
| overlay cost | raw 성능 유지 |
| parser | non-blocking |
| resize | 안정 |

---

## 11. Configuration System

### 11.1 User Config

| key | default |
|-----|---------|
| `terminal.mode` | `hybrid` |
| `terminal.overlay` | `true` |
| `terminal.commandRail` | `true` |
| `terminal.stickyHeader` | `true` |
| `terminal.semanticParsing` | `default` |
| `terminal.agentProvenance` | `true` |
| `terminal.revealPolicy` | `on-failure` |

### 11.2 Workspace Config

| key |
|-----|
| `terminal.policy.allow` |
| `terminal.policy.deny` |
| `terminal.workflow.registry` |
| `terminal.parser.enabled` |
| `terminal.agent.exec.mode` |

---

## 12. Acceptance Criteria

기능 완료 기준:

### Command Block

- [ ] start / end detection
- [ ] exit code
- [ ] duration
- [ ] rerun

### Compatibility

- [ ] vim works
- [ ] tmux works
- [ ] less works
- [ ] fzf works

### Agent Integration

- [ ] agent command execution
- [ ] provenance 표시
- [ ] approval 동작
- [ ] completion callback

---

## 13. Gate System

### Gate 그룹

- `gate-comp-*`
- `gate-ux-*`
- `gate-agent-*`
- `gate-perf-*`
- `gate-fallback-*`

### Merge 조건

```
gate-comp      PASS  ← 최우선
gate-fallback  PASS
gate-ux        PASS
gate-agent     PASS
gate-perf      PASS
```

> **UX보다 compatibility / fallback이 상위 게이트이다.**

### PR 리뷰 체크리스트

모든 terminal 관련 PR은 아래를 확인한다:

- [ ] Compatibility First 위반 없음
- [ ] PTY Source of Truth 위반 없음
- [ ] Overlay Non-Ownership 위반 없음
- [ ] Deterministic Fallback 위반 없음
- [ ] 해당 gate 통과 확인
- [ ] V1 scope 범위 내인지 확인

---

## 14. 핵심 요약

Terminal 설계의 가장 중요한 문장:

```
A valid raw terminal experience is mandatory.
Everything else is an additive layer.
```

이 원칙을 유지하면:

- **Warp 수준 UX**
- **완전한 terminal 호환성**
- **AI native 확장성**

을 동시에 달성할 수 있다.

---

## 문서 위치

이 문서는 terminal RFC 시리즈의 **헌법 문서**이다.
모든 설계/구현/리뷰에서 충돌이 발생하면 이 문서가 최우선이다.

```
010-constitution.md  ←  최상위 원칙 (이 문서)
  ├── 011-scope-lock.md        ←  V1/V1.5/V2 범위 상세
  ├── 012-compatibility-contract.md  ←  호환성 테스트 매트릭스
  ├── 013-event-state-ssot.md  ←  스키마/이벤트 SSOT
  └── 014-gates-and-acceptance.md  ←  Gate 추적/설정 상세
```

## 관련 문서

### 설계 문서

- [000-overview.md](./000-overview.md) — 제품 정의 & 전체 기능 스펙
- [001-architecture.md](./001-architecture.md) — Tauri 구현 아키텍처
- [002-agent-integration.md](./002-agent-integration.md) — Agent Panel ↔ Terminal 통합
- [003-agent-terminal-bridge.md](./003-agent-terminal-bridge.md) — Agent Bridge + Command Card
- [004-warp-level-ux.md](./004-warp-level-ux.md) — Warp-Level UX
- [005-compatibility-and-components.md](./005-compatibility-and-components.md) — 호환성 구현 & 컴포넌트 구조

### Lock 상세 문서

- [011-scope-lock.md](./011-scope-lock.md) — V1/V1.5/V2 Scope 상세 & Phase 매핑
- [012-compatibility-contract.md](./012-compatibility-contract.md) — 호환성 Gate 상세, 테스트 매트릭스
- [013-event-state-ssot.md](./013-event-state-ssot.md) — TypeScript 스키마 정의, Jotai Atom SSOT
- [014-gates-and-acceptance.md](./014-gates-and-acceptance.md) — 43개 Gate 추적 템플릿, 런타임 설정 상세
