import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { getVscodeApi } from "~shared/lib";

import {
  confirmOptimisticAtom,
  optimisticApprovalAtom,
  type OptimisticApprovalStatus,
  rollbackOptimisticAtom,
  setOptimisticApprovalAtom,
} from "./optimisticApprovalAtoms";

/**
 * Optimistic UI for tool approval clicks.
 *
 * Pattern:
 * 1. Set local atom immediately (optimistic)
 * 2. Send message to extension host
 * 3. On server response: confirm (or rollback on error)
 *
 * The hook returns the current optimistic status for a given tool call
 * and functions to approve/deny optimistically.
 */
export function useOptimisticApproval(toolCallId: string): {
  /** The optimistic status for this tool call (undefined = no optimistic state) */
  optimisticStatus: OptimisticApprovalStatus | undefined;
  /** Optimistically approve: set local state immediately, then notify server */
  approveOptimistic: (actionId: string) => void;
  /** Optimistically deny: set local state immediately, then notify server */
  denyOptimistic: (actionId: string) => void;
  /** Rollback the optimistic state (e.g. on error) */
  rollback: () => void;
  /** Confirm the optimistic state (server acknowledged) */
  confirm: () => void;
} {
  const optimisticMap = useAtomValue(optimisticApprovalAtom);
  const setOptimistic = useSetAtom(setOptimisticApprovalAtom);
  const rollbackAtom = useSetAtom(rollbackOptimisticAtom);
  const confirmAtom = useSetAtom(confirmOptimisticAtom);

  const optimisticStatus = optimisticMap.get(toolCallId);

  const approveOptimistic = useCallback(
    (actionId: string) => {
      // 1. Set optimistic state immediately
      setOptimistic({ toolCallId, status: "approved" });
      // 2. Send to extension host
      getVscodeApi().postMessage({
        type: "GRANT_APPROVAL",
        action_id: actionId,
      });
    },
    [toolCallId, setOptimistic],
  );

  const denyOptimistic = useCallback(
    (actionId: string) => {
      // 1. Set optimistic state immediately
      setOptimistic({ toolCallId, status: "rejected" });
      // 2. Send to extension host
      getVscodeApi().postMessage({
        type: "DENY_APPROVAL",
        action_id: actionId,
      });
    },
    [toolCallId, setOptimistic],
  );

  const rollback = useCallback(() => {
    rollbackAtom(toolCallId);
  }, [toolCallId, rollbackAtom]);

  const confirm = useCallback(() => {
    confirmAtom(toolCallId);
  }, [toolCallId, confirmAtom]);

  return {
    optimisticStatus,
    approveOptimistic,
    denyOptimistic,
    rollback,
    confirm,
  };
}
