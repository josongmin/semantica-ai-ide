import { useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";

import { allFileChangesAtom } from "~entities/diff";

import type { FileChange, FileChangeSummary } from "../../../shared/protocol";

/** Summarize file changes by status */
function aggregateFileChanges(files: readonly FileChange[]): FileChangeSummary {
  let added = 0;
  let modified = 0;
  let deleted = 0;
  let renamed = 0;
  let totalInsertions = 0;
  let totalDeletions = 0;
  for (const f of files) {
    if (f.status === "added") added++;
    else if (f.status === "modified") modified++;
    else if (f.status === "deleted") deleted++;
    else renamed++;
    totalInsertions += f.insertions;
    totalDeletions += f.deletions;
  }
  return {
    added,
    modified,
    deleted,
    renamed,
    total_insertions: totalInsertions,
    total_deletions: totalDeletions,
    files,
  };
}
import { useDiffReview } from "~shared/bootstrap/diff-review";

import { reviewSearchQueryAtom } from "./atoms";

/** Group files by turn_id for batch diff-review calls */
function groupByTurn(files: readonly FileChange[]): Map<string, string[]> {
  const byTurn = new Map<string, string[]>();
  for (const f of files) {
    const arr = byTurn.get(f.turn_id) ?? [];
    arr.push(f.file_path);
    byTurn.set(f.turn_id, arr);
  }
  return byTurn;
}

export function useReviewChanges() {
  const allFiles = useAtomValue(allFileChangesAtom);
  const searchQuery = useAtomValue(reviewSearchQueryAtom);
  const { approveAll, rejectAll } = useDiffReview();

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return allFiles;
    const q = searchQuery.toLowerCase();
    return allFiles.filter((f) => f.file_path.toLowerCase().includes(q));
  }, [allFiles, searchQuery]);

  // Single pass: summary + approval counts
  const { summary, pendingFiles, acceptedCount, rejectedCount } = useMemo(() => {
    const pending: FileChange[] = [];
    let accepted = 0;
    let rejected = 0;
    for (const fc of filteredFiles) {
      if (fc.approval_status === "pending") pending.push(fc);
      else if (fc.approval_status === "accepted") accepted++;
      else rejected++;
    }
    return {
      summary: aggregateFileChanges(filteredFiles),
      pendingFiles: pending,
      acceptedCount: accepted,
      rejectedCount: rejected,
    };
  }, [filteredFiles]);

  const acceptAllPending = useCallback(() => {
    for (const [turnId, paths] of groupByTurn(pendingFiles)) {
      approveAll(turnId, paths);
    }
  }, [pendingFiles, approveAll]);

  const rejectAllPending = useCallback(() => {
    for (const [turnId, paths] of groupByTurn(pendingFiles)) {
      rejectAll(turnId, paths);
    }
  }, [pendingFiles, rejectAll]);

  return {
    filteredFiles,
    summary,
    pendingFiles,
    acceptedCount,
    rejectedCount,
    acceptAllPending,
    rejectAllPending,
  };
}
