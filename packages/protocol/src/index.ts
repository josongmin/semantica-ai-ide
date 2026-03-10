// Types
export type {
  AgentRole as ProtocolAgentRole,
  CheckpointId,
  CorrelationId,
  EventId,
  MessageId,
  ResumeMode,
  ResumeReason,
  RiskLevel,
  SessionId as ProtocolSessionId,
  StreamId,
  ToolCallId,
  TurnId,
  Unsubscribe,
} from "./types.js";

// Envelope
export type { EnvelopeKind, ProtocolEnvelope } from "./envelope.js";
export { PROTOCOL_VERSION } from "./envelope.js";

// Events (payload types)
export type {
  AgentHandoffPayload,
  AgentSpawnPayload,
  AgentStatusUpdatePayload,
  ApprovalDecisionPayload,
  ApprovalRequestPayload,
  ApprovalTimeoutPayload,
  Attachment,
  CheckpointSavedPayload,
  ConfigUpdatePayload,
  DebateRoundPayload,
  ErrorPayload,
  HeartbeatPayload,
  HelloAckPayload,
  HelloPayload,
  SessionEndPayload,
  SessionInitPayload,
  SessionResumePayload,
  StatePatchPayload,
  StateSnapshotPayload,
  StreamChunkPayload,
  StreamClosePayload,
  StreamOpenPayload,
  ToolArtifact,
  ToolCallRequestPayload,
  ToolCallResultPayload,
  UserCancelPayload,
  UserMessagePayload,
  ConfigUpdatePayload as ConfigUpdatePayload_alias,
} from "./events.js";

// Adapter
export type {
  Capability,
  FsEvent,
  NotificationOpts,
  PlatformAdapter,
  PlatformComm,
  PlatformFs,
  PlatformNative,
  PlatformWindow,
  SystemInfo,
} from "./adapter.js";
export { getAdapterFs, getAdapterNative, getAdapterWindow } from "./adapter.js";

// Codec
export type { EnvelopeCodec } from "./codec.js";
export { jsonCodec } from "./codec.js";

// Deduper
export type { ReplayDeduper } from "./deduper.js";
export { createDeduper } from "./deduper.js";

// Sequencer
export type { StreamSequencer } from "./sequencer.js";
export { createSequencer } from "./sequencer.js";

// Validation (Zod schemas)
export {
  EnvelopeKindSchema,
  HelloAckPayloadSchema,
  HelloPayloadSchema,
  ProtocolEnvelopeSchema,
  ToolArtifactSchema,
  ToolCallRequestSchema,
  ToolCallResultSchema,
} from "./validation.js";

// DevOS Canonical Models (RFC-008, RFC-010, RFC-013)
export * from "./models/index.js";

// ViewModel Contracts
export * from "./viewmodels/index.js";

// Zod Schemas for Models & ViewModels
export * as zodModels from "./zod/models.js";
export * as zodViewModels from "./zod/viewmodels.js";

// Commands
export type { DevOSCommand, SurfaceName } from "./commands.js";
