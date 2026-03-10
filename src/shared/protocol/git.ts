/**
 * Git & Diff Types
 */

import type { GitCommitId } from "./brandedIds";

// ─── Diff / File Change ────────────────────────────────────
export type PatchIR = Readonly<Record<string, unknown>>;

export type FileChangeStatus = "added" | "modified" | "deleted" | "renamed";
export type ApprovalStatus = "pending" | "accepted" | "rejected";
export type ConflictRisk = "none" | "low" | "medium" | "high";

export interface FileChange {
  readonly file_path: string;
  readonly turn_id: string;
  readonly status: FileChangeStatus;
  readonly insertions: number;
  readonly deletions: number;
  readonly diff_text?: string;
  readonly approval_status: ApprovalStatus;
  readonly conflict_risk?: ConflictRisk;
  readonly conflict_details?: string;
  /** One-line intent explaining why this file changed */
  readonly intent?: string;
}

export interface FileChangeSummary {
  readonly added: number;
  readonly modified: number;
  readonly deleted: number;
  readonly renamed: number;
  readonly total_insertions: number;
  readonly total_deletions: number;
  readonly files: readonly FileChange[];
}

// ─── Diff Result (Web Worker) ─────────────────────────────
export type DiffLineKind = "add" | "remove" | "context";

export interface DiffResultLine {
  readonly kind: DiffLineKind;
  readonly content: string;
  readonly oldLineNumber: number | null;
  readonly newLineNumber: number | null;
}

export interface DiffResult {
  readonly lines: readonly DiffResultLine[];
  readonly additions: number;
  readonly deletions: number;
  readonly unchanged: number;
}

// ─── Git History ───────────────────────────────────────────
export interface GitCommit {
  readonly id: GitCommitId;
  readonly sha: string;
  readonly message: string;
  readonly timestamp_ms: number;
  readonly turn_id?: string;
  readonly auto: boolean;
  readonly author?: string;
  readonly branch?: string;
}

// ─── Three-Way Diff ─────────────────────────────────────────
export interface ThreeWayConflictRegion {
  readonly start_line: number;
  readonly end_line: number;
}

export interface ThreeWayDiffData {
  readonly file_path: string;
  readonly base_content: string;
  readonly agent_content: string;
  readonly current_content: string;
  readonly conflicts: readonly ThreeWayConflictRegion[];
}

// ─── Patch Simulation ──────────────────────────────────────
export interface PatchSimulationResult {
  readonly file_path: string;
  readonly conflict_risk: ConflictRisk;
  readonly conflict_details?: string;
  readonly affected_files: readonly string[];
}
