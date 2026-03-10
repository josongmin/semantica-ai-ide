/**
 * Shared Constants & Utilities for Handler Modules
 *
 * Contains model labels, intent summaries, cost/token estimates,
 * and other constants shared across multiple handler files.
 */

// ── Model labels ──────────────────────────────────────────────

export const MODEL_LABELS: Record<string, string> = {
  "claude-opus-4-6": "Claude Opus 4.6",
  "claude-sonnet-4-6": "Claude Sonnet 4.6",
  "claude-haiku-4-5": "Claude Haiku 4.5",
};

// ── Intent-based phase summaries ──────────────────────────────

export const INTENT_SUMMARIES: Record<string, string> = {
  Q_INFO: "Understanding the question...",
  Q_LOCATE: "Searching codebase...",
  Q_DIAG: "Diagnosing the issue...",
  Q_FIX: "Analyzing the bug...",
  Q_REFACTOR: "Analyzing code structure...",
  Q_SEC: "Running security scan...",
  Q_PERF: "Profiling performance...",
  Q_SPEC: "Analyzing specifications...",
  Q_MIGRATE: "Planning migration...",
};

export const ANALYSIS_SUMMARIES: Record<string, string> = {
  Q_INFO: "Reading relevant files...",
  Q_LOCATE: "Searching project files...",
  Q_DIAG: "Reading error context...",
  Q_FIX: "Reading affected files...",
  Q_REFACTOR: "Analyzing patterns...",
  Q_SEC: "Scanning for vulnerabilities...",
  Q_PERF: "Profiling components...",
  Q_SPEC: "Reading type definitions...",
  Q_MIGRATE: "Auditing dependencies...",
};

// ── Cost/token estimates by change size ───────────────────────

const COST_RANGES: Record<string, [number, number]> = {
  C0: [0.003, 0.005], C1: [0.008, 0.012], C2: [0.015, 0.02], C3: [0.03, 0.04],
};
const TOKEN_IN_RANGES: Record<string, [number, number]> = {
  C0: [800, 1200], C1: [1500, 2000], C2: [3000, 3000], C3: [5000, 5000],
};
const TOKEN_OUT_RANGES: Record<string, [number, number]> = {
  C0: [300, 500], C1: [500, 1000], C2: [1000, 1500], C3: [2000, 3000],
};

export function getCost(changeSize: string): number {
  const [base, range] = COST_RANGES[changeSize] ?? [0.005, 0.01];
  return base + Math.random() * range;
}

export function getTokensIn(changeSize: string): number {
  const [base, range] = TOKEN_IN_RANGES[changeSize] ?? [1000, 1500];
  return base + Math.floor(Math.random() * range);
}

export function getTokensOut(changeSize: string): number {
  const [base, range] = TOKEN_OUT_RANGES[changeSize] ?? [400, 800];
  return base + Math.floor(Math.random() * range);
}

// ── Mock project files ────────────────────────────────────────

export const MOCK_PROJECT_FILES = [
  "src/main.tsx",
  "src/app/App.tsx",
  "src/app/shell/ShellLayout.tsx",
  "src/app/shell/ShellSidebar.tsx",
  "src/app/shell/ShellAgentPanel.tsx",
  "src/app/shell/shellAtoms.ts",
  "src/app/event-dispatch/index.ts",
  "src/app/menu/index.ts",
  "src/app/dev/devInjector.ts",
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
];
