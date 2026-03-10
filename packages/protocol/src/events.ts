import type {
  AgentRole,
  CheckpointId,
  EventId,
  ResumeMode,
  ResumeReason,
  RiskLevel,
  SessionId,
  StreamId,
  ToolCallId,
  TurnId,
} from "./types.js";

// ── Handshake ───────────────────────────────────────────────

export interface HelloPayload {
  readonly client: "desktop" | "dev" | "test";
  readonly client_version: string;
  readonly protocol_version: string;
  /** Resume point (session-scoped — only valid within the matching session_id) */
  readonly last_event_id?: EventId;
}

export interface HelloAckPayload {
  readonly server_version: string;
  readonly build_hash: string;
  readonly session_id: SessionId;
  readonly capabilities: readonly string[];
  readonly resume_mode: ResumeMode;
  readonly resume_reason?: ResumeReason;
}

// ── Session lifecycle (세션 객체 존재 여부) ───────────────────

export interface SessionInitPayload {
  readonly session_id: SessionId;
  readonly created_at: string;
}

export interface SessionResumePayload {
  readonly session_id: SessionId;
  readonly resume_mode: ResumeMode;
  readonly last_event_id?: EventId;
}

export interface SessionEndPayload {
  readonly session_id: SessionId;
  readonly reason: "user_close" | "timeout" | "error";
}

// ── User → Agent ────────────────────────────────────────────

export interface UserMessagePayload {
  readonly text: string;
  readonly turn_id: TurnId;
  readonly attachments?: readonly Attachment[];
  readonly retry?: boolean;
}

export interface Attachment {
  readonly kind: "file" | "image" | "url";
  readonly name: string;
  readonly content?: string;
  readonly uri?: string;
}

export interface UserCancelPayload {
  readonly turn_id: TurnId;
  readonly reason?: string;
}

export interface ApprovalDecisionPayload {
  readonly action_id: string;
  readonly approved: boolean;
  readonly sandbox?: boolean;
}

export interface ConfigUpdatePayload {
  readonly key: string;
  readonly value: unknown;
}

// ── Streaming ───────────────────────────────────────────────

export interface StreamOpenPayload {
  readonly turn_id: TurnId;
  readonly model: string;
  readonly agent_role?: AgentRole;
}

export interface StreamChunkPayload {
  readonly delta: string;
  readonly token_count?: number;
}

export interface StreamClosePayload {
  readonly usage?: {
    readonly input_tokens: number;
    readonly output_tokens: number;
  };
  readonly duration_ms: number;
}

// ── Tool Call (standard schema — error absorbed) ────────────

export interface ToolCallRequestPayload {
  readonly tool_call_id: ToolCallId;
  readonly tool_name: string;
  /** Args as JSON string — tool-specific schema validated in agentd registry */
  readonly args_json: string;
  readonly cwd: string;
  readonly timeout_ms: number;
  readonly approval: {
    readonly required: boolean;
    readonly reason?: string;
    readonly risk_level?: RiskLevel;
  };
}

export interface ToolCallResultPayload {
  readonly tool_call_id: ToolCallId;
  /** Error is represented here, not as a separate Kind */
  readonly status: "ok" | "error" | "cancelled" | "timeout";
  readonly message?: string;
  readonly stdout?: string;
  readonly stderr?: string;
  readonly exit_code?: number;
  readonly artifacts: readonly ToolArtifact[];
  readonly duration_ms: number;
}

export interface ToolArtifact {
  readonly kind: "file_created" | "file_modified" | "file_deleted" | "snapshot";
  readonly path: string;
  readonly digest?: string; // SHA-256
}

// ── Approval ────────────────────────────────────────────────

export interface ApprovalRequestPayload {
  readonly action_id: string;
  readonly tool_call_id: ToolCallId;
  readonly description: string;
  readonly risk_level: RiskLevel;
}

export interface ApprovalTimeoutPayload {
  readonly action_id: string;
  readonly tool_call_id: ToolCallId;
  readonly timeout_ms: number;
}

// ── State sync ──────────────────────────────────────────────

export interface StateSnapshotPayload {
  /** Full serialized state — opaque to protocol layer */
  readonly state: unknown;
}

export interface StatePatchPayload {
  /** Incremental delta — opaque to protocol layer */
  readonly delta: unknown;
}

export interface CheckpointSavedPayload {
  readonly checkpoint_id: CheckpointId;
  readonly files_changed: readonly string[];
}

// ── Agent status ────────────────────────────────────────────

export interface AgentStatusUpdatePayload {
  readonly agent_id: string;
  readonly role: AgentRole;
  readonly status: "idle" | "working" | "blocked" | "done";
  readonly current_task?: string;
}

// ── Multi-agent ─────────────────────────────────────────────

export interface AgentSpawnPayload {
  readonly agent_id: string;
  readonly role: AgentRole;
  readonly parent_agent_id?: string;
  readonly task: string;
}

export interface AgentHandoffPayload {
  readonly from_agent_id: string;
  readonly to_agent_id: string;
  readonly context: string;
  readonly stream_id?: StreamId;
}

export interface DebateRoundPayload {
  readonly round: number;
  readonly agent_id: string;
  readonly role: AgentRole;
  readonly position: string;
  readonly confidence: number;
}

// ── System ──────────────────────────────────────────────────

export interface HeartbeatPayload {
  readonly ts?: number;
}

export interface ErrorPayload {
  readonly code: string;
  readonly message: string;
  readonly recoverable: boolean;
}
