import { atom } from "jotai";
import { atomFamily } from "jotai/utils";

import { createBoundedAtomFamily } from "~shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "~shared/lib/atoms/debugLabel";
import { registerResetAtom } from "~shared/lib/atoms/resetRegistry";
import type { ApprovalStatus, FileChange, FileChangeSummary } from "~shared/protocol";

/** File change keys indexed by turn_id → Set<key> for O(1) lookups */
const fileChangeKeysByTurnAtom = atom<Readonly<Record<string, ReadonlySet<string>>>>({});

/** Per-file-change atom family, keyed by `${turn_id}::${file_path}`.
 *  Bounded to 2000 entries to prevent unbounded memory growth between resets. */
export const fileChangeAtomFamily = createBoundedAtomFamily(
  (_key: string) => atom<FileChange | null>(null),
  { maxSize: 2000 },
  (a: string, b: string) => a === b,
);
setDebugLabel(fileChangeAtomFamily, "fileChangeAtomFamily");

function fileChangeKey(fc: FileChange): string {
  return `${fc.turn_id}::${fc.file_path}`;
}

/** Write-only: upsert a file change */
export const upsertFileChangeAtom = atom(null, (get, set, fc: FileChange) => {
  const key = fileChangeKey(fc);
  set(fileChangeAtomFamily(key), fc);

  const byTurn = get(fileChangeKeysByTurnAtom);
  const turnKeys = byTurn[fc.turn_id] ?? new Set<string>();
  if (!turnKeys.has(key)) {
    const nextSet = new Set(turnKeys);
    nextSet.add(key);
    set(fileChangeKeysByTurnAtom, {
      ...byTurn,
      [fc.turn_id]: nextSet,
    });
  }
});

/** Write-only: reset all file change state (call on session change) */
export const resetDiffStoreAtom = atom(null, (get, set) => {
  const byTurn = get(fileChangeKeysByTurnAtom);
  for (const keys of Object.values(byTurn)) {
    for (const k of keys) {
      fileChangeAtomFamily.remove(k);
    }
  }
  for (const turnId of Object.keys(byTurn)) {
    fileChangeSummaryByTurnAtom.remove(turnId);
  }
  set(fileChangeKeysByTurnAtom, {});
});

/** Write-only: set approval status for a file change */
export const setFileApprovalAtom = atom(
  null,
  (get, set, payload: { turn_id: string; file_path: string; status: ApprovalStatus }) => {
    const key = `${payload.turn_id}::${payload.file_path}`;
    const fc = get(fileChangeAtomFamily(key));
    if (!fc) return;
    set(fileChangeAtomFamily(key), { ...fc, approval_status: payload.status });
  },
);

/** Read-only: file change summary for a specific turn (single-pass aggregation) */
// eslint-disable-next-line @typescript-eslint/no-deprecated -- atomFamily migration to jotai-family tracked separately
export const fileChangeSummaryByTurnAtom = atomFamily(
  (turnId: string) =>
    atom<FileChangeSummary>((get) => {
      const keys = get(fileChangeKeysByTurnAtom)[turnId];
      if (!keys || keys.size === 0) {
        return {
          added: 0,
          modified: 0,
          deleted: 0,
          renamed: 0,
          total_insertions: 0,
          total_deletions: 0,
          files: [],
        };
      }

      const files: FileChange[] = [];
      let added = 0;
      let modified = 0;
      let deleted = 0;
      let renamed = 0;
      let totalInsertions = 0;
      let totalDeletions = 0;

      for (const k of keys) {
        const fc = get(fileChangeAtomFamily(k));
        if (!fc) continue;
        files.push(fc);
        if (fc.status === "added") added++;
        else if (fc.status === "modified") modified++;
        else if (fc.status === "deleted") deleted++;
        else renamed++;
        totalInsertions += fc.insertions;
        totalDeletions += fc.deletions;
      }

      // Sort by path for deterministic render order regardless of arrival order
      files.sort((a, b) => a.file_path.localeCompare(b.file_path));

      return {
        added,
        modified,
        deleted,
        renamed,
        total_insertions: totalInsertions,
        total_deletions: totalDeletions,
        files,
      };
    }),
  (a: string, b: string) => a === b,
);
setDebugLabel(fileChangeSummaryByTurnAtom, "fileChangeSummaryByTurnAtom");

/** Read-only: count of all file changes (avoids subscribing to the full array) */
export const allFileChangesCountAtom = atom((get) => {
  const byTurn = get(fileChangeKeysByTurnAtom);
  let count = 0;
  for (const keys of Object.values(byTurn)) {
    count += keys.size;
  }
  return count;
});

/** Read-only: all file changes across all turns */
export const allFileChangesAtom = atom<FileChange[]>((get) => {
  const byTurn = get(fileChangeKeysByTurnAtom);
  const result: FileChange[] = [];
  for (const keys of Object.values(byTurn)) {
    for (const k of keys) {
      const fc = get(fileChangeAtomFamily(k));
      if (fc) result.push(fc);
    }
  }
  result.sort((a, b) => {
    const turnCmp = a.turn_id.localeCompare(b.turn_id);
    return turnCmp !== 0 ? turnCmp : a.file_path.localeCompare(b.file_path);
  });
  return result;
});

registerResetAtom(resetDiffStoreAtom);
