/**
 * NotComputed — canonical reason codes for why a query/analysis result
 * is unavailable. Normalizes the many possible failure modes into a
 * finite, machine-readable taxonomy.
 */

/** Phase in which the computation stalled or was skipped */
export type ComputationPhase =
  | "parse"        // Source parsing failed
  | "resolve"      // Symbol/reference resolution
  | "analyze"      // Static analysis pass
  | "transform"    // Result transformation
  | "transport"    // Transport-level failure
  | "policy"       // Denied by policy/capability
  | "timeout"      // Budget exceeded
  | "cancelled";   // User or system cancellation

/** Machine-readable reason code */
export type NotComputedReason =
  | "source_unavailable"      // File not found / not indexed
  | "parse_error"             // Syntax error prevents analysis
  | "unresolved_symbol"       // Symbol cannot be resolved
  | "cyclic_dependency"       // Circular reference detected
  | "analysis_budget_exceeded"// Complexity budget exhausted
  | "transport_error"         // Backend unreachable
  | "policy_denied"           // Capability check failed
  | "stale_cache"             // Cached result expired
  | "not_indexed"             // File/workspace not yet indexed
  | "unsupported_language"    // Language not supported
  | "cancelled_by_user"       // User cancelled operation
  | "cancelled_by_system"     // System cancelled (e.g., superseded)
  | "internal_error";         // Catch-all for unexpected failures

/** Structured NotComputed envelope */
export interface NotComputedResult {
  readonly computed: false;
  readonly reason: NotComputedReason;
  readonly phase: ComputationPhase;
  readonly message?: string;
  /** Original error if available (for debugging, not for display) */
  readonly cause?: string;
  readonly timestamp: number;
}

/** Type guard */
export function isNotComputed(value: unknown): value is NotComputedResult {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<string, unknown>).computed === false &&
    typeof (value as Record<string, unknown>).reason === "string" &&
    typeof (value as Record<string, unknown>).phase === "string"
  );
}

/** Factory for creating NotComputed results */
export function notComputed(
  reason: NotComputedReason,
  phase: ComputationPhase,
  message?: string,
  cause?: string,
): NotComputedResult {
  return {
    computed: false,
    reason,
    phase,
    message,
    cause,
    timestamp: Date.now(),
  };
}

/** Map from common error patterns to canonical reason codes */
export const ERROR_REASON_MAP: ReadonlyMap<string, NotComputedReason> = new Map([
  ["ENOENT", "source_unavailable"],
  ["ENOTFOUND", "transport_error"],
  ["ECONNREFUSED", "transport_error"],
  ["ETIMEDOUT", "analysis_budget_exceeded"],
  ["SyntaxError", "parse_error"],
  ["ReferenceError", "unresolved_symbol"],
  ["EPERM", "policy_denied"],
  ["EACCES", "policy_denied"],
  ["AbortError", "cancelled_by_user"],
]);

/** Normalize a raw error string into a NotComputedResult */
export function normalizeError(
  error: string,
  phase: ComputationPhase = "transport",
): NotComputedResult {
  for (const [pattern, reason] of ERROR_REASON_MAP) {
    if (error.includes(pattern)) {
      return notComputed(reason, phase, error);
    }
  }
  return notComputed("internal_error", phase, error);
}
