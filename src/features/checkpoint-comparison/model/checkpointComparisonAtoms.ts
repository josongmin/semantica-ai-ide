import { atom } from "jotai";

import type { Checkpoint, FileChange } from "../../../shared/protocol";

export interface ComparisonPair {
  readonly from: Checkpoint;
  readonly to: Checkpoint;
}

/** Atom holding the current comparison pair (null = no comparison active) */
export const comparisonPairAtom = atom<ComparisonPair | null>(null);

/** Write atom: set a comparison pair from two checkpoint IDs */
export const setComparisonAtom = atom(null, (_get, set, pair: ComparisonPair | null) => {
  set(comparisonPairAtom, pair);
});

/** Write atom: clear the comparison */
export const clearComparisonAtom = atom(null, (_get, set) => {
  set(comparisonPairAtom, null);
});

/** Derived: whether comparison is active */
export const isComparisonActiveAtom = atom((get) => get(comparisonPairAtom) !== null);

/** File changes for the current checkpoint diff (populated by SET_CHECKPOINT_DIFF serverEvent) */
export const comparisonFilesAtom = atom<readonly FileChange[]>([]);

/** Checkpoint diff state */
interface CheckpointDiff {
  from_id: string;
  to_id: string;
  files: readonly FileChange[];
}

export const checkpointDiffAtom = atom<CheckpointDiff | null>(null);

/** Write atom: set checkpoint diff files */
export const setCheckpointDiffAtom = atom(
  null,
  (_get, set, payload: { from_id: string; to_id: string; files: readonly FileChange[] }) => {
    set(comparisonFilesAtom, payload.files);
    set(checkpointDiffAtom, payload);
  },
);
