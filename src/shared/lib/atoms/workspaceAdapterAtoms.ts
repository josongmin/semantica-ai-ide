/**
 * Adapter atom for workspace-awareness feature.
 *
 * Widgets read this atom instead of importing directly from
 * `features/workspace-awareness`, breaking the DIP violation.
 * The feature layer hydrates the adapter at bootstrap time.
 */
import { atom } from "jotai";

// ─── Re-declare minimal types so shared layer has no feature deps ──

export type WorkspaceFileAction = "created" | "modified" | "deleted" | "read";

export interface WorkspaceFileEntry {
  readonly file_path: string;
  readonly action: WorkspaceFileAction;
  readonly turn_id: string;
  readonly language?: string;
}

export interface WorkspaceFileGroup {
  readonly action: WorkspaceFileAction;
  readonly files: readonly WorkspaceFileEntry[];
  readonly count: number;
}

// ─── Adapter interface ──────────────────────────────────────────────

export interface WorkspaceAwarenessAdapter {
  /** All file changes across all turns (deduped, latest turn wins). */
  readonly allFileChanges: readonly WorkspaceFileEntry[];
  /** Grouped workspace files by action, respecting turn filter. */
  readonly filteredGroups: readonly WorkspaceFileGroup[];
  /** Unfiltered groups (all turns). */
  readonly groups: readonly WorkspaceFileGroup[];
  /** Total file count across all groups. */
  readonly totalCount: number;
  /** Available turn IDs for filtering. */
  readonly turnIds: readonly string[];
  /** Infer language from file extension. */
  inferLanguage: (filePath: string) => string | undefined;
}

// ─── Adapter atom (null before hydration) ───────────────────────────

export const workspaceAwarenessAdapterAtom = atom<WorkspaceAwarenessAdapter | null>(null);
workspaceAwarenessAdapterAtom.debugLabel = "workspaceAwarenessAdapterAtom";
