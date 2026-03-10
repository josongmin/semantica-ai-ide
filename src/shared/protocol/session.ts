/**
 * Session Types
 */

import type { SessionId, TurnId } from "./brandedIds";

// ─── Session ───────────────────────────────────────────────
export type ApprovalMode = "auto" | "turbo";

export type AgentRequestMode = "code_analysis" | "debug" | "plan" | "agent" | "ask";

export type SessionStatus = "idle" | "running" | "paused" | "error" | "completed";

export type ContextPressureLevel = "normal" | "elevated" | "critical";

// ─── Model ────────────────────────────────────────────────
export interface ModelInfo {
  readonly id: string;
  readonly label: string;
  readonly provider?: string;
  readonly supports_thinking?: boolean;
}

// ─── Attachment ───────────────────────────────────────────
export type AttachmentType = "file" | "image" | "url";

export interface Attachment {
  readonly type: AttachmentType;
  readonly name: string;
  readonly path: string;
  readonly size_bytes?: number;
  /** Base64 data URL for inline image preview (image type only) */
  readonly data_url?: string;
}

export interface SessionStats {
  readonly turns_count: number;
  readonly files_modified: number;
  readonly files_created: number;
  readonly files_deleted: number;
  readonly tool_calls_count: number;
  readonly errors_count: number;
}

export interface SessionMeta {
  readonly session_id: SessionId;
  readonly model_id: string;
  readonly model_label: string;
  readonly approval_mode: ApprovalMode;
  readonly status: SessionStatus;
  readonly cost_usd?: number;
  readonly tokens_in?: number;
  readonly tokens_out?: number;
  readonly max_context_tokens?: number;
  readonly thinking_enabled?: boolean;
  readonly fast_mode?: boolean;
  readonly summary?: string;
  readonly stats?: SessionStats;
  readonly forked_from?: {
    readonly session_id: SessionId;
    readonly turn_id: TurnId;
  };
  readonly scope_includes?: readonly string[];
  readonly scope_excludes?: readonly string[];
}

export interface SessionListEntry {
  readonly session_id: SessionId;
  readonly title: string;
  readonly model_label: string;
  readonly status: SessionStatus;
  readonly created_at_ms: number;
  readonly cost_usd?: number;
  readonly turn_count: number;
  readonly last_message_preview: string;
}

export interface Checkpoint {
  readonly id: string;
  readonly turn_id: string;
  readonly label: string;
  readonly timestamp_ms: number;
}
