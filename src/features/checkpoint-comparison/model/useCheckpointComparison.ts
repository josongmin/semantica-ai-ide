import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { checkpointsAtom } from "~entities/session/state";

import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import type { Checkpoint } from "../../../shared/protocol";
import {
  clearComparisonAtom,
  type ComparisonPair,
  comparisonPairAtom,
  setComparisonAtom,
} from "./checkpointComparisonAtoms";

export interface CheckpointComparisonResult {
  /** Currently active comparison pair */
  pair: ComparisonPair | null;
  /** All available checkpoints for selection */
  checkpoints: readonly Checkpoint[];
  /** Start a comparison between two checkpoints */
  compare: (fromId: string, toId: string) => void;
  /** Clear the active comparison */
  clear: () => void;
  /** Restore workspace to a given checkpoint */
  restoreCheckpoint: (checkpointId: string) => void;
}

/**
 * Hook for comparing two checkpoints.
 * Resolves checkpoint IDs to full Checkpoint objects.
 */
export function useCheckpointComparison(): CheckpointComparisonResult {
  const pair = useAtomValue(comparisonPairAtom);
  const checkpoints = useAtomValue(checkpointsAtom);
  const setPair = useSetAtom(setComparisonAtom);
  const clearPair = useSetAtom(clearComparisonAtom);

  const compare = useCallback(
    (fromId: string, toId: string) => {
      const from = checkpoints.find((cp) => cp.id === fromId);
      const to = checkpoints.find((cp) => cp.id === toId);
      if (!from || !to) return;
      setPair({ from, to });
      // Request diff data from extension host
      getVscodeApi().postMessage({
        type: "GET_CHECKPOINT_DIFF",
        from_id: fromId,
        to_id: toId,
      });
    },
    [checkpoints, setPair],
  );

  const clear = useCallback(() => {
    clearPair();
  }, [clearPair]);

  const restoreCheckpoint = useCallback((checkpointId: string) => {
    getVscodeApi().postMessage({
      type: "RESTORE_CHECKPOINT",
      checkpoint_id: checkpointId,
    });
  }, []);

  return { pair, checkpoints, compare, clear, restoreCheckpoint };
}
