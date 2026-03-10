/**
 * Message Protocol Types
 *
 * UiMessage, DiffRef, MessageStatus, and related types.
 */

import type { ClassifiedError, MessageId, TurnId } from "./core";

// ─── Message ───────────────────────────────────────────────
export interface DiffRef {
  readonly ref: string;
  readonly approx_bytes: number;
}

export type MessageStatus = "draft" | "streaming" | "final" | "error";

// ─── UiMessage Sub-interfaces (ISP) ────────────────────
export interface UiMessageIdentity {
  readonly id: MessageId;
  readonly role: "user" | "assistant" | "system";
}

export interface UiMessageContent {
  readonly created_at_ms: number;
  readonly text: string;
  readonly status: MessageStatus;
}

export interface UiMessageError {
  readonly error_detail: string;
  readonly classified_error: ClassifiedError;
}

export interface UiMessageQuote {
  readonly quoted_message_id: MessageId;
  readonly quoted_text: string;
}

export interface UiMessageAgent {
  /** Multi-agent identity — which agent produced this message */
  readonly agent_id: string;
  readonly agent_name: string;
  readonly agent_role: AgentRole;
}

export interface UiMessageDiff {
  readonly diff_ref: DiffRef;
  readonly diff_loaded: string;
}

export type UiMessage = UiMessageIdentity &
  UiMessageContent & {
    readonly turn_id?: TurnId;
    /** Multi-user: author identity when message is from another collaborator */
    readonly user_name?: string;
  } & Partial<UiMessageError & UiMessageQuote & UiMessageAgent & UiMessageDiff>;

// ─── Agent Role ──────────────────────────────────────────
export type AgentRole =
  | "orchestrator"
  | "planner"
  | "coder"
  | "reviewer"
  | "debugger"
  | "tester"
  | "researcher"
  | "educator"
  | "critic"
  | "requirements"
  | "security"
  | "architect";

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

// ─── Agent Message (P2P) ────────────────────────────────────
export type AgentMessageType = "request" | "response" | "broadcast";

export interface AgentMessage {
  readonly id: string;
  readonly from_agent: string;
  readonly to_agent: string;
  readonly content: string;
  readonly timestamp_ms: number;
  readonly message_type: AgentMessageType;
}
