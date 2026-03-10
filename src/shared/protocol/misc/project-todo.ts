/**
 * Project Todo & Todo Board Types
 */

import type { ProjectTodoId, RemoteCommandId } from "../brandedIds";

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

// ─── Todo Board Filter Types ───────────────────────────────
export type TodoFilterStatus = "all" | "pending" | "in_progress" | "completed" | "failed";
export type TodoSortKey = "date" | "priority" | "status";

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
