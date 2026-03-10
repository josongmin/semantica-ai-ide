// ── Brand type utility ──────────────────────────────────────
declare const __brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [__brand]: B };

// ── Core IDs ────────────────────────────────────────────────
export type SessionId = Brand<string, "SessionId">;
export type CorrelationId = Brand<string, "CorrelationId">;
export type EventId = Brand<string, "EventId">;
export type StreamId = Brand<string, "StreamId">;
export type TurnId = Brand<string, "TurnId">;
export type ToolCallId = Brand<string, "ToolCallId">;
export type MessageId = Brand<string, "MessageId">;
export type CheckpointId = Brand<string, "CheckpointId">;

// ── Unsubscribe handle ──────────────────────────────────────
export type Unsubscribe = () => void;

// ── Agent system ────────────────────────────────────────────
export type AgentRole =
  | "orchestrator"
  | "planner"
  | "coder"
  | "reviewer"
  | "debugger"
  | "tester"
  | "researcher"
  | "critic";

// ── Approval ────────────────────────────────────────────────
export type RiskLevel = "low" | "medium" | "high" | "critical";

// ── Resume ──────────────────────────────────────────────────
export type ResumeMode = "snapshot" | "patch" | "fresh";
export type ResumeReason =
  | "ok"
  | "gap_too_large"
  | "unknown_last_event"
  | "session_expired";
