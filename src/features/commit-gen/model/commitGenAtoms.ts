import { atom } from "jotai";

export interface CommitGenDiff {
  insertions: number;
  deletions: number;
  filesChanged: number;
}

export const commitMessageDraftAtom = atom("");
export const commitDiffSummaryAtom = atom<CommitGenDiff>({ insertions: 0, deletions: 0, filesChanged: 0 });
export const commitGenLoadingAtom = atom(false);
