import { atom } from "jotai";

import { createBoundedAtomFamily } from "../../../shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "../../../shared/lib/atoms/debugLabel";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { ReviewComment, ReviewCommentId, ReviewCommentStatus } from "../../../shared/protocol";

// ─── Review Comment Atoms ──────────────────────────────────

/** Per-comment atom family — only subscribers of a specific comment re-render */
export const reviewCommentAtomFamily = createBoundedAtomFamily(
  (_id: string) => atom<ReviewComment | null>(null),
  { maxSize: 2000 },
  (a: string, b: string) => a === b,
);
setDebugLabel(reviewCommentAtomFamily, "reviewCommentAtomFamily");

/** Ordered comment IDs indexed by file_path */
export const reviewCommentIdsByFileAtom = atom<Readonly<Record<string, readonly string[]>>>({});

/** Set-based index for O(1) membership checks, indexed by file_path */
export const reviewCommentSetByFileAtom = atom<Readonly<Record<string, ReadonlySet<string>>>>({});

/** Ordered list of file paths that have review comments */
export const reviewedFilesAtom = atom<readonly string[]>([]);

/** Internal set for O(1) file path membership checks */
const reviewedFileSetAtom = atom<ReadonlySet<string>>(new Set<string>());

/** Write-only: upsert a review comment into the store, indexed by file_path */
export const upsertReviewCommentAtom = atom(null, (get, set, comment: ReviewComment) => {
  // Handle file_path change: remove from old index before updating
  const existing = get(reviewCommentAtomFamily(comment.id));
  if (existing && existing.file_path !== comment.file_path) {
    const oldSetByFile = get(reviewCommentSetByFileAtom);
    const oldFileSet = oldSetByFile[existing.file_path];
    if (oldFileSet?.has(comment.id)) {
      const nextOldSet = new Set(oldFileSet);
      nextOldSet.delete(comment.id);
      set(reviewCommentSetByFileAtom, {
        ...oldSetByFile,
        [existing.file_path]: nextOldSet,
      });
      const oldIdsByFile = get(reviewCommentIdsByFileAtom);
      set(reviewCommentIdsByFileAtom, {
        ...oldIdsByFile,
        [existing.file_path]: (oldIdsByFile[existing.file_path] ?? []).filter(
          (id) => id !== comment.id,
        ),
      });
    }
  }

  set(reviewCommentAtomFamily(comment.id), comment);

  const setByFile = get(reviewCommentSetByFileAtom);
  const fileSet = setByFile[comment.file_path] ?? new Set<string>();

  if (!fileSet.has(comment.id)) {
    const nextSet = new Set(fileSet);
    nextSet.add(comment.id);
    set(reviewCommentSetByFileAtom, { ...setByFile, [comment.file_path]: nextSet });

    const idsByFile = get(reviewCommentIdsByFileAtom);
    const fileIds = idsByFile[comment.file_path] ?? [];
    set(reviewCommentIdsByFileAtom, {
      ...idsByFile,
      [comment.file_path]: [...fileIds, comment.id],
    });

    // Track the file in reviewedFilesAtom
    const filePathSet = get(reviewedFileSetAtom);
    if (!filePathSet.has(comment.file_path)) {
      const nextFileSet = new Set(filePathSet);
      nextFileSet.add(comment.file_path);
      set(reviewedFileSetAtom, nextFileSet);
      set(reviewedFilesAtom, [...get(reviewedFilesAtom), comment.file_path]);
    }
  }
});

/** Write-only: replace all comments for a specific file_path */
export const setReviewCommentsAtom = atom(
  null,
  (get, set, payload: { file_path: string; comments: readonly ReviewComment[] }) => {
    // Remove old entries for this file from the family
    const setByFile = get(reviewCommentSetByFileAtom);
    const oldSet = setByFile[payload.file_path] ?? new Set<string>();
    for (const id of oldSet) {
      reviewCommentAtomFamily.remove(id);
    }

    // Insert new entries
    const newIds: string[] = [];
    const newSet = new Set<string>();
    for (const comment of payload.comments) {
      set(reviewCommentAtomFamily(comment.id), comment);
      newIds.push(comment.id);
      newSet.add(comment.id);
    }

    set(reviewCommentSetByFileAtom, { ...setByFile, [payload.file_path]: newSet });

    const idsByFile = get(reviewCommentIdsByFileAtom);
    set(reviewCommentIdsByFileAtom, { ...idsByFile, [payload.file_path]: newIds });

    // Track file if new
    const filePathSet = get(reviewedFileSetAtom);
    if (!filePathSet.has(payload.file_path)) {
      const nextFileSet = new Set(filePathSet);
      nextFileSet.add(payload.file_path);
      set(reviewedFileSetAtom, nextFileSet);
      set(reviewedFilesAtom, [...get(reviewedFilesAtom), payload.file_path]);
    }
  },
);

/** Write-only: partially update a review comment's status */
export const updateReviewCommentStatusAtom = atom(
  null,
  (get, set, payload: { id: ReviewCommentId; status: ReviewCommentStatus }) => {
    const comment = get(reviewCommentAtomFamily(payload.id));
    if (!comment) return;
    set(reviewCommentAtomFamily(payload.id), {
      ...comment,
      status: payload.status,
    });
  },
);

/** Write-only: reset all review comment state */
export const resetReviewStoreAtom = atom(null, (get, set) => {
  const setByFile = get(reviewCommentSetByFileAtom);
  for (const idSet of Object.values(setByFile)) {
    for (const id of idSet) {
      reviewCommentAtomFamily.remove(id);
    }
  }
  set(reviewCommentIdsByFileAtom, {});
  set(reviewCommentSetByFileAtom, {});
  set(reviewedFilesAtom, []);
  set(reviewedFileSetAtom, new Set());
});

// ─── Derived Atoms ─────────────────────────────────────────

/** Derived: total count of comments with status === "open" across all files */
export const openCommentCountAtom = atom((get) => {
  const idsByFile = get(reviewCommentIdsByFileAtom);
  let count = 0;
  for (const ids of Object.values(idsByFile)) {
    for (const id of ids) {
      const comment = get(reviewCommentAtomFamily(id));
      if (comment?.status === "open") count++;
    }
  }
  return count;
});

/** Derived: summary of review stats across all files */
export const reviewSummaryAtom = atom((get) => {
  const idsByFile = get(reviewCommentIdsByFileAtom);
  const files = Object.keys(idsByFile).length;
  let open = 0;
  let accepted = 0;
  let dismissed = 0;

  for (const ids of Object.values(idsByFile)) {
    for (const id of ids) {
      const comment = get(reviewCommentAtomFamily(id));
      if (!comment) continue;
      if (comment.status === "open") open++;
      else if (comment.status === "accepted") accepted++;
      else if (comment.status === "dismissed") dismissed++;
    }
  }

  return { files, open, accepted, dismissed };
});

registerResetAtom(resetReviewStoreAtom);
