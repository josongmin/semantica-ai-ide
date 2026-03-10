/**
 * Menu bar type system — pure data, no side effects.
 *
 * Tauri v2 JS Menu API 기반이지만, 타입 자체는 플랫폼 무관.
 * Bridge 레이어가 이 타입을 네이티브 메뉴로 변환한다.
 */

// ── Action IDs ──────────────────────────────────────────

export const ACTION_IDS = {
  // Semantica (app)
  APP_PREFERENCES: "app.preferences",
  APP_AGENT_RULES: "app.agent-rules",
  APP_MCP_SERVERS: "app.mcp-servers",

  // Session
  SESSION_NEW: "session.new",
  SESSION_NEW_FROM_TEMPLATE: "session.new-from-template",
  SESSION_OPEN_PROJECT: "session.open-project",
  SESSION_SWITCH_PROJECT: "session.switch-project",
  SESSION_EXPORT: "session.export",
  SESSION_SHARE: "session.share",
  SESSION_CLOSE: "session.close",
  SESSION_CLOSE_ALL: "session.close-all",

  // Edit
  EDIT_UNDO: "edit.undo",
  EDIT_REDO: "edit.redo",
  EDIT_CUT: "edit.cut",
  EDIT_COPY: "edit.copy",
  EDIT_PASTE: "edit.paste",
  EDIT_SELECT_ALL: "edit.select-all",
  EDIT_COPY_LAST_RESPONSE: "edit.copy-last-response",
  EDIT_COPY_AS_MARKDOWN: "edit.copy-as-markdown",
  EDIT_FIND: "edit.find",

  // View
  VIEW_ZOOM_IN: "view.zoom-in",
  VIEW_ZOOM_OUT: "view.zoom-out",
  VIEW_ZOOM_RESET: "view.zoom-reset",
  VIEW_PAGE_SESSIONS: "view.page.sessions",
  VIEW_PAGE_ARENA: "view.page.arena",
  VIEW_PAGE_REVIEW: "view.page.review",
  VIEW_PAGE_TODOS: "view.page.todos",
  VIEW_PAGE_SETTINGS: "view.page.settings",
  VIEW_TOGGLE_SIDEBAR: "view.toggle-sidebar",
  VIEW_TOGGLE_FEATURE_BAR: "view.toggle-feature-bar",
  VIEW_WORKSPACE_GRAPH: "view.workspace-graph",
  VIEW_FILE_CHANGES: "view.file-changes",
  VIEW_SYMBOL_PANEL: "view.symbol-panel",
  VIEW_FOCUS_MODE: "view.focus-mode",

  // Agent
  AGENT_STOP: "agent.stop",
  AGENT_RETRY: "agent.retry",
  AGENT_APPROVAL_AUTO: "agent.approval.auto",
  AGENT_APPROVAL_SUGGEST: "agent.approval.suggest",
  AGENT_APPROVAL_MANUAL: "agent.approval.manual",
  AGENT_MODE_CODE: "agent.mode.code",
  AGENT_MODE_ARCHITECT: "agent.mode.architect",
  AGENT_MODE_PLAN: "agent.mode.plan",
  AGENT_MODEL_OPUS: "agent.model.opus",
  AGENT_MODEL_SONNET: "agent.model.sonnet",
  AGENT_MODEL_HAIKU: "agent.model.haiku",
  AGENT_CHECKPOINT_LIST: "agent.checkpoint.list",
  AGENT_CHECKPOINT_RESTORE: "agent.checkpoint.restore",
  AGENT_CHECKPOINT_COMPARE: "agent.checkpoint.compare",
  AGENT_BG_AGENTS: "agent.bg-agents",
  AGENT_SCRATCHPAD: "agent.scratchpad",

  // Navigate
  NAV_GO_TO_TURN: "nav.go-to-turn",
  NAV_PREV_TURN: "nav.prev-turn",
  NAV_NEXT_TURN: "nav.next-turn",
  NAV_GO_TO_FILE_CHANGE: "nav.go-to-file-change",
  NAV_GO_TO_BOOKMARK: "nav.go-to-bookmark",
  NAV_QUICK_FILE_OPEN: "nav.quick-file-open",
  NAV_SEARCH_SYMBOLS: "nav.search-symbols",
  NAV_BACK: "nav.back",
  NAV_FORWARD: "nav.forward",

  // Help
  HELP_DOCS: "help.docs",
  HELP_WHATS_NEW: "help.whats-new",
  HELP_KEYBOARD_SHORTCUTS: "help.keyboard-shortcuts",
  HELP_TROUBLESHOOTING: "help.troubleshooting",
  HELP_REPORT_ISSUE: "help.report-issue",
  HELP_AGENTD_STATUS: "help.agentd-status",
} as const;

export type ActionId = (typeof ACTION_IDS)[keyof typeof ACTION_IDS];

// ── Menu Item Definitions ───────────────────────────────

export type MenuItemDef =
  | ActionItem
  | CheckItem
  | RadioItem
  | SubmenuItem
  | SeparatorItem
  | StatusItem;

export interface ActionItem {
  readonly kind: "action";
  readonly id: ActionId;
  readonly label: string;
  readonly shortcut?: string;
  readonly enabled?: boolean;
}

export interface CheckItem {
  readonly kind: "check";
  readonly id: ActionId;
  readonly label: string;
  readonly checked: boolean;
}

export interface RadioItem {
  readonly kind: "radio";
  readonly id: ActionId;
  readonly label: string;
  readonly group: string;
  readonly selected: boolean;
}

export interface SubmenuItem {
  readonly kind: "submenu";
  readonly id: string;
  readonly label: string;
  readonly items: readonly MenuItemDef[];
}

export interface SeparatorItem {
  readonly kind: "separator";
}

/** 정보 표시용 (disabled, 클릭 불가) */
export interface StatusItem {
  readonly kind: "status";
  readonly id: string;
  readonly label: string;
}

// ── Menu Group / Bar ────────────────────────────────────

export interface MenuGroupDef {
  readonly id: string;
  readonly label: string;
  readonly items: readonly MenuItemDef[];
}

export interface MenuBarDef {
  readonly menus: readonly MenuGroupDef[];
}

// ── App State Snapshot (메뉴 빌드 시 참조) ──────────────

export type AgentStatus =
  | "idle"
  | "thinking"
  | "tool_running"
  | "awaiting_approval"
  | "error";

import type { ApprovalMode } from "../../shared/protocol";
export type { ApprovalMode };

export interface MenuState {
  readonly agentStatus: AgentStatus;
  readonly approvalMode: ApprovalMode;
  readonly requestMode: string;
  readonly currentModel: string;
  readonly currentPage: string;
  readonly hasActiveSession: boolean;
  readonly sidebarVisible: boolean;
  readonly featureBarVisible: boolean;
  readonly focusMode: boolean;
}
