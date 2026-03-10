/**
 * Tool Call Types
 */

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

export type RiskLevel = "safe" | "moderate" | "dangerous";

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
}

export interface ToolCallGroup {
  readonly category: ToolCategory;
  readonly calls: readonly ToolCall[];
  readonly count: number;
}
