# RFC-TERMINAL-012: 호환성 계약 — Shell / TUI / IME / Clipboard / Resize / Alt-Screen

| Field | Value |
|-------|-------|
| ID | RFC-TERMINAL-012-COMPATIBILITY-CONTRACT |
| Status | Draft |
| Date | 2026-03-09 |
| Owner | Semantica DevOS |
| Audience | IDE Team, QA Team |
| Parent | RFC-TERMINAL-010-CONSTITUTION |
| Scope | 호환성 게이트, 테스트 매트릭스, 호환 대상 목록 |

---

## 1. 절대 원칙

> **"기본 terminal 기능 확실히 보장"은 선언이 아니라 테스트 매트릭스로 증명해야 한다.**

헌법 §2.1 (Compatibility First)과 §2.2 (PTY Source of Truth)의 구체적 이행 문서이다.

---

## 2. 호환성 게이트 (Compatibility Gates)

| Gate ID | 영역 | 기준 |
|---------|------|------|
| **G-COMP-01** | shell 기본동작 | zsh/bash/pwsh에서 입력/출력/resize/exit 정상 |
| **G-COMP-02** | ANSI 처리 | color/style/cursor 이동 정상 |
| **G-COMP-03** | clipboard | copy/paste/selection 정상 |
| **G-COMP-04** | IME | 한글 입력 정상 |
| **G-COMP-05** | alt-screen | vim/nvim/less/top/htop에서 깨짐 없음 |
| **G-COMP-06** | multiplexer | tmux attach 사용 가능 |
| **G-COMP-07** | interactive finder | fzf류 상호작용 정상 |
| **G-COMP-08** | long output | 대량 로그에서 응답성 유지 |
| **G-COMP-09** | resize | rapid resize에서도 뷰/pty sync 정상 |
| **G-COMP-10** | fallback | semantic failure 시 raw-only 자동 강등 |

---

## 3. 필수 호환성 테스트 대상

이 목록은 spec에 고정한다. V1 merge 전 반드시 검증해야 한다.

### 3.1 Shell

| 대상 | 테스트 범위 |
|------|------------|
| **zsh** | 기본 입출력, prompt, history, completion |
| **bash** | 기본 입출력, prompt, history |
| **pwsh** | PowerShell Core 기본 동작 (Windows/macOS) |

### 3.2 TUI / Full-Screen

| 대상 | 테스트 범위 |
|------|------------|
| **vim** | 편집, 모드 전환, 종료 |
| **nvim** | vim과 동일 + plugin UI |
| **less** | 스크롤, 검색, 종료 |
| **top** | 실시간 갱신, 키 조작 |
| **htop** | 인터랙티브 UI, 마우스 |
| **tmux** | attach/detach, split, resize |
| **fzf** | 인터랙티브 검색, 선택 |

### 3.3 Build Tools / CLIs

| 대상 | 테스트 범위 |
|------|------------|
| **cargo** | build/test 출력, color, progress |
| **pytest** | test 출력, color, summary |
| **pnpm** | install/run 출력, progress bar |
| **npm** | install/run 출력 |

---

## 4. 호환성 테스트 매트릭스

각 Gate × 대상 조합에 대해 Pass/Fail을 기록한다.

| Gate | zsh | bash | pwsh | vim | nvim | less | top | htop | tmux | fzf | cargo | pytest | pnpm | npm |
|------|-----|------|------|-----|------|------|-----|------|------|-----|-------|--------|------|-----|
| G-COMP-01 | | | | - | - | - | - | - | - | - | | | | |
| G-COMP-02 | | | | | | | | | | | | | | |
| G-COMP-03 | | | | | | | - | - | | | - | - | - | - |
| G-COMP-04 | | | | | | - | - | - | | - | - | - | - | - |
| G-COMP-05 | - | - | - | | | | | | | | - | - | - | - |
| G-COMP-06 | - | - | - | - | - | - | - | - | | - | - | - | - | - |
| G-COMP-07 | - | - | - | - | - | - | - | - | - | | - | - | - | - |
| G-COMP-08 | | | | - | - | - | - | - | - | - | | | | |
| G-COMP-09 | | | | | | | | | | | - | - | - | - |
| G-COMP-10 | | | | | | | | | | | | | | |

> `-` = 해당 조합이 적용되지 않음 (e.g. IME + top은 무의미)
> 빈 칸 = V1 merge 전 반드시 Pass 확인 필요

---

## 5. 11가지 필수 보존 동작 (Must-Preserve Behaviors)

RFC 005에서 정의한 11개 호환성 계약을 재확인한다.

| # | 동작 | 설명 |
|---|------|------|
| 1 | stdin/stdout | PTY 기반 입출력 정상 |
| 2 | ANSI sequences | 256-color, true-color, style, cursor 이동 |
| 3 | cursor positioning | absolute/relative cursor move 정상 |
| 4 | copy/paste | system clipboard 연동 |
| 5 | selection | mouse/keyboard selection 정상 |
| 6 | IME | 한글/일본어/중국어 조합 입력 |
| 7 | resize | terminal resize → PTY SIGWINCH sync |
| 8 | alt screen | alternate screen buffer 전환 |
| 9 | full-screen TUI | vim/nvim/less/top/htop 정상 렌더 |
| 10 | job control | Ctrl+C, Ctrl+Z, bg, fg 정상 |
| 11 | tmux/multiplexer | tmux attach, split, resize 정상 |

---

## 6. Overlay 자동 비활성화 조건

overlay가 호환성을 해치는 상황에서는 자동으로 꺼져야 한다.

| 조건 | overlay 동작 |
|------|-------------|
| alt-screen 진입 (`\x1b[?1049h`) | **즉시 off** |
| interactive fullscreen 감지 (vim, htop 등) | **즉시 off** |
| mouse capture mode (`\x1b[?1000h` 등) | **즉시 off** |
| unknown control sequence burst | **off + 경고 로그** |
| alt-screen 복귀 (`\x1b[?1049l`) | **복원** |

---

## 7. Shell Marker Best-Effort 원칙

| 상황 | 동작 |
|------|------|
| marker 정상 삽입 | command boundary tracking 활성 |
| marker 삽입 실패 | raw terminal only, block UX 비활성 |
| marker 파싱 오류 | 해당 command만 raw, 다음 command부터 재시도 |
| 사용자 shell 미지원 | classic mode로 강등, terminal 정상 동작 |

> marker 실패 = terminal 실패가 아니다. 헌법 §2.5 (Best-Effort Semantics) 적용.

---

## 8. Merge 호환성 조건

V1 PR merge 시 아래 조건을 반드시 충족해야 한다:

1. G-COMP-01 ~ G-COMP-10 중 해당 항목 전부 Pass
2. 11가지 필수 보존 동작 전부 확인
3. overlay 자동 비활성화 조건 동작 확인
4. shell marker 실패 시 fallback 동작 확인
5. 최소 zsh + bash + vim + less + tmux + fzf 에서 수동 검증 완료

---

## 관련 문서

- [010-constitution.md](./010-constitution.md) — 비가역 원칙 (상위)
- [005-compatibility-and-components.md](./005-compatibility-and-components.md) — 2-Layer 렌더링, 호환성 구현 상세
- [014-gates-and-acceptance.md](./014-gates-and-acceptance.md) — 전체 Gate & Acceptance
