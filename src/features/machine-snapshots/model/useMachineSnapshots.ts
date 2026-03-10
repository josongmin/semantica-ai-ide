import { useCallback } from "react";

import { getVscodeApi } from "../../../shared/lib/vscodeApi";

export function useMachineSnapshots() {
  const createSnapshot = useCallback((label: string) => {
    getVscodeApi().postMessage({ type: "CREATE_SNAPSHOT", label });
  }, []);

  const restoreSnapshot = useCallback((snapshotId: string) => {
    getVscodeApi().postMessage({ type: "RESTORE_SNAPSHOT_ENV", snapshot_id: snapshotId });
  }, []);

  const deleteSnapshot = useCallback((snapshotId: string) => {
    getVscodeApi().postMessage({ type: "DELETE_SNAPSHOT", snapshot_id: snapshotId });
  }, []);

  return { createSnapshot, restoreSnapshot, deleteSnapshot };
}
