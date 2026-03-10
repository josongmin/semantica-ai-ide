import { useCallback } from "react";

import { getVscodeApi } from "../../../shared/lib";
import type { RestoreMode } from "../../../shared/protocol";

/**
 * Hook that provides a function to restore a checkpoint with a selected mode.
 * Sends the RESTORE_CHECKPOINT message to the extension host.
 */
export function useCheckpointRestore() {
  const restoreCheckpoint = useCallback((checkpointId: string, mode: RestoreMode) => {
    getVscodeApi().postMessage({
      type: "RESTORE_CHECKPOINT",
      checkpoint_id: checkpointId,
      mode,
    });
  }, []);

  return { restoreCheckpoint };
}
