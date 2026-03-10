/**
 * AI Native Coding OS — Agent Domain Types
 *
 * Background agent, transaction, and intent timeline types.
 */

import type { BackgroundAgentId, IntentId, TransactionId, TurnId } from "./core";
import type { DiffHunk } from "./tool";

// ─── Background Agent ───────────────────────────────────
export type BackgroundAgentKind =
  | "lint-watch"
  | "test-watch"
  | "refactor-sweep"
  | "dependency-audit"
  | "doc-gen"
  | "custom";

export type BackgroundAgentState = "idle" | "running" | "paused" | "error" | "completed";

// ─── BackgroundAgentStatus Sub-interfaces (ISP) ────────
export interface BackgroundAgentIdentity {
  readonly agentId: BackgroundAgentId;
  readonly kind: BackgroundAgentKind;
  readonly label: string;
}

export interface BackgroundAgentRuntime {
  readonly state: BackgroundAgentState;
  readonly startedAt?: number;
}

export type BackgroundAgentStatus = BackgroundAgentIdentity &
  BackgroundAgentRuntime & {
    readonly progress?: { current: number; total: number };
    readonly lastResult?: {
      readonly summary: string;
      readonly issues: number;
      readonly fixesApplied: number;
      readonly timestamp: number;
    };
    readonly logs: readonly string[];
    readonly config: Record<string, unknown>;
  };

// ─── Transaction ────────────────────────────────────────
export interface TransactionFileChange {
  readonly filePath: string;
  readonly type: "create" | "modify" | "delete" | "rename";
  readonly hunks: readonly DiffHunk[];
  readonly insertions: number;
  readonly deletions: number;
  readonly oldPath?: string;
  readonly included: boolean;
}

export type TransactionState =
  | "preparing"
  | "preview"
  | "applying"
  | "committed"
  | "rolled_back"
  | "error";

export interface TransactionStatus {
  readonly txId: TransactionId;
  readonly state: TransactionState;
  readonly files: readonly TransactionFileChange[];
  readonly createdAt: number;
  readonly turnId?: TurnId;
  readonly description: string;
  readonly validationErrors: readonly string[];
  readonly checkpointId?: string;
}

// ─── Intent Timeline ────────────────────────────────────
export type IntentStatus = "active" | "completed" | "abandoned" | "branched";

// ─── IntentEntry Sub-interfaces (ISP) ──────────────────
export interface IntentIdentity {
  readonly id: IntentId;
  readonly status: IntentStatus;
}

export interface IntentMetadata {
  readonly summary: string;
  readonly createdAt: number;
  readonly turnIds: readonly TurnId[];
}

export interface IntentHierarchy {
  readonly parentId?: IntentId;
  readonly childIntents: readonly IntentId[];
}

export type IntentEntry = IntentIdentity &
  IntentMetadata &
  IntentHierarchy & {
    readonly description?: string;
    readonly tags: readonly string[];
    readonly completedAt?: number;
    readonly relatedFiles: readonly string[];
  };
