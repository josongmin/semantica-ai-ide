# Semantica Code Agent Plugin — AI Agent Feature Catalog

> **Last updated:** 2026-03-05
> Architecture: Feature-Sliced Design (FSD) — `app → pages → widgets → features → entities → shared`
> State: Jotai atoms | UI: React + TypeScript | Host: VSCode Extension Webview

---

## Summary

| Layer | Count |
|-------|-------|
| Pages | 6 |
| Entities | 19 |
| Features | 109 |
| Widgets | 103 |
| Slash Commands | 30 |
| Shared UI Primitives | ~35 |

---

## Pages

| Page | Path | Description |
|------|------|-------------|
| Chat | `src/pages/chat/` | 메인 대화 UI — 기본 뷰 |
| Session List | `src/pages/session-list/` | 과거 세션 목록 탐색/복원 |
| Arena | `src/pages/arena/` | 모델 A/B 블라인드 비교 |
| Review | `src/pages/review/` | AI 코드 리뷰 패널 |
| Settings | `src/pages/settings/` | 설정 (Account, MCP, Model, Pipeline, Rules, Theme) |
| Todo Board | `src/pages/todo-board/` | 칸반 스타일 프로젝트 투두 보드 |

---

## Entities (19 domain models)

| Entity | Key Types | Description |
|--------|-----------|-------------|
| message | `UiMessage`, `Turn`, `TurnPhase`, `ServerEvent` | 메시지/턴/이벤트 — 핵심 데이터 모델 |
| session | `SessionMeta`, `Checkpoint`, `ApprovalMode` | 세션 메타데이터 및 체크포인트 |
| diff | `FileChange`, `FileChangeSummary`, `ApprovalStatus` | 턴별 파일 변경 추적 |
| tool-call | `ToolCall`, `ToolCallGroup`, `ToolCategory` | 도구 호출 및 승인 상태 |
| turn-pipeline | `TurnPipeline`, `PipelineStage` | SOTA 턴별 파이프라인 단계 |
| agent-instance | `AgentInstance`, `AgentInstanceStatus` | 병렬 에이전트 인스턴스 |
| arena | `ArenaResponse`, `ArenaWinner`, `ArenaModelSlot` | Arena 비교 상태 |
| browser | `BrowserState`, `BrowserConsoleEntry` | 내장 브라우저 상태 |
| compaction-history | `totalTokensSavedAtom` | 컨텍스트 압축 이력 |
| completion-settings | `CompletionSettings`, `CompletionStats` | 인라인 코드 완성 설정 |
| git-history | `GitCommit`, `autoCommitEnabledAtom` | Git 커밋 이력 |
| mcp | `McpServer`, `McpTool`, `McpToolCall` | MCP 서버 연결/도구 호출 |
| memory-rule | `MemoryRule`, `pinnedMemoryRulesAtom` | 프로젝트 메모리 규칙 |
| plan-checklist | `PlanChecklistItem` | 턴별 에이전트 계획 체크리스트 |
| project-todo | `projectTodoListAtom` | 프로젝트 수준 투두 |
| remote-control | `RemoteCommand`, `RemoteConnectionStatus` | 원격/모바일 제어 |
| review-comment | `ReviewComment`, `ReviewSeverity` | 코드 리뷰 코멘트 |
| semantic-index | `IndexStatus`, `SemanticSearchResult` | 시맨틱 코드 인덱스 |
| timeline-event | `TimelineEvent`, `TimelineEventType` | 이벤트 타임라인 (감사 추적) |

---

## Features (109)

### Core Chat

| Feature | Slash Cmd | Description |
|---------|-----------|-------------|
| send-message | — | 프롬프트 전송 |
| streaming | — | 서버 이벤트 → Jotai store 커밋, postMessage 브릿지 |
| edit-message | — | 이전 메시지 수정 |
| clear-conversation | `/clear` | 대화 전체 초기화 |
| copy-conversation | — | 대화 전체 클립보드 복사 |
| quote-reply | — | 메시지 텍스트 인용 답변 |
| prompt-history | — | Ctrl+R로 프롬프트 이력 퍼지 검색 |
| prompt-suggestions | — | 동적 프롬프트 제안 칩 |
| prompt-templates | — | 재사용 가능한 프롬프트 템플릿 라이브러리 |
| user-input | — | 에이전트가 사용자에게 추가 입력 요청 |

### Session Management

| Feature | Slash Cmd | Description |
|---------|-----------|-------------|
| session-lifecycle | `/new` | 세션 생성/복원/프리페치 |
| session-fork | — | 현재 세션 분기(브랜치) |
| session-share | — | 공유 가능한 세션 링크 생성 |
| session-tags | — | 세션에 컬러 태그 부여 |
| session-schedule | — | 세션 예약 실행 |
| rewind | `/rewind` | 체크포인트로 타임트래블 복원 (Claude Code `/restore` 스타일) |
| checkpoint-restore | — | 체크포인트 복원 (chat/code/both 모드) |
| checkpoint-comparison | — | 두 체크포인트 Side-by-side diff |
| compact-from-turn | `/summarize` | 특정 턴 기준으로 이전 컨텍스트 요약 |
| auto-compact | `/compact` | 임계값 도달 시 자동 컨텍스트 압축 |
| turn-navigation | — | 키보드로 턴 간 이동 |
| export | `/export` | 대화를 Markdown으로 내보내기 |

### AI Agent / Orchestration

| Feature | Slash Cmd | Description |
|---------|-----------|-------------|
| thinking-mode | — | Extended thinking (reasoning) 토글 |
| fast-mode | — | Fast/Turbo 모델 모드 토글 |
| architect-mode | — | Architect 에이전트 계획 모드 |
| background-agent | `/background` | 백그라운드 에이전트 작업 생성/추적 |
| parallel-agents | `/agents` | 다중 병렬 에이전트 실행 및 모니터링 |
| multi-agent-debate | `/debate` | 프롬프트에 대한 다중 에이전트 토론 |
| agent-team | — | 에이전트 팀 채팅/협업 패널 |
| agent-steer | — | 실행 중 에이전트에 방향 전환 시그널 |
| agent-wave | — | 에이전트 배치 오케스트레이션 |
| boomerang-tasks | — | 하위 태스크 → 결과를 부모 턴으로 반환 |
| strategy-orchestrator | — | 상위 전략 선택/디스패치 |
| model-switcher | `/model` | 세션 중 AI 모델 변경 |
| model-routing | — | 태스크 유형별 자동 모델 라우팅 |
| three-model | — | 3개 모델 동시 비교 패널 |
| arena-mode | `/arena` | Arena(A/B 블라인드) 모델 비교 |
| action-replay | `/replay` | 턴별 에이전트 액션 리플레이 디버거 |

### Safety & Approval Pipeline

| Feature | Description |
|---------|-------------|
| approval-gate | 도구 호출 승인 게이트 + Optimistic UX |
| tool-approval-memory | 도구 패턴별 승인 기억 |
| permission-settings | 카테고리별 도구 권한 프리셋 (Yolo/Normal/Strict) |
| scope-guard | 글로브 패턴으로 파일 접근 제한 |
| fail-closed | 파이프라인 에러 시 안전 폴백 |
| input-gate | 사용자 입력 검증/새니타이즈 |
| side-effect-budget | 턴당 부작용 예산 상한 |
| validation-core | SOTA 파이프라인 핵심 검증 패스 |
| drift-guard | 스펙/코드베이스 표류 감지 |

### SOTA Verification Pipeline

| Feature | Description |
|---------|-------------|
| pipeline-settings | 파이프라인 모드 및 단계 가시성 제어 |
| evidence-trace | 에이전트 결정 근거 증거 수집 |
| explainable-verdict | 에이전트 액션에 대한 설명 가능한 판정 |
| verifier-result | Pass/Fail 검증기 결과 |
| risk-heatmap | 파일/턴별 리스크 점수 히트맵 |
| living-spec | 살아있는 명세 문서 추적 |
| diagnostics | 파일별 진단(lint/type 에러) 추적 |
| security-scan | 보안 스캔 결과 |

### Context Management

| Feature | Slash Cmd | Description |
|---------|-----------|-------------|
| context-monitor | — | 컨텍스트 윈도우 압력 모니터링 |
| context-breakdown | — | 컨텍스트 사용량 세그먼트별 시각화 |
| context-spaces | `/context` | 이름 붙은 컨텍스트 워크스페이스 |
| auto-context | `/smartctx` | 관련 파일 자동 컨텍스트 큐레이션 |
| auto-memory | — | 자동 메모리 규칙 제안/수락 |
| project-memory | `/memory` | 프로젝트 영구 메모리 규칙 관리 |

### Code / Diff Tools

| Feature | Slash Cmd | Description |
|---------|-----------|-------------|
| diff-review | — | 파일 diff 인라인 리뷰 |
| review-changes | `/review` | 세션 내 모든 변경 파일 리뷰 |
| code-review | — | AI 기반 코드 리뷰 |
| three-way-diff | — | 3-way diff (base/ours/theirs) 뷰 |
| patch-simulation | — | 패치 적용 시뮬레이션 및 충돌 감지 |
| fix-in-editor | — | 에러/진단 → 에이전트 수정 프롬프트 전송 |
| git-auto-commit | `/gitlog` | 에이전트 변경 후 자동 커밋 |
| speculative-edit | `/speculate` | 고스트 텍스트 추측 편집 미리보기 |
| click-to-edit | — | UI 요소 클릭 → 에디터 소스 열기 |
| code-block-picker | `/copy` | 대화 속 코드블록 검색/복사/삽입 (Claude Code `/copy` 스타일) |

### File & Project

| Feature | Slash Cmd | Description |
|---------|-----------|-------------|
| file-attachment | — | 프롬프트에 파일 첨부 |
| file-watch | — | 외부 파일 변경 감시 |
| workspace-awareness | — | 세션 내 에이전트 읽기/쓰기 파일 추적 |
| project-todo | — | 프로젝트 수준 투두 항목 관리 |
| semantic-search | `/index` | 시맨틱 코드베이스 검색 |

### MCP (Model Context Protocol)

| Feature | Slash Cmd | Description |
|---------|-----------|-------------|
| mcp-manager | `/mcp` | MCP 서버 추가/제거/설정 |
| mcp-registry | — | MCP 서버 레지스트리 탐색/설치 |

### Developer / Debug Tools

| Feature | Description |
|---------|-------------|
| debug-state | 백엔드 디버그 상태 스냅샷 |
| hook-events | 훅 라이프사이클 이벤트(pre/post tool) 추적 |
| terminal-output | 터미널 커맨드 출력 스트리밍 |
| test-results | 테스트 실행 결과 |
| ci-cd-status | CI/CD 파이프라인 상태 |
| deploy-status | 배포 상태 표시기 |
| gantt-timeline | 에이전트 태스크 Gantt 차트 타임라인 |
| live-preview | 라이브 웹 미리보기 패널 |
| browser-automation | 브라우저 자동화 액션/스크린샷 |
| browser-preview | 내장 브라우저 미리보기 |
| machine-snapshots | VM/머신 스냅샷 목록 |
| inline-completion | 인라인 코드 완성 (Copilot 스타일) |
| usage-dashboard | API 사용량 대시보드 (비용, 세션수, 모델별 토큰) |

### External Integrations & Status

| Feature | Slash Cmd | Description |
|---------|-----------|-------------|
| auth-status | — | 인증/로그인 상태 |
| quota-status | — | API 쿼터/속도 제한 상태 |
| plugin-status | — | 활성 플러그인 목록/상태 |
| sandbox-status | — | 샌드박스 환경 상태 |
| bugbot-status | — | BugBot 연동 상태 |
| integration-status | — | 서드파티 연동 상태 |
| worktree-status | — | Git 워크트리 상태 |
| ticket-link | — | 이슈 트래커 티켓 연결 |
| remote-control | `/remote` | 원격/모바일 디바이스 제어 |

### Team & Config

| Feature | Slash Cmd | Description |
|---------|-----------|-------------|
| team-config-sync | — | 팀 공유 설정 동기화/diff |
| agent-rules | `/rules` | 에이전트 규칙 관리 (.cursorrules / CLAUDE.md) |
| playbook-market | — | 플레이북 템플릿 마켓 |
| mode-gallery | — | 운영 모드 갤러리 |

### UI / UX

| Feature | Slash Cmd | Description |
|---------|-----------|-------------|
| slash-command | — | 슬래시 커맨드 시스템 (퍼지 매칭, 카테고리, 인자 완성) |
| slash-command-args | — | 커맨드별 인자 자동완성 |
| theme-settings | `/settings` | 테마 전환 + 프리셋 (10+) |
| keyboard-navigation | — | 글로벌 키보드 단축키 및 네비게이션 |
| notifications | — | 인앱 토스트 알림 |
| privacy-mode | — | 민감 정보 마스킹 |
| voice-input | — | 음성 입력 / STT |
| breadcrumb-nav | — | 브레드크럼 네비게이션 |
| scratchpad | — | 세션 내 스크래치 메모 |
| deep-wiki | — | AI 생성 코드베이스 위키 |
| pr-summary | — | AI PR 요약 생성 |
| completion-settings | `/completion` | 인라인 완성 설정 다이얼로그 |

---

## Slash Commands (30)

### Session
| Command | Description | Shortcut |
|---------|-------------|----------|
| `/new` | Start a new session | — |
| `/clear` | Clear current conversation | — |
| `/compact` | Compact context to free space | — |
| `/export` | Export conversation as markdown | — |

### Tools
| Command | Description | Shortcut |
|---------|-------------|----------|
| `/undo` | Undo last agent action | `Ctrl+Z` |
| `/redo` | Redo undone action | `Ctrl+Shift+Y` |
| `/approve` | Approve all pending tool calls | — |
| `/rewind` | Rewind to a previous checkpoint | `Ctrl+Shift+Z` |
| `/copy` | Pick a code block to copy from responses | — |
| `/summarize` | Summarize older messages to free context | — |

### Navigation
| Command | Description |
|---------|-------------|
| `/history` | Browse session history |
| `/context` | Show context spaces |

### Settings
| Command | Description |
|---------|-------------|
| `/model` | Switch AI model |
| `/settings` | Open settings page |
| `/help` | Show help guide |

### Standard Features
| Command | Description |
|---------|-------------|
| `/agents` | Open parallel agents panel |
| `/index` | Open semantic search |
| `/mcp` | Open MCP manager |
| `/completion` | Open completion settings |
| `/browser` | Open browser preview |
| `/memory` | Open project memory |
| `/arena` | Start arena mode |
| `/gitlog` | Show git history |
| `/review` | Review changed files |
| `/remote` | Open remote control |

### SOTA Pipeline Features
| Command | Description |
|---------|-------------|
| `/rules` | Load agent rules |
| `/smartctx` | Auto-curate context for current prompt |
| `/speculate` | Generate speculative edits |
| `/background` | Launch background agent job |
| `/replay` | Replay last turn actions |
| `/debate` | Start multi-agent debate |

---

## Widgets (103 directories)

### Chat & Messaging (8)

| Dir | Component | Description |
|-----|-----------|-------------|
| `message-list` | `MessageList` | 대화 메시지 목록 컨테이너 |
| `message-row` | `MessageRow` | 개별 메시지 행 |
| `user-input-card` | `UserInputCard` | 사용자 입력 메시지 카드 |
| `prompt-box` | `PromptBox` | 프롬프트 입력/전송 박스 |
| `prompt-templates` | `PromptTemplateLibrary` | 재사용 가능한 프롬프트 템플릿 라이브러리 |
| `voice-input` | `VoiceInputButton` | 음성 입력(STT) 마이크 버튼 |
| `quote-reply` | `QuoteBlock`, `QuoteSelectionPopover` | 텍스트 인용 답변 팝오버 |
| `click-to-edit` | `ClickToEditOverlay` | 클릭으로 인라인 편집 오버레이 |

### Turn / Pipeline (8)

| Dir | Component | Description |
|-----|-----------|-------------|
| `turn-container` | `TurnContainer` | 에이전트 턴(요청~응답) 전체 컨테이너 |
| `turn-metrics` | `TurnMetrics` | 턴별 토큰 수·비용 등 성능 지표 |
| `turn-bookmark` | `TurnBookmarkButton`, `BookmarkDrawer` | 턴 북마크 추가 및 서랍 목록 |
| `pipeline-badge` | `PipelineBadge` | 파이프라인 단계 상태 배지 |
| `progress-indicator` | `ProgressIndicator` | 에이전트 작업 진행 인디케이터 |
| `tool-call-group` | `ToolCallGroup`, `ToolCallRow`, `DangerousApprovalGate` | 도구 호출 그룹 표시 + 위험 승인 게이트 |
| `tool-output-viewer` | `ToolOutputViewer` | 도구 실행 결과 출력 뷰어 |
| `activity-feed` | `ActivityFeed` | 에이전트 작업 이벤트 실시간 피드 |

### Header & Navigation (6)

| Dir | Component | Description |
|-----|-----------|-------------|
| `header-bar` | `HeaderBar` | 앱 최상단 헤더 바 |
| `breadcrumb-nav` | `BreadcrumbNav` | 빵 부스러기 경로 네비게이션 |
| `feature-bar` | `FeatureBar` | 주요 기능 토글 버튼 바 |
| `model-switcher` | `ModelSwitcherMenu` | AI 모델 전환 드롭다운 |
| `settings-menu` | `SettingsMenu` | 설정 드롭다운 메뉴 |
| `mode-gallery` | `ModeGallery` | 에이전트 모드 갤러리 선택 |

### Code & Diff (11)

| Dir | Component | Description |
|-----|-----------|-------------|
| `diff-viewer` | `DiffViewer` | 인라인/사이드바이사이드 diff 뷰어 |
| `three-way-diff` | `ThreeWayDiff` | base/ours/theirs 3-way diff 뷰 |
| `file-change-summary` | `FileChangeSummaryWidget`, `FileChangeRow`, `FileChangeTreeView` | 변경 파일 요약/트리 뷰 |
| `file-tree` | `FileTree`, `FileTreeNode` | 프로젝트 파일 트리 탐색 |
| `file-permalink` | `FilePermalinkBadge` | 파일·라인 영구 링크 배지 |
| `code-block-picker` | `CodeBlockPickerDialog` | 대화 내 코드블록 선택/복사 다이얼로그 |
| `patch-simulation` | `PatchSimulationBanner`, `ConflictBadge` | 패치 시뮬레이션 결과 + 충돌 배지 |
| `review-changes-panel` | `ReviewChangesPanel` | 에이전트 제안 변경사항 검토 패널 |
| `review-panel` | `ReviewCommentCard`, `ReviewFileSection` | 코드 리뷰 댓글/파일 섹션 패널 |
| `fix-in-editor` | `FixButton` | 에디터에서 직접 수정 트리거 버튼 |
| `live-preview` | `LivePreviewPanel` | 변경사항 실시간 미리보기 패널 |

### Agent & Orchestration (12)

| Dir | Component | Description |
|-----|-----------|-------------|
| `agents-panel` | `AgentsPanel` | 활성 에이전트 목록/상태 관리 패널 |
| `agent-team` | `AgentTeamChat` | 에이전트 팀 채팅 뷰 |
| `agent-rules-panel` | `AgentRulesPanel` | 에이전트 동작 규칙 편집/관리 패널 |
| `architect-mode` | `ArchitectModeIndicator` | 아키텍트 모드 활성화 인디케이터 |
| `approval-banner` | `ApprovalBanner` | 에이전트 작업 승인 요청 배너 |
| `mission-control` | `MissionControlCard`, `MissionControlGrid` | 다중 에이전트 대시보드 그리드 |
| `background-jobs-panel` | `BackgroundJobsPanel` | 백그라운드 에이전트 작업 목록 |
| `boomerang-tasks` | `BoomerangTaskList` | 부메랑 태스크(하위→부모 반환) 목록 |
| `model-routing` | `ModelRoutingIndicator` | 모델 라우팅 경로 시각화 |
| `three-model-panel` | `ThreeModelPanel` | 3개 모델 응답 나란히 비교 패널 |
| `workspace-awareness` | `WorkspaceAwarenessPanel`, `WorkspaceFileRow` | 에이전트 인지 워크스페이스 파일 현황 |

### Arena & Comparison (2)

| Dir | Component | Description |
|-----|-----------|-------------|
| `arena-view` | `ArenaView`, `ArenaResponsePanel` | 모델 A/B 경쟁 아레나 뷰 |
| `debate-arena` | `DebateArena` | 다중 에이전트 디베이트 아레나 |

### Context & Memory (13)

| Dir | Component | Description |
|-----|-----------|-------------|
| `context-banner` | `ContextBanner` | 현재 세션 컨텍스트 정보 배너 |
| `context-spaces` | `ContextSpacePanel` | 컨텍스트 공간 생성/전환 패널 |
| `memory-panel` | `MemoryPanel`, `MemoryRuleRow` | 에이전트 메모리 규칙 조회/편집 패널 |
| `pinned-memory` | `PinnedMemoryStrip` | 고정 메모리 항목 상단 스트립 |
| `auto-memory` | `AutoMemoryToast` | 자동 메모리 저장 토스트 알림 |
| `auto-context-preview` | `AutoContextPreview` | 자동 삽입 컨텍스트 미리보기 |
| `auto-compact-dialog` | `AutoCompactDialog` | 자동 컨텍스트 압축 확인 다이얼로그 |
| `compaction-history-panel` | `CompactionHistoryPanel` | 컨텍스트 압축 이력 조회 패널 |
| `semantic-search-panel` | `SemanticSearchPanel`, `IndexStatusBadge` | 시맨틱 검색 + 인덱스 상태 배지 |
| `scratchpad` | `ScratchpadPanel` | 임시 메모 스크래치패드 |
| `deep-wiki` | `DeepWikiPanel` | AI 생성 코드베이스 위키 패널 |
| `symbol-panel` | `SymbolPanel`, `SymbolRow` | 코드 심볼(함수·클래스) 탐색 패널 |
| `quick-file-open` | `QuickFileOpenPalette` | 파일 빠르게 열기 커맨드 팔레트 |

### MCP / External Tools (7)

| Dir | Component | Description |
|-----|-----------|-------------|
| `mcp-panel` | `McpPanel`, `McpStatusBadge` | MCP 서버 연결/도구 관리 패널 |
| `mcp-registry` | `McpRegistryBrowser` | MCP 서버 레지스트리 탐색 브라우저 |
| `browser-panel` | `BrowserPanel`, `BrowserConsoleRow` | 내장 브라우저 + 콘솔 출력 패널 |
| `browser-automation` | `BrowserAutomationPanel` | 브라우저 자동화 단계 시각화 |
| `terminal-output-viewer` | `TerminalOutputViewer` | 터미널 명령 출력 뷰어 (ANSI 컬러) |
| `integration-status` | `IntegrationStatusPanel` | 외부 서비스 연동 상태 표시 |
| `ticket-link` | `TicketLinkPanel` | 이슈 트래커 티켓 링크 관리 패널 |

### Safety & Approval (8)

| Dir | Component | Description |
|-----|-----------|-------------|
| `scope-guard` | `ScopeGuardDialog`, `ScopeViolationBanner` | 작업 범위 위반 감지/경고 배너 |
| `permission-settings` | `PermissionSettingsDialog` | 파일·명령 권한 설정 다이얼로그 |
| `input-gate-panel` | `InputGatePanel` | 입력 유효성 검사/게이팅 규칙 패널 |
| `drift-guard-indicator` | `DriftGuardIndicator` | 의도 경로 이탈 경고 인디케이터 |
| `risk-heatmap` | `RiskHeatmapWidget` | 파일·작업별 위험도 히트맵 |
| `error-classification` | `ErrorClassification` | 에러 유형별 분류 표시 |
| `validation-panel` | `ValidationPanel` | 에이전트 출력 검증 결과 패널 |
| `restore-mode` | `RestoreModeDialog` | 체크포인트 복원 모드 선택 다이얼로그 |

### SOTA Pipeline & Replay (12)

| Dir | Component | Description |
|-----|-----------|-------------|
| `evidence-bundle-viewer` | `EvidenceBundleViewer` | 에이전트 결정 근거 증거 묶음 표시 |
| `explainable-verdict` | `ExplainableVerdictWidget` | 설명 가능한 판정 이유 위젯 |
| `speculative-preview` | `SpeculativePreview` | 예상 편집 결과 미리보기 |
| `strategy-dashboard` | `StrategyDashboard` | 전략 선택 과정 대시보드 |
| `action-replay-panel` | `ActionReplayPanel` | 과거 액션 시퀀스 재현/분석 패널 |
| `timeline-replay-bar` | `TimelineReplayBar` | 세션 타임라인 스크럽 재생 바 |
| `checkpoint-timeline` | `CheckpointTimeline` | 체크포인트 타임라인 시각화 |
| `checkpoint-comparison-panel` | `CheckpointComparisonPanel` | 두 체크포인트 상태 비교 패널 |
| `rewind-panel` | `RewindPanel` | 체크포인트로 세션 되감기 패널 |
| `machine-snapshots` | `MachineSnapshotList` | VM/머신 스냅샷 목록 복원 |
| `fork-indicator` | `ForkIndicator` | 세션 포크 상태 표시 |
| `gantt-timeline` | `GanttTimeline` | 에이전트 작업 간트 차트 타임라인 |

### Session & Status (7)

| Dir | Component | Description |
|-----|-----------|-------------|
| `session-summary` | `SessionSummaryCard` | 세션 결과 요약 카드 |
| `session-cost-badge` | `SessionCostBadge` | 세션 누적 API 비용 배지 |
| `session-share-dialog` | `SessionShareDialog` | 세션 공유 다이얼로그 |
| `usage-dashboard` | `UsageDashboard` | API 사용량(비용·토큰·세션수) 대시보드 |
| `remote-panel` | `RemotePanel` | 원격 에이전트 세션 연결/관리 패널 |
| `privacy-indicator` | `PrivacyIndicator` | 데이터 프라이버시 수준 표시 |
| `pr-summary-card` | `PRSummaryCard` | PR 핵심 정보 요약 카드 |

### Project & Productivity (3)

| Dir | Component | Description |
|-----|-----------|-------------|
| `plan-checklist` | `PlanChecklistWidget`, `PlanChecklistItemRow` | 에이전트 실행 계획 체크리스트 |
| `project-todo-card` | `ProjectTodoCardWidget`, `ProjectTodoItemRow` | 프로젝트 할 일 카드/행 |
| `todo-board` | `TodoBoard`, `TodoBoardCard`, `TodoBoardColumn` | 칸반 보드 형태 할 일 관리 |

### Developer & Config (6)

| Dir | Component | Description |
|-----|-----------|-------------|
| `dev-scenario-bar` | `DevScenarioBar`, `DevScenarioPopover` | 개발 테스트 시나리오 주입 도구 바 |
| `git-history-panel` | `GitHistoryPanel`, `GitCommitRow` | Git 커밋 히스토리 조회 패널 |
| `completion-settings-dialog` | `CompletionSettingsDialog` | 모델 완성 파라미터 조정 다이얼로그 |
| `playbook-market` | `PlaybookMarket` | 에이전트 플레이북 마켓플레이스 |
| `team-config-sync` | `TeamConfigSync` | 팀 간 에이전트 설정 동기화 |
| `export-dialog` | `ExportDialog` | 대화/결과물 내보내기 다이얼로그 |

---

## Shared Layer

### UI Primitives (`src/shared/ui/`)

**Tier 1 — Base:**
`Button` · `Badge` · `Icon` · `Text` · `Kbd` · `Spinner` · `StatusDot` · `ProgressBar` · `Skeleton`

**Tier 2 — Interactive:**
`Dialog` · `Tabs` · `Tooltip` · `Popover` · `DropdownMenu` · `SegmentedControl` · `Collapsible` · `BarChart`

**Tier 3 — Composite:**
`CommandPalette` · `ActionBar` · `EmptyState` · `IconLabel` · `InlineBanner` · `LazyPanel` · `ListRow` · `StatusLine` · `ToastContainer` · `MarkdownContent` · `StreamingCursor` · `ThinkingIndicator`

**Tier 4 — Layout:**
`PanelLayout` · `ScrollArea` · `StickyHeader`

### State Atoms (`src/shared/lib/atoms/`)

| Module | Description |
|--------|-------------|
| `uiAtoms` | 페이지 네비게이션, 뷰 모드, fast/thinking 모드 |
| `panelAtoms` | ~20개 패널 가시성 토글 |
| `overlayAtoms` | 오버레이/모달 스택 관리 |
| `toastAtoms` | 글로벌 토스트 알림 스택 |
| `bookmarkAtoms` | 턴 북마크 상태 |
| `quoteAtoms` | 인용 답변 대기 상태 |
| `attachmentAtoms` | 파일 첨부 대기 상태 |
| `progressAtoms` | 범용 키 기반 진행 추적 |
| `filePermalinkAtoms` | 파일→턴 인덱스 매핑 |
| `sessionPersistenceAtoms` | VSCode 세션 상태 영속화 |
| `createStateAtomSet` | `[value, set, reset]` 팩토리 |
| `createPushAtomSet` | append-only 리스트 atom 팩토리 |

### Protocol (`src/shared/protocol/types.ts`)

Core branded IDs: `MessageId`, `TurnId`, `SessionId`, `ToolCallId`

Turn phases: `user_message` → `thinking` → `analysis` → `plan` → `changes` → `summary`

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    VSCode Extension Host              │
│  (Node.js — session mgmt, git, tools, LLM calls)    │
└──────────────────────┬──────────────────────────────┘
                       │ postMessage / ServerEvent
┌──────────────────────▼──────────────────────────────┐
│                     Webview (React)                   │
│                                                       │
│  ┌─────────┐  ┌──────────┐  ┌──────────────────┐    │
│  │  Pages   │  │ Widgets  │  │   Shared UI      │    │
│  │ (6)      │  │ (103)    │  │   Primitives     │    │
│  └────┬─────┘  └────┬─────┘  └──────────────────┘    │
│       │              │                                 │
│  ┌────▼──────────────▼─────┐  ┌──────────────────┐   │
│  │      Features (109)     │  │  Shared Lib      │   │
│  │  atoms + hooks + logic  │  │  hooks, utils    │   │
│  └────────────┬────────────┘  └──────────────────┘   │
│               │                                       │
│  ┌────────────▼────────────┐                          │
│  │    Entities (19)        │                          │
│  │  domain models + atoms  │                          │
│  └─────────────────────────┘                          │
│                                                       │
│  State: Jotai atoms  │  Styling: Tailwind + VSCode    │
│                       │  tokens                        │
└───────────────────────────────────────────────────────┘
```

---

## Notable Design Patterns

1. **Slash Command Registry** — 모든 커맨드가 `registry.ts`에 선언적 등록. `CommandAction` 타입으로 실행 분기 (`execute` / `send_message` / `navigate` / `open_sub_panel`)

2. **Client-side Panel Opening** — `useCommandExecution`에서 Rewind, Code Block Picker 등은 Jotai atom 직접 제어, 나머지는 extension host로 `OPEN_SUB_PANEL` 메시지 전송

3. **Turn Pipeline** — 6단계 파이프라인 (`user_message → thinking → analysis → plan → changes → summary`), 각 단계별 에이전트 페르소나

4. **Approval Gate** — 도구 호출마다 승인 게이트, Optimistic UX로 빠른 승인, 패턴별 기억으로 반복 승인 제거

5. **Mock Backend** — `src/app/dev/mockBackend/` 에서 모든 메시지 타입 핸들러 시뮬레이션, 개발 시 extension host 없이 독립 실행 가능

6. **Atom Factory** — `createStateAtomSet`, `createPushAtomSet` 팩토리로 보일러플레이트 최소화

7. **Feature-Sliced Isolation** — 각 feature는 독립적 `index.ts` export, 위젯 간 의존은 shared atoms를 통해서만 연결
