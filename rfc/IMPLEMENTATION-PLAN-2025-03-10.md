# 도메인 우선 FSD 전환 — 구현 계획

> RFC [2025-03-10-도메인-우선-FSD-하위-구조-전환.md](./2025-03-10-도메인-우선-FSD-하위-구조-전환.md) 실행용 세부 계획.

---

## 요약: 스크립트 vs 직접 작업

| Phase | 스크립트 가능 | 직접 작업 | 비고 |
|-------|--------------|----------|------|
| **Phase 0** | 디렉터리 생성, alias 변경 | 조사·결정 사항 | code vs editor, view 배치 등 |
| **Phase 1** | entities 이동 (`git mv`) | alias 리매핑 (1회) | alias 먼저 바꾼 뒤 이동 |
| **Phase 2** | 도메인骨架 생성, 파일 이동 | import 경로 정리, 통합 테스트 | chat이 가장 복잡 |
| **Phase 3** | 도메인별 이동 스크립트 재사용 | import 정리, bootstrap 교체 | 도메인당 반복 |
| **Phase 4** | 빈 폴더 제거, 문서 갱신 | REPO-STRUCTURE, RFC-010 수정 | |

---

## Phase 0: 준비 (1–2일)

### 스크립트: `scripts/migrate-phase0.sh`

```bash
# 실행: ./scripts/migrate-phase0.sh
```

- `src/shared/entities/` 생성
- `src/shared/bootstrap/` 생성
- `src/domains/` 생성 (빈 루트만)

### 직접 작업

1. **tsconfig.json + vite.config.ts alias 변경**
   - `~entities/*` → `src/shared/entities/*` 로 리매핑 (Phase 1 직전에 적용해도 됨)
   - `~domains/*` → `src/domains/*` 추가

2. **code vs editor 통합 조사**
   - `src/surfaces/code/`, `src/surfaces/editor/` 사용처 확인
   - 통합 시 `domains/editor/`로 합침

3. **surfaceRegistry, SurfaceRouter 이동 결정**
   - `surfaces/surfaceRegistry.ts`, `SurfaceRouter.tsx` → `app/` vs `app/routing/` 등

4. **View 7개 배치 결정**
   - `explorer`, `search`, `symbols`, `findings`, `problems`, `output`, `event-log`
   - `shared/views/` vs `app/views/` 중 선택

---

## Phase 1: shared/entities 이전 (1–3일)

### 전략: alias 리매핑 → 물리 이동

1. **alias 리매핑** (직접 수정)
   - `tsconfig.json` paths: `"~entities/*": ["src/shared/entities/*"]`
   - `vite.config.ts` alias: `"~entities": path.resolve(..., "src/shared/entities")`

2. **스크립트: `scripts/migrate-phase1-entities.sh`**

```bash
# 실행: ./scripts/migrate-phase1-entities.sh
```

- `git mv` 로 아래 엔티티들을 `src/shared/entities/`로 이동:
  - message, session, diff, timeline-event, tool-call, turn-pipeline
  - project-todo, agent-instance, git-history, arena, transaction
  - completion-settings, mcp, mcp-app

### 직접 작업

- CI green 확인
- `entities/` 에 남은 폴더 확인 (도메인 전용 → Phase 2~3에서 이전)

---

## Bootstrap 이전 (Phase 1과 병행)

### 스크립트: `scripts/migrate-bootstrap.sh`

```bash
# 실행: ./scripts/migrate-bootstrap.sh
```

- `shared/bootstrap/` 로 이동할 feature:
  - theme-settings, session-lifecycle, scope-guard, approval-gate
  - session-shortcuts, send-message (hydrate), diff-review (hydrate)
  - slash-command (hydrate), keyboard-navigation
  - background-agent, terminal-bridge, workspace-graph, resource-monitor
  - intent-tracking, semantic-diff, transactional-edit

- View 7개: Phase 0에서 정한 위치로 이동 (예: `shared/views/`)

### 직접 작업

- `bootstrapFeatures.ts` import 경로를 `~shared/bootstrap/` 로 교체
- `app/event-dispatch` 는 `shared/entities` 등으로 import 경로 정리

---

## Phase 2: 파일럿 도메인 (chat) (5–7일)

### 스크립트: `scripts/migrate-phase2-chat.sh`

```bash
# 실행: ./scripts/migrate-phase2-chat.sh [--dry-run]
```

1. **도메인 구조 생성**
   ```
   domains/chat/
   ├── entities/
   ├── features/
   ├── widgets/
   ├── pages/
   │   ├── arena/      # pages/arena 흡수
   │   └── sessions/   # pages/session-list 흡수
   └── index.ts
   ```

2. **이동 대상 (RFC 5장 기준)**

   | 유형 | 이동 대상 |
   |------|----------|
   | surface | `surfaces/chat/` → `domains/chat/` (index.ts, ChatSurface 등) |
   | features | send-message, streaming, prompt-history, clear-conversation, ... |
   | widgets | message-list, message-row, prompt-box, turn-container, ... |
   | pages | pages/chat → domains/chat/pages/, arena, session-list 흡수 |

3. **import 경로 자동 변환** (codemod 또는 스크립트)
   - `~features/send-message` → `~domains/chat/features/send-message`
   - `~widgets/prompt-box` → `~domains/chat/widgets/prompt-box`
   - 기타 chat 관련 경로

### 직접 작업

- chat 도메인 **전용** feature/widget 목록 확정
- 공유 widget (feature-bar 등)은 `shared/widgets/` or `app/widgets/` 결정
- `bootstrapFeatures.ts`: `import '../surfaces/chat'` → `import '~domains/chat'`
- 수동 테스트, CI 확인

---

## Phase 3: 나머지 도메인 (도메인당 2–4일)

### 스크립트: `scripts/migrate-phase3-domain.sh`

```bash
# 실행: ./scripts/migrate-phase3-domain.sh <domain> [--dry-run]
# 예: ./scripts/migrate-phase3-domain.sh overview
```

- `domains/<domain>/` 구조 생성
- `surfaces/<domain>/`, 해당 features, widgets, entities 이동
- pages 흡수 (overview, review, tasks, settings 등)

### 도메인별 직접 작업

| 도메인 | 특이사항 | 예상 일수 |
|--------|----------|-----------|
| overview | 의존 적음, surfaces/overview + repo-explain | 2일 |
| editor | surfaces/editor, code 통합 시 확장 | 3–4일 |
| review | pages/review 흡수, diff-review 연동 | 3일 |
| graph | workspace-graph, workspace-awareness | 2–3일 |
| replay, agent, agents | checkpoint, execution 관련 | 2–3일 |
| orchestrator, tasks | todo-board page 흡수 | 2–3일 |
| reasoning, code, settings | settings page, mcp 등 | 3일 |

### 직접 작업 (공통)

- `bootstrapFeatures.ts` surface import를 `~domains/<id>` 로 교체
- 도메인별 import 정리

---

## Phase 4: 정리 (1–2일)

### 스크립트: `scripts/migrate-phase4-cleanup.sh`

```bash
# 실행: ./scripts/migrate-phase4-cleanup.sh [--dry-run]
```

- 빈 폴더 제거: `entities/`, `features/`, `widgets/`, `pages/`, `surfaces/` (남은 항목 확인 후)
- 기존 alias 제거 또는 deprecated 처리

### 직접 작업

- [REPO-STRUCTURE](../REPO-STRUCTURE.md) 갱신
- [RFC-010](010.md) 3절 구조 갱신

---

## 스크립트 실행 순서

```
1. ./scripts/migrate-phase0.sh
2. ./scripts/apply-phase0-alias.sh   # tsconfig + vite alias 자동 수정
   # 또는 (직접) tsconfig.json paths, vite.config.ts alias 수정
3. ./scripts/migrate-phase1-entities.sh
4. ./scripts/migrate-bootstrap.sh    # Phase 1과 병행
5. (직접) bootstrapFeatures.ts import 수정
6. ./scripts/migrate-phase2-chat.sh
7. (직접) chat import 정리, 검증
8. for domain in overview editor review graph ...; do
     ./scripts/migrate-phase3-domain.sh $domain
     (직접) import 정리
   done
9. ./scripts/migrate-phase4-cleanup.sh
```

---

## 검증 체크리스트 (각 Phase 후)

- [ ] `pnpm run build` 성공
- [ ] `pnpm run test` 통과
- [ ] `pnpm run lint` 통과
- [ ] 앱 실행 후 해당 surface/page 정상 동작

---

## 롤백

- Phase별 별도 PR → Phase 단위 revert
- deprecation re-export: `entities/X` → `shared/entities/X` (2주 유지)
