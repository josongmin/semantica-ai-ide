import { z } from "zod";

// ── Brand ID schemas ────────────────────────────────────────

const brandedString = z.string().min(1);

export const SessionIdSchema = brandedString;
export const CorrelationIdSchema = brandedString;
export const EventIdSchema = brandedString;
export const StreamIdSchema = brandedString;
export const TurnIdSchema = brandedString;
export const ToolCallIdSchema = brandedString;

// ── EnvelopeKind ────────────────────────────────────────────

export const EnvelopeKindSchema = z.enum([
  "HELLO",
  "HELLO_ACK",
  "SESSION_INIT",
  "SESSION_RESUME",
  "SESSION_END",
  "USER_MESSAGE",
  "USER_CANCEL",
  "APPROVAL_DECISION",
  "CONFIG_UPDATE",
  "STREAM_OPEN",
  "STREAM_CHUNK",
  "STREAM_CLOSE",
  "TOOL_CALL_REQUEST",
  "TOOL_CALL_RESULT",
  "APPROVAL_REQUEST",
  "APPROVAL_TIMEOUT",
  "STATE_SNAPSHOT",
  "STATE_PATCH",
  "CHECKPOINT_SAVED",
  "AGENT_STATUS_UPDATE",
  "AGENT_SPAWN",
  "AGENT_HANDOFF",
  "DEBATE_ROUND",
  "HEARTBEAT",
  "ERROR",
]);

// ── ProtocolEnvelope schema ─────────────────────────────────

export const ProtocolEnvelopeSchema = z.object({
  version: z.literal("1.0.0"),
  session_id: SessionIdSchema,
  correlation_id: CorrelationIdSchema,
  event_id: EventIdSchema,
  ts_ms: z.number().int().nonnegative(),
  kind: EnvelopeKindSchema,
  stream_id: StreamIdSchema.optional(),
  seq: z.number().int().nonnegative().optional(),
  payload: z.unknown(),
});

// ── ToolCall schemas ────────────────────────────────────────

export const ToolCallRequestSchema = z.object({
  tool_call_id: ToolCallIdSchema,
  tool_name: z.string().min(1),
  args_json: z.string(),
  cwd: z.string(),
  timeout_ms: z.number().int().nonnegative(),
  approval: z.object({
    required: z.boolean(),
    reason: z.string().optional(),
    risk_level: z.enum(["low", "medium", "high", "critical"]).optional(),
  }),
});

export const ToolArtifactSchema = z.object({
  kind: z.enum(["file_created", "file_modified", "file_deleted", "snapshot"]),
  path: z.string(),
  digest: z.string().optional(),
});

export const ToolCallResultSchema = z.object({
  tool_call_id: ToolCallIdSchema,
  status: z.enum(["ok", "error", "cancelled", "timeout"]),
  message: z.string().optional(),
  stdout: z.string().optional(),
  stderr: z.string().optional(),
  exit_code: z.number().int().optional(),
  artifacts: z.array(ToolArtifactSchema),
  duration_ms: z.number().nonnegative(),
});

// ── Hello schemas ───────────────────────────────────────────

export const HelloPayloadSchema = z.object({
  client: z.enum(["desktop", "dev", "test"]),
  client_version: z.string(),
  protocol_version: z.string(),
  last_event_id: EventIdSchema.optional(),
});

export const HelloAckPayloadSchema = z.object({
  server_version: z.string(),
  build_hash: z.string(),
  session_id: SessionIdSchema,
  capabilities: z.array(z.string()),
  resume_mode: z.enum(["snapshot", "patch", "fresh"]),
  resume_reason: z
    .enum(["ok", "gap_too_large", "unknown_last_event", "session_expired"])
    .optional(),
});
