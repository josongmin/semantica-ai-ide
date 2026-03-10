/**
 * Terminal SSOT Types — RFC-TERMINAL-013
 *
 * Single Source of Truth for all terminal domain schemas.
 * FE, Rust, and Agent layers must share these exact types.
 */

// ─── Terminal Mode ─────────────────────────────────────────
export type TerminalMode = "classic" | "hybrid" | "semantic";

// ─── Session ───────────────────────────────────────────────
export type SessionProvenance =
  | { source: "user" }
  | { source: "agent"; agentId: string; taskId?: string }
  | { source: "task"; taskId: string }
  | { source: "system" };

export type SessionStatus = "starting" | "running" | "exited" | "failed";

export type ShellType = "zsh" | "bash" | "pwsh" | "fish" | "unknown";

export type SessionPurpose = "lint" | "test" | "build" | "dev-server" | "run" | "custom";

export interface TerminalSessionMeta {
  readonly sessionId: string;
  readonly title: string;
  readonly shellType: ShellType;
  readonly pid: number;
  readonly cwd: string;
  readonly createdAt: number;
  readonly status: SessionStatus;
  readonly exitCode?: number;
  readonly provenance: SessionProvenance;
  readonly mode: TerminalMode;
  readonly markerSupport: boolean;
  readonly purpose?: SessionPurpose;
}

// ─── Command ───────────────────────────────────────────────
export type CommandProvenance =
  | { source: "user" }
  | { source: "agent"; agentId: string; requestId: string }
  | { source: "rerun"; originalCommandId: string };

export type CommandStatus = "running" | "succeeded" | "failed" | "cancelled" | "unknown";

export interface TerminalCommand {
  readonly commandId: string;
  readonly sessionId: string;
  readonly command: string;
  readonly cwd: string;
  readonly startedAt: number;
  readonly completedAt?: number;
  readonly exitCode?: number;
  readonly status: CommandStatus;
  readonly duration?: number;
  readonly provenance: CommandProvenance;
  readonly outputLineRange?: { start: number; end: number };
  readonly parsedEvents?: ParsedTerminalEvent[];
}

// ─── Parsed Events ─────────────────────────────────────────
export type ParsedEventKind =
  | "diagnostic"
  | "test-result"
  | "file-link"
  | "url"
  | "port-binding"
  | "progress"
  | "task-lifecycle"
  | "summary";

export interface DiagnosticEvent {
  readonly severity: "error" | "warning" | "info";
  readonly file: string;
  readonly line: number;
  readonly column?: number;
  readonly message: string;
  readonly source?: string;
}

export interface TestResultEvent {
  readonly testName: string;
  readonly status: "pass" | "fail" | "skip";
  readonly duration?: number;
  readonly message?: string;
}

export interface FileLinkEvent {
  readonly file: string;
  readonly line: number;
  readonly column?: number;
  readonly text: string;
}

export interface UrlEvent {
  readonly url: string;
  readonly text: string;
}

export interface PortBindingEvent {
  readonly port: number;
  readonly host: string;
  readonly protocol?: string;
}

export interface ProgressEvent {
  readonly current: number;
  readonly total?: number;
  readonly percentage?: number;
  readonly label?: string;
}

export interface TaskLifecycleEvent {
  readonly taskType: "dev-server" | "watch" | "build" | "test";
  readonly phase: "started" | "ready" | "stopped" | "crashed";
  readonly label?: string;
}

export interface SummaryEvent {
  readonly text: string;
  readonly counts?: {
    passed?: number;
    failed?: number;
    skipped?: number;
    total?: number;
  };
}

export type ParsedEventData =
  | DiagnosticEvent
  | TestResultEvent
  | FileLinkEvent
  | UrlEvent
  | PortBindingEvent
  | ProgressEvent
  | TaskLifecycleEvent
  | SummaryEvent;

export interface ParsedTerminalEvent {
  readonly eventId: string;
  readonly commandId: string;
  readonly sessionId: string;
  readonly kind: ParsedEventKind;
  readonly timestamp: number;
  readonly data: ParsedEventData;
}

// ─── Task State ────────────────────────────────────────────
export type TaskType = "dev-server" | "watch" | "build" | "test" | "install" | "unknown";
export type TaskPhase = "started" | "running" | "ready" | "stopped" | "crashed";

export interface TerminalTaskState {
  readonly sessionId: string;
  readonly commandId: string;
  readonly taskType: TaskType;
  readonly phase: TaskPhase;
  readonly progress?: { current: number; total?: number; percentage?: number };
  readonly label?: string;
}

// ─── Compatibility ─────────────────────────────────────────
export interface CompatibilityState {
  readonly sessionId: string;
  readonly altScreen: boolean;
  readonly mouseCapture: boolean;
  readonly fullscreenTui: boolean;
  readonly unknownControlBurst: boolean;
  readonly effectiveMode: TerminalMode;
  readonly overlayEnabled: boolean;
  readonly reason?: string;
}

// ─── Agent Bridge ──────────────────────────────────────────
export type AgentSessionMode = "reuse-current" | "reuse-by-id" | "dedicated" | "detached";
export type AgentPurpose =
  | "lint" | "test" | "build" | "run"
  | "dev-server" | "format" | "install" | "custom";
export type RevealPolicy = "on-failure" | "always" | "never";

export interface AgentTerminalExecRequest {
  readonly requestId: string;
  readonly agentId: string;
  readonly taskId?: string;
  readonly command: string;
  readonly cwd?: string;
  readonly env?: Record<string, string>;
  readonly sessionMode: AgentSessionMode;
  readonly purpose?: AgentPurpose;
  readonly title?: string;
  readonly trigger?: { agentRunId: string; toolCallId?: string; stepId?: string };
  readonly sessionId?: string;
  readonly revealPolicy: RevealPolicy;
  readonly approvalRequired?: boolean;
  readonly timeout?: number;
}

export type ExecutionStatus = "succeeded" | "failed" | "cancelled" | "timeout";

export type ExecutionState =
  | "pending"
  | "awaitingApproval"
  | "approved"
  | "executing"
  | "completed"
  | "failed"
  | "timedOut"
  | "cancelled";

export interface AgentTerminalExecResponse {
  readonly executionId: string;
  readonly sessionId: string;
  readonly commandId: string;
  readonly createdSession: boolean;
  readonly revealed: boolean;
  readonly focused: boolean;
  readonly approvalState: string;
}

export interface AgentTerminalExecutionResult {
  readonly requestId: string;
  readonly sessionId: string;
  readonly commandId: string;
  readonly status: ExecutionStatus;
  readonly exitCode?: number;
  readonly duration: number;
  readonly parsedErrors?: DiagnosticEvent[];
  readonly parsedTestResults?: TestResultEvent[];
  readonly parsedSummary?: SummaryEvent;
  readonly taskState?: TerminalTaskState;
  readonly outputPreview?: string;
  readonly outputLineCount: number;
}

// ─── Event Payloads ───────────────────────────────────────

export interface OverlayModeChangedPayload {
  readonly sessionId: string;
  readonly mode: string;
  readonly overlayEnabled: boolean;
  readonly reason?: string;
}

export interface ApprovalRequiredPayload {
  readonly requestId: string;
  readonly agentId: string;
  readonly command: string;
  readonly reason: string;
  readonly sessionId: string;
}

// ─── UI State ──────────────────────────────────────────────
export type SplitLayout = "single" | "horizontal" | "vertical";

export interface TerminalUIState {
  readonly bottomPanelOpen: boolean;
  readonly activeTab: string;
  readonly splitLayout: SplitLayout;
}
