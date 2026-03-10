export type AgentLayer = "ui" | "orchestrator" | "model" | "tool" | "integration";
export type AgentKind = "user_action" | "transient" | "bug" | "policy" | "dependency";
export type AgentSeverity = "info" | "warn" | "error" | "fatal";

export interface SafeMessageV1 {
  title: string;
  what_happened: string;
  what_you_can_do: string[];
  scope_hint?: string;
  incident_id?: string;
}

export interface AgentErrorV1 {
  protocol_version: "error-schema.v1";
  error_code: string;
  layer: AgentLayer;
  kind?: AgentKind;
  severity: AgentSeverity;
  retryable: boolean;
  safe_message: SafeMessageV1;

  debug_message?: string;
  stacktrace?: string;
  cause_chain?: Array<{ error_code: string; message: string }>;
  meta?: Record<string, unknown>;

  trace_id: string;
  session_id: string;
  turn_id: string;
  occurred_at_ms: number;
}

export type RecoveryStrategy =
  | "retry_same_step"
  | "retry_reduced_scope"
  | "retry_fallback_model"
  | "rerun_last_tool"
  | "reauth"
  | "open_diagnostics"
  | "report_issue"
  | "cancel_and_reset";

export interface ReducedScopeV1 {
  include_paths?: string[];
  exclude_paths?: string[];
  max_files?: number;
  max_bytes?: number;
}

export interface RecoveryIntentV1 {
  protocol_version: "recovery-intent.v1";
  strategy: RecoveryStrategy;
  target_state?: "ANALYZE" | "PLAN" | "REVIEW_REQUIRED" | "APPLY" | "VALIDATE" | "ITERATE" | "IDLE";
  tool_call_id?: string;
  fallback_model_id?: string;
  reduced_scope?: ReducedScopeV1;

  trace_id: string;
  session_id: string;
  turn_id: string;
}
