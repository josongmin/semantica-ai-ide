/**
 * Adapter atom for diff-review feature.
 *
 * Widgets read this atom instead of importing directly from
 * `features/diff-review`, breaking the DIP violation.
 * The feature layer hydrates the adapter at bootstrap time.
 */
import { atom } from "jotai";

import type { ApprovalStatus } from "../../protocol";

// ─── Adapter interface ──────────────────────────────────────────────

export interface DiffReviewAdapter {
  /** Approve a single file change. */
  approve: (turnId: string, filePath: string) => void;
  /** Reject a single file change. */
  reject: (turnId: string, filePath: string) => void;
  /** Approve all file changes in a turn. */
  approveAll: (turnId: string, filePaths: string[]) => void;
  /** Reject all file changes in a turn. */
  rejectAll: (turnId: string, filePaths: string[]) => void;
  /** Open a file in the editor at an optional location. */
  openInEditor: (filePath: string, line?: number, column?: number) => void;
  /** Set arbitrary approval status for a file. */
  setApprovalStatus: (turnId: string, filePath: string, status: ApprovalStatus) => void;
}

// ─── Adapter atom (null before hydration) ───────────────────────────

export const diffReviewAdapterAtom = atom<DiffReviewAdapter | null>(null);
diffReviewAdapterAtom.debugLabel = "diffReviewAdapterAtom";
