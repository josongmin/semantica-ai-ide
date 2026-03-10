import type {
  CorrelationId,
  EventId,
  SessionId,
  StreamId,
} from "./types.js";

// ── Envelope Kind ───────────────────────────────────────────
export type EnvelopeKind =
  // Handshake
  | "HELLO"
  | "HELLO_ACK"
  // Session lifecycle (세션 객체 존재 여부)
  | "SESSION_INIT"
  | "SESSION_RESUME"
  | "SESSION_END"
  // User → Agent
  | "USER_MESSAGE"
  | "USER_CANCEL"
  | "APPROVAL_DECISION"
  | "CONFIG_UPDATE"
  // Agent → UI (streaming)
  | "STREAM_OPEN"
  | "STREAM_CHUNK"
  | "STREAM_CLOSE"
  // Tool execution (error absorbed into RESULT)
  | "TOOL_CALL_REQUEST"
  | "TOOL_CALL_RESULT"
  // Approval flow
  | "APPROVAL_REQUEST"
  | "APPROVAL_TIMEOUT"
  // State sync (뷰 모델 데이터)
  | "STATE_SNAPSHOT"
  | "STATE_PATCH"
  | "CHECKPOINT_SAVED"
  | "AGENT_STATUS_UPDATE"
  // Multi-agent
  | "AGENT_SPAWN"
  | "AGENT_HANDOFF"
  | "DEBATE_ROUND"
  // System
  | "HEARTBEAT"
  | "ERROR";

// ── Protocol Envelope ───────────────────────────────────────
export interface ProtocolEnvelope<T = unknown> {
  /** Protocol version (semver) */
  readonly version: "1.0.0";

  /** Session identifier */
  readonly session_id: SessionId;

  /** Request-response correlation */
  readonly correlation_id: CorrelationId;

  /** Unique event ID (dedup + replay) */
  readonly event_id: EventId;

  /** Monotonic timestamp (ms) */
  readonly ts_ms: number;

  /** Event kind */
  readonly kind: EnvelopeKind;

  /** Stream identifier (separates turn/agent/tool streams) */
  readonly stream_id?: StreamId;

  /** Monotonically increasing seq within stream_id (ordering + gap detection) */
  readonly seq?: number;

  /** Kind-specific payload */
  readonly payload: T;
}

/** Protocol version constant */
export const PROTOCOL_VERSION = "1.0.0" as const;
