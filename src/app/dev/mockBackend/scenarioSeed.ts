import type { MessageId, ServerEvent, SessionId, TurnId } from "../../../shared/protocol";
import { nextId } from "./MockBackendCore";

/**
 * Generate initial serverEvents to seed the UI with realistic data on page load.
 * Returns an array of serverEvents to be posted immediately.
 */
export function createSeedServerEvents(): ServerEvent[] {
  const sessionId = nextId("session") as SessionId;
  const turnId = nextId("turn") as TurnId;
  const userMsgId = nextId("msg") as MessageId;
  const assistantMsgId = nextId("msg") as MessageId;
  const now = Date.now();

  return [
    // Session meta
    {
      t: "SET_SESSION_META",
      meta: {
        session_id: sessionId,
        model_id: "claude-opus-4-6",
        model_label: "Claude Opus 4.6",
        approval_mode: "auto",
        status: "idle",
        cost_usd: 0.0127,
        tokens_in: 2340,
        tokens_out: 892,
      },
    },
    // Available models
    {
      t: "SET_AVAILABLE_MODELS",
      models: [
        { id: "claude-opus-4-6", label: "Claude Opus 4.6", provider: "anthropic", supports_thinking: true },
        { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "anthropic", supports_thinking: true },
        { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "anthropic", supports_thinking: false },
      ],
    },
    // Current page
    { t: "SET_CURRENT_PAGE", page: "chat" },
    // Project files — realistic project structure
    {
      t: "SET_PROJECT_FILES",
      files: [
        "src/main.tsx",
        "src/app/App.tsx",
        "src/app/shell/ShellLayout.tsx",
        "src/app/shell/ShellSidebar.tsx",
        "src/app/shell/ShellAgentPanel.tsx",
        "src/app/shell/shellAtoms.ts",
        "src/app/event-dispatch/index.ts",
        "src/app/menu/index.ts",
        "src/shared/protocol/types.ts",
        "src/shared/protocol/serverEvent.ts",
        "src/shared/lib/atoms/uiAtoms.ts",
        "src/shared/lib/atoms/hostDataAtoms.ts",
        "src/shared/lib/vscodeApi.ts",
        "src/shared/ui/index.ts",
        "src/shared/ui/primitives/Button.tsx",
        "src/shared/ui/primitives/Badge.tsx",
        "src/shared/ui/primitives/Icon.tsx",
        "src/shared/ui/primitives/Dialog.tsx",
        "src/shared/ui/primitives/Spinner.tsx",
        "src/shared/ui/composites/AgentCard.tsx",
        "src/shared/ui/composites/ListRow.tsx",
        "src/shared/ui/composites/CommandPalette.tsx",
        "src/shared/ui/variants.ts",
        "src/shared/ui/tokens.ts",
        "src/entities/message/index.ts",
        "src/entities/message/MessageContent.tsx",
        "src/features/send-message/index.ts",
        "src/features/send-message/useSendMessage.ts",
        "src/features/session-lifecycle/index.ts",
        "src/features/streaming/useStreamingCommit.ts",
        "src/features/theme-settings/index.ts",
        "src/pages/chat/ChatPage.tsx",
        "src/pages/review/ReviewPage.tsx",
        "src/pages/settings/SettingsPage.tsx",
        "src/surfaces/editor/EditorSurface.tsx",
        "src/surfaces/editor/EditorTabBar.tsx",
        "src/surfaces/review/ReviewSurface.tsx",
        "src/surfaces/replay/ReplaySurface.tsx",
        "src/surfaces/agent/AgentSurface.tsx",
        "src/surfaces/graph/GraphSurface.tsx",
        "src/surfaces/orchestrator/OrchestratorSurface.tsx",
        "src/surfaces/SurfaceRouter.tsx",
        "src/widgets/prompt-box/PromptBox.tsx",
        "src/widgets/message-row/MessageRow.tsx",
        "src/widgets/turn-container/TurnContainer.tsx",
        "src/widgets/header-bar/HeaderBar.tsx",
        "src/widgets/feature-bar/FeatureBar.tsx",
        "src/widgets/session-tab-bar/SessionTabBar.tsx",
        "package.json",
        "tsconfig.json",
        "vite.config.ts",
        "tailwind.config.ts",
        "README.md",
        ".eslintrc.cjs",
      ],
    },
    // Index status
    { t: "SET_INDEX_STATUS", status: "ready", progress: 100, file_count: 156 },
    // Thinking mode on by default
    { t: "SET_THINKING_MODE", enabled: true },
    // One completed turn so UI is not empty
    {
      t: "UPSERT_MESSAGE",
      msg: {
        id: userMsgId,
        turn_id: turnId,
        role: "user",
        created_at_ms: now - 60_000,
        text: "프로젝트 구조 설명해줘",
        status: "final",
      },
    },
    {
      t: "UPSERT_MESSAGE",
      msg: {
        id: assistantMsgId,
        turn_id: turnId,
        role: "assistant",
        created_at_ms: now - 55_000,
        text: "이 프로젝트는 **Feature Sliced Design (FSD)** 아키텍처를 따릅니다.\n\n### 레이어 구조\n- `shared/` — UI 프리미티브, 프로토콜 타입, 유틸리티\n- `entities/` — Jotai atom 기반 도메인 모델 (message, session)\n- `features/` — 비즈니스 로직 (send-message, streaming)\n- `widgets/` — 조합 컴포넌트 (TurnContainer, MessageRow, PromptBox)\n- `pages/` — 라우트 페이지 (ChatPage, SessionsPage)\n- `app/` — 앱 진입점, 프로바이더, 라우터\n\n각 Turn은 6개 Phase로 구성됩니다: `user_message → thinking → analysis → plan → changes → summary`",
        status: "final",
      },
    },
    {
      t: "UPSERT_TURN",
      turn: {
        id: turnId,
        phases: [
          {
            phase: "user_message",
            message_ids: [userMsgId],
            tool_call_ids: [],
            summary: "프로젝트 구조 설명해줘",
            collapsed: false,
            status: "success",
          },
          {
            phase: "thinking",
            message_ids: [],
            tool_call_ids: [],
            summary: "Analyzing project structure",
            collapsed: true,
            status: "success",
          },
          {
            phase: "summary",
            message_ids: [assistantMsgId],
            tool_call_ids: [],
            summary: "프로젝트 아키텍처 설명 완료",
            collapsed: false,
            status: "success",
          },
        ],
        status: "success",
        created_at_ms: now - 60_000,
      },
    },
  ];
}
