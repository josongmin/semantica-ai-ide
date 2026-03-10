/**
 * Message & Turn Types
 */

import type { MessageId, TurnId } from "./brandedIds";

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

// ─── Message ───────────────────────────────────────────────
export interface DiffRef {
  readonly ref: string;
  readonly approx_bytes: number;
}

export type MessageStatus = "draft" | "streaming" | "final" | "error";

export interface UiMessage {
  readonly id: MessageId;
  readonly turn_id?: TurnId;
  readonly role: "user" | "assistant" | "system";
  readonly created_at_ms: number;
  readonly text: string;
  readonly status: MessageStatus;
  readonly error_detail?: string;
  readonly diff_ref?: DiffRef;
  readonly diff_loaded?: string;
  readonly classified_error?: ClassifiedError;
  readonly quoted_message_id?: MessageId;
  readonly quoted_text?: string;
  /** Multi-user: author identity when message is from another collaborator */
  readonly user_name?: string;
}

// ─── Turn ──────────────────────────────────────────────────
export type TurnPhase = "user_message" | "thinking" | "analysis" | "plan" | "changes" | "summary";

export type TurnStatus = "pending" | "running" | "success" | "error" | "paused";

export interface TurnPhaseEntry {
  readonly phase: TurnPhase;
  readonly message_ids: readonly MessageId[];
  readonly tool_call_ids: readonly string[];
  readonly summary: string;
  readonly collapsed: boolean;
  readonly status: TurnStatus;
  readonly duration_ms?: number;
}

// ─── Bookmark ────────────────────────────────────────────
export type BookmarkLabel = "decision" | "fix" | "risk" | "important";

export interface Turn {
  readonly id: TurnId;
  readonly phases: readonly TurnPhaseEntry[];
  readonly status: TurnStatus;
  readonly created_at_ms: number;
  readonly ttft_ms?: number;
  readonly latency_ms?: number;
  readonly token_usage?: {
    readonly input_tokens: number;
    readonly output_tokens: number;
    readonly cache_read_tokens?: number;
    readonly cache_write_tokens?: number;
  };
  readonly estimated_cost_usd?: number;
  readonly bookmarked?: boolean;
  readonly bookmark_label?: BookmarkLabel;
}
