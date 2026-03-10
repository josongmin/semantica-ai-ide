/**
 * Tool Call Protocol Types
 *
 * ToolCall, ToolResult, Diff/FileChange, and related types.
 */

import type { ApprovalStatus, ConflictRisk, RiskLevel } from "./core";

// ─── Tool Call ─────────────────────────────────────────────
export type ToolCallStatus = "pending" | "running" | "success" | "error" | "awaiting_approval";

export type ToolCategory =
  | "read"
  | "search"
  | "write"
  | "delete"
  | "terminal"
  | "git"
  | "analysis"
  | "other";

export interface ToolCallOutput {
  readonly stdout?: string;
  readonly stderr?: string;
  readonly exit_code?: number;
  readonly structured?: Readonly<Record<string, unknown>>;
}

export interface ToolCall {
  readonly id: string;
  readonly turn_id: string;
  readonly tool_name: string;
  readonly category: ToolCategory;
  readonly args_summary: string;
  readonly status: ToolCallStatus;
  readonly result_summary?: string;
  readonly duration_ms?: number;
  readonly output?: ToolCallOutput;
  readonly approval_action_id?: string;
  readonly risk_level?: RiskLevel;
  readonly reasoning?: string;
  readonly supports_sandbox?: boolean;
  /** Unified diff text for write/edit tool calls */
  readonly diff_text?: string;
}

export interface ToolCallGroup {
  readonly category: ToolCategory;
  readonly calls: readonly ToolCall[];
  readonly count: number;
}

// ─── Diff / File Change ────────────────────────────────────
export type FileChangeStatus = "added" | "modified" | "deleted" | "renamed";

export interface FileChange {
  readonly file_path: string;
  readonly turn_id: string;
  readonly status: FileChangeStatus;
  readonly insertions: number;
  readonly deletions: number;
  readonly diff_text?: string;
  readonly approval_status: ApprovalStatus;
  readonly conflict_risk?: ConflictRisk;
  readonly conflict_details?: string;
  /** One-line intent explaining why this file changed */
  readonly intent?: string;
}

export interface FileChangeSummary {
  readonly added: number;
  readonly modified: number;
  readonly deleted: number;
  readonly renamed: number;
  readonly total_insertions: number;
  readonly total_deletions: number;
  readonly files: readonly FileChange[];
}

// ─── Diff Result (Web Worker) ─────────────────────────────
export type DiffLineKind = "add" | "remove" | "context";

export interface DiffResultLine {
  readonly kind: DiffLineKind;
  readonly content: string;
  readonly oldLineNumber: number | null;
  readonly newLineNumber: number | null;
}

export interface DiffResult {
  readonly lines: readonly DiffResultLine[];
  readonly additions: number;
  readonly deletions: number;
  readonly unchanged: number;
}

// ─── Diff Hunk ──────────────────────────────────────────
export interface DiffHunk {
  readonly startLine: number;
  readonly endLine: number;
  readonly content: string;
  readonly type: "add" | "remove" | "context";
}
