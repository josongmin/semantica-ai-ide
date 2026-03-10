/**
 * Core Protocol Types
 *
 * Branded identifiers, error taxonomy, and utility types
 * shared across all domain files.
 */

// ─── Branded Identifiers ──────────────────────────────────
// Branded types prevent accidental mixing of ID types at compile time.
// eslint-disable-next-line @typescript-eslint/naming-convention -- __brand is a well-known branded-type pattern
declare const __brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type MessageId = Brand<string, "MessageId">;
export type TurnId = Brand<string, "TurnId">;
export type SessionId = Brand<string, "SessionId">;
export type AgentInstanceId = Brand<string, "AgentInstanceId">;
export type McpServerId = Brand<string, "McpServerId">;
export type McpToolCallId = Brand<string, "McpToolCallId">;
export type MemoryRuleId = Brand<string, "MemoryRuleId">;
export type ArenaResponseId = Brand<string, "ArenaResponseId">;
export type GitCommitId = Brand<string, "GitCommitId">;
export type ReviewCommentId = Brand<string, "ReviewCommentId">;
export type RemoteCommandId = Brand<string, "RemoteCommandId">;
export type ProjectTodoId = Brand<string, "ProjectTodoId">;

// ─── AI Native Coding OS Identifiers ─────────────────────
export type BackgroundAgentId = Brand<string, "BackgroundAgentId">;
export type TransactionId = Brand<string, "TransactionId">;
export type IntentId = Brand<string, "IntentId">;
export type CodeLensActionId = Brand<string, "CodeLensActionId">;
export type TerminalSessionId = Brand<string, "TerminalSessionId">;
export type PluginId = Brand<string, "PluginId">;
export type TeamMemberId = Brand<string, "TeamMemberId">;
export type KnowledgeEntryId = Brand<string, "KnowledgeEntryId">;
export type WorkspaceGraphNodeId = Brand<string, "WorkspaceGraphNodeId">;

// ─── Branded ID Factories ────────────────────────────────
// Centralised casts so callers never need `as unknown as XxxId`.

export function createMessageId(raw: string): MessageId {
  return raw as MessageId;
}
export function createTurnId(raw: string): TurnId {
  return raw as TurnId;
}
export function createSessionId(raw: string): SessionId {
  return raw as SessionId;
}
export function createAgentInstanceId(raw: string): AgentInstanceId {
  return raw as AgentInstanceId;
}
export function createMcpServerId(raw: string): McpServerId {
  return raw as McpServerId;
}
export function createMcpToolCallId(raw: string): McpToolCallId {
  return raw as McpToolCallId;
}
export function createMemoryRuleId(raw: string): MemoryRuleId {
  return raw as MemoryRuleId;
}
export function createArenaResponseId(raw: string): ArenaResponseId {
  return raw as ArenaResponseId;
}
export function createGitCommitId(raw: string): GitCommitId {
  return raw as GitCommitId;
}
export function createReviewCommentId(raw: string): ReviewCommentId {
  return raw as ReviewCommentId;
}
export function createRemoteCommandId(raw: string): RemoteCommandId {
  return raw as RemoteCommandId;
}
export function createProjectTodoId(raw: string): ProjectTodoId {
  return raw as ProjectTodoId;
}
export function createBackgroundAgentId(raw: string): BackgroundAgentId {
  return raw as BackgroundAgentId;
}
export function createTransactionId(raw: string): TransactionId {
  return raw as TransactionId;
}
export function createIntentId(raw: string): IntentId {
  return raw as IntentId;
}
export function createCodeLensActionId(raw: string): CodeLensActionId {
  return raw as CodeLensActionId;
}
export function createTerminalSessionId(raw: string): TerminalSessionId {
  return raw as TerminalSessionId;
}
export function createPluginId(raw: string): PluginId {
  return raw as PluginId;
}
export function createTeamMemberId(raw: string): TeamMemberId {
  return raw as TeamMemberId;
}
export function createKnowledgeEntryId(raw: string): KnowledgeEntryId {
  return raw as KnowledgeEntryId;
}
export function createWorkspaceGraphNodeId(raw: string): WorkspaceGraphNodeId {
  return raw as WorkspaceGraphNodeId;
}

// ─── Error Taxonomy ───────────────────────────────────────
export type ErrorCategory =
  | "network"
  | "model"
  | "tool"
  | "permission"
  | "rate_limit"
  | "context_overflow"
  | "unknown";

export interface ClassifiedError {
  readonly category: ErrorCategory;
  readonly code?: string;
  readonly message: string;
  readonly retry_strategy?:
    | "auto_retry"
    | "retry_with_backoff"
    | "retry_after_fix"
    | "non_retryable";
  readonly retry_after_ms?: number;
  readonly details?: string;
}

// ─── Common Enums ─────────────────────────────────────────
export type RiskLevel = "safe" | "moderate" | "dangerous";
export type ApprovalStatus = "pending" | "accepted" | "rejected";
export type ConflictRisk = "none" | "low" | "medium" | "high";
export type RestoreMode = "chat" | "code" | "both";
export type PrivacyMode = "local" | "shared" | "stored";
export type ExportFormat = "html" | "pdf" | "markdown";
export type ExportProgress = "idle" | "exporting" | "done" | "error";

// ─── Utility Types ────────────────────────────────────────
export type PatchIR = Readonly<Record<string, unknown>>;
