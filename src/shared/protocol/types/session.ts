/**
 * Session Protocol Types
 *
 * Session, Turn, Checkpoint, Timeline, Plan, Review,
 * Memory, Agent Instance, and related core session types.
 */

import type {
  AgentInstanceId,
  ConflictRisk,
  MemoryRuleId,
  MessageId,
  ProjectTodoId,
  RemoteCommandId,
  ReviewCommentId,
  RiskLevel,
  SessionId,
  TurnId,
} from "./core";
import type { AgentRole } from "./message";

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

export interface SessionStats {
  readonly turns_count: number;
  readonly files_modified: number;
  readonly files_created: number;
  readonly files_deleted: number;
  readonly tool_calls_count: number;
  readonly errors_count: number;
}

// ─── SessionMeta sub-types (ISP) ─────────────────────────────
// Consumers that only need identity/status should use SessionMetaCore.
// Analytics consumers use SessionMetaUsage. Scope guard uses SessionMetaScope.
// SessionMeta is the full intersection for components that need everything.

export interface SessionMetaCore {
  readonly session_id: SessionId;
  readonly model_id: string;
  readonly model_label: string;
  readonly approval_mode: ApprovalMode;
  readonly status: SessionStatus;
}

export interface SessionMetaUsage {
  readonly cost_usd?: number;
  readonly tokens_in?: number;
  readonly tokens_out?: number;
  readonly max_context_tokens?: number;
  readonly stats?: SessionStats;
}

export interface SessionMetaConfig {
  readonly thinking_enabled?: boolean;
  readonly fast_mode?: boolean;
  readonly summary?: string;
  readonly forked_from?: {
    readonly session_id: SessionId;
    readonly turn_id: TurnId;
  };
}

export interface SessionMetaScope {
  readonly scope_includes?: readonly string[];
  readonly scope_excludes?: readonly string[];
}

export type SessionMeta = SessionMetaCore & SessionMetaUsage & SessionMetaConfig & SessionMetaScope;

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

// ─── Turn ──────────────────────────────────────────────────
export type TurnPhase = "user_message" | "thinking" | "analysis" | "plan" | "changes" | "summary";

export type TurnStatus = "pending" | "running" | "success" | "error" | "paused";

export interface TurnPhaseEntry {
  readonly phase: TurnPhase;
  readonly message_ids: readonly MessageId[];
  readonly tool_call_ids: readonly string[];
  readonly summary: string;
  readonly collapsed: boolean;
  readonly status: TurnStatus;
  readonly duration_ms?: number;
}

// ─── Bookmark ────────────────────────────────────────────
export type BookmarkLabel = "decision" | "fix" | "risk" | "important";

export interface Turn {
  readonly id: TurnId;
  readonly phases: readonly TurnPhaseEntry[];
  readonly status: TurnStatus;
  readonly created_at_ms: number;
  readonly ttft_ms?: number;
  readonly latency_ms?: number;
  readonly token_usage?: {
    readonly input_tokens: number;
    readonly output_tokens: number;
    readonly cache_read_tokens?: number;
    readonly cache_write_tokens?: number;
  };
  readonly estimated_cost_usd?: number;
  readonly bookmarked?: boolean;
  readonly bookmark_label?: BookmarkLabel;
  /** Multi-agent identity — which agent owns this turn */
  readonly agent_id?: string;
  readonly agent_name?: string;
  readonly agent_role?: AgentRole;
}

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

// ─── Symbol Mention ──────────────────────────────────────
export type SymbolKind = "function" | "class" | "variable" | "type" | "file";

export interface SymbolMention {
  readonly name: string;
  readonly kind: SymbolKind;
  readonly file_path: string;
  readonly line?: number;
  readonly turn_id: string;
}

// ─── Plan Checklist ───────────────────────────────────────
export type PlanChecklistItemStatus = "pending" | "in_progress" | "completed" | "failed";

export interface PlanChecklistItem {
  readonly id: string;
  readonly label: string;
  readonly status: PlanChecklistItemStatus;
}

// ─── Patch Simulation ──────────────────────────────────────
export interface PatchSimulationResult {
  readonly file_path: string;
  readonly conflict_risk: ConflictRisk;
  readonly conflict_details?: string;
  readonly affected_files: readonly string[];
}

// ─── Review Comment ────────────────────────────────────────
export type ReviewCommentStatus = "open" | "accepted" | "dismissed";
export type ReviewSeverity = "error" | "warning" | "info" | "suggestion";

export interface ReviewComment {
  readonly id: ReviewCommentId;
  readonly file_path: string;
  readonly line: number;
  readonly line_start?: number;
  readonly line_end?: number;
  readonly text: string;
  readonly message?: string;
  readonly severity: ReviewSeverity;
  readonly status?: ReviewCommentStatus;
  readonly suggested_fix?: string;
  readonly suggestion?: string;
  readonly created_at_ms?: number;
  readonly author?: string;
}

// ─── Memory Rule ─────────────────────────────────────────
export type MemoryRuleSource =
  | "user"
  | "project"
  | "auto"
  | ".cursorrules"
  | "CLAUDE.md"
  | ".clinerules"
  | "custom";

export interface MemoryRule {
  readonly id: MemoryRuleId;
  readonly title: string;
  readonly content: string;
  readonly pinned?: boolean;
  readonly source?: MemoryRuleSource;
  readonly file_path?: string;
  readonly active?: boolean;
  readonly created_at_ms?: number;
}

// ─── Auto-Memory Suggestion ─────────────────────────────
export interface AutoMemorySuggestion {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly confidence: number;
  readonly source_turn_id?: string;
}

// ─── Compaction Event ────────────────────────────────────
export interface CompactionEvent {
  readonly id: string;
  readonly timestamp_ms: number;
  readonly tokens_before: number;
  readonly tokens_after: number;
  readonly summary: string;
}

// ─── Agent Instance ────────────────────────────────────────
export type AgentInstanceStatus = "queued" | "running" | "success" | "error" | "cancelled";
export interface AgentInstance {
  readonly id: AgentInstanceId;
  readonly label: string;
  readonly status: AgentInstanceStatus;
  readonly progress: number;
  readonly model_id: string;
  readonly created_at_ms: number;
  readonly completed_at_ms?: number;
  readonly error_message?: string;
  readonly current_file?: string;
  readonly files_processed?: number;
  readonly files_total?: number;
  readonly current_task?: string;
  readonly resources?: {
    readonly memory_mb?: number;
    readonly cpu_percent?: number;
  };
}

// ─── Completion Settings ───────────────────────────────────
export interface CompletionSettings {
  readonly enabled: boolean;
  readonly trigger_delay_ms: number;
  readonly max_lines: number;
  readonly accept_key: string;
}
export interface CompletionStats {
  readonly shown_today: number;
  readonly accepted_today: number;
  readonly acceptance_rate: number;
}

// ─── Project Todo ──────────────────────────────────────────
export type ProjectTodoStatus = "pending" | "in_progress" | "completed" | "failed";
export type ProjectTodoPriority = "high" | "medium" | "low";
export interface ProjectTodo {
  readonly id: ProjectTodoId;
  readonly label: string;
  readonly status: ProjectTodoStatus;
  readonly priority: ProjectTodoPriority;
  readonly source_session_ids: readonly string[];
  readonly source_turn_id?: string;
  readonly created_at_ms: number;
  readonly updated_at_ms: number;
  readonly description?: string;
}

// ─── Remote Control ────────────────────────────────────────
export type RemoteConnectionStatus = "disconnected" | "waiting" | "connected";
export interface RemoteCommand {
  readonly id: RemoteCommandId;
  readonly text: string;
  readonly received_at_ms: number;
  readonly executed: boolean;
  readonly source?: string;
}

// ─── Semantic Index ────────────────────────────────────────
export type IndexStatus = "idle" | "indexing" | "ready" | "error";
export interface SemanticSearchResult {
  readonly file_path: string;
  readonly line_number: number;
  readonly snippet: string;
  readonly score: number;
  readonly symbol_name?: string;
  readonly symbol?: string;
}

// ─── Boomerang Task ────────────────────────────────────────
export type BoomerangTaskStatus = "pending" | "running" | "success" | "error";

export interface BoomerangTask {
  readonly id: string;
  readonly parent_turn_id: TurnId;
  readonly label: string;
  readonly status: BoomerangTaskStatus;
  readonly agent_id?: string;
  readonly result_summary?: string;
}

// ─── Breadcrumb Context ────────────────────────────────────
export interface BreadcrumbContext {
  readonly session_name?: string;
  readonly turn_id?: TurnId;
  readonly turn_label?: string;
  readonly file_path?: string;
  readonly symbol_name?: string;
}

// ─── Mission Control ───────────────────────────────────────
export type MissionControlAgentStatus = "running" | "idle" | "error";

export interface MissionControlAgent {
  readonly id: AgentInstanceId;
  readonly name: string;
  readonly status: MissionControlAgentStatus;
  readonly current_task?: string;
  readonly progress_pct: number;
  readonly risk_level: RiskLevel;
  readonly eta_ms?: number;
  readonly session_id?: SessionId;
}

// ─── Architect Mode ─────────────────────────────────────────
export type ArchitectRole = "planner" | "coder" | "critic";

export interface ArchitectState {
  readonly active_role: ArchitectRole;
  readonly model_name: string;
  readonly task_description?: string;
}

// ─── Model Routing ──────────────────────────────────────────
export interface ModelRoute {
  readonly task_type: string;
  readonly model: string;
  readonly reason: string;
  readonly timestamp_ms: number;
}
