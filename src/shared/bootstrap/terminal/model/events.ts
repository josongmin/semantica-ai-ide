/**
 * Terminal Event Types — RFC-TERMINAL-013 §4
 *
 * Event names and payload types for Tauri event bus.
 * All events use `terminal://` prefix with kebab-case.
 */

import type {
  AgentTerminalExecRequest,
  AgentTerminalExecutionResult,
  CompatibilityState,
  ParsedTerminalEvent,
  TerminalCommand,
  TerminalMode,
  TerminalSessionMeta,
  TerminalTaskState,
} from "./types";

// ─── Event Names ───────────────────────────────────────────

export const TERMINAL_EVENTS = {
  // Session events
  SESSION_CREATED: "terminal://session-created",
  SESSION_EXITED: "terminal://session-exited",
  SESSION_MODE_CHANGED: "terminal://session-mode-changed",
  SESSION_CWD_CHANGED: "terminal://session-cwd-changed",

  // Command events
  COMMAND_STARTED: "terminal://command-started",
  COMMAND_COMPLETED: "terminal://command-completed",
  COMMAND_CANCELLED: "terminal://command-cancelled",

  // Output / Parsing events
  OUTPUT: "terminal://output",
  PARSED_EVENT: "terminal://parsed-event",
  TASK_STATE_CHANGED: "terminal://task-state-changed",

  // Compatibility / Fallback events
  COMPATIBILITY_STATE: "terminal://compatibility-state",
  OVERLAY_MODE_CHANGED: "terminal://overlay-mode-changed",
  FALLBACK_TRIGGERED: "terminal://fallback-triggered",

  // Agent bridge events
  AGENT_EXEC_STARTED: "terminal://agent-exec-started",
  AGENT_EXEC_COMPLETED: "terminal://agent-exec-completed",
  AGENT_APPROVAL_REQUIRED: "terminal://agent-approval-required",
} as const;

export type TerminalEventName = (typeof TERMINAL_EVENTS)[keyof typeof TERMINAL_EVENTS];

// ─── Event Payloads ────────────────────────────────────────

export interface TerminalOutputPayload {
  readonly sessionId: string;
  readonly data: string;
}

export interface SessionModeChangedPayload {
  readonly sessionId: string;
  readonly mode: TerminalMode;
  readonly reason?: string;
}

export interface SessionCwdChangedPayload {
  readonly sessionId: string;
  readonly cwd: string;
}

export interface FallbackTriggeredPayload {
  readonly sessionId: string;
  readonly reason: string;
  readonly previousMode: TerminalMode;
  readonly newMode: TerminalMode;
}

export interface AgentApprovalRequiredPayload {
  readonly requestId: string;
  readonly request: AgentTerminalExecRequest;
}

// ─── Event Map (event name → payload type) ─────────────────

export interface TerminalEventMap {
  [TERMINAL_EVENTS.SESSION_CREATED]: TerminalSessionMeta;
  [TERMINAL_EVENTS.SESSION_EXITED]: { sessionId: string; status: string; exitCode?: number };
  [TERMINAL_EVENTS.SESSION_MODE_CHANGED]: SessionModeChangedPayload;
  [TERMINAL_EVENTS.SESSION_CWD_CHANGED]: SessionCwdChangedPayload;
  [TERMINAL_EVENTS.COMMAND_STARTED]: TerminalCommand;
  [TERMINAL_EVENTS.COMMAND_COMPLETED]: TerminalCommand;
  [TERMINAL_EVENTS.COMMAND_CANCELLED]: TerminalCommand;
  [TERMINAL_EVENTS.OUTPUT]: TerminalOutputPayload;
  [TERMINAL_EVENTS.PARSED_EVENT]: ParsedTerminalEvent;
  [TERMINAL_EVENTS.TASK_STATE_CHANGED]: TerminalTaskState;
  [TERMINAL_EVENTS.COMPATIBILITY_STATE]: CompatibilityState;
  [TERMINAL_EVENTS.OVERLAY_MODE_CHANGED]: { sessionId: string; overlayEnabled: boolean };
  [TERMINAL_EVENTS.FALLBACK_TRIGGERED]: FallbackTriggeredPayload;
  [TERMINAL_EVENTS.AGENT_EXEC_STARTED]: AgentTerminalExecRequest;
  [TERMINAL_EVENTS.AGENT_EXEC_COMPLETED]: AgentTerminalExecutionResult;
  [TERMINAL_EVENTS.AGENT_APPROVAL_REQUIRED]: AgentApprovalRequiredPayload;
}
