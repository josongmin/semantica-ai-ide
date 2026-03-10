/**
 * Shared status → icon / color mappings.
 *
 * Used by PlanChecklistItemRow, ProjectTodoItemRow, TodoBoardCard, and
 * TodoBoardColumn to avoid duplicating the same mapping tables.
 */

// ─── Status Visual Mappings ─────────────────────────────────

type TaskStatus = "pending" | "in_progress" | "completed" | "failed";

export const STATUS_ICONS: Readonly<Record<TaskStatus, string>> = {
  pending: "circle-outline",
  in_progress: "loading",
  completed: "check",
  failed: "error",
};

export const STATUS_COLORS: Readonly<Record<TaskStatus, string>> = {
  pending: "text-vsc-text-tertiary",
  in_progress: "text-vsc-info",
  completed: "text-vsc-success",
  failed: "text-vsc-error",
};

// ─── Priority Visual Mappings ───────────────────────────────

type Priority = "high" | "medium" | "low";

export const PRIORITY_VARIANTS: Readonly<Record<Priority, "error" | "warning" | "default">> = {
  high: "error",
  medium: "warning",
  low: "default",
};

// ─── Relative Time Formatting ───────────────────────────────
// Canonical implementation in shared/lib/formatters.ts
export { formatRelativeTime } from "./formatters";
