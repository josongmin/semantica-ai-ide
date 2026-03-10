/**
 * Git-related Protocol Types
 */

import type { GitCommitId } from "./core";

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
