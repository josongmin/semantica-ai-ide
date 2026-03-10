/**
 * Review & Plan Types
 */

import type { ReviewCommentId } from "../brandedIds";

// ─── Plan Checklist ───────────────────────────────────────
export type PlanChecklistItemStatus = "pending" | "in_progress" | "completed" | "failed";

export interface PlanChecklistItem {
  readonly id: string;
  readonly label: string;
  readonly status: PlanChecklistItemStatus;
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
