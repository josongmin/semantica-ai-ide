/**
 * Timeline Event Types
 */

// ─── Timeline Event ────────────────────────────────────────
export type TimelineEventType =
  | "tool_call_start"
  | "tool_call_end"
  | "error_raised"
  | "error_recovered"
  | "file_created"
  | "file_modified"
  | "file_deleted"
  | "checkpoint_created"
  | "approval_requested"
  | "approval_granted"
  | "phase_changed";

export interface TimelineEvent {
  readonly id: string;
  readonly turn_id: string;
  readonly type: TimelineEventType;
  readonly timestamp_ms: number;
  readonly summary: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}
