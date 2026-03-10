import { useCallback } from "react";
import { useAtomValue } from "jotai";

import { activeTransactionAtom } from "~entities/transaction";
import { getVscodeApi } from "~shared/lib/vscodeApi";
import type { TransactionId } from "~shared/protocol";

/**
 * Transaction control actions: commit, rollback, toggle files.
 */
export function useTransactionControl() {
  const api = getVscodeApi();
  const tx = useAtomValue(activeTransactionAtom);

  const commitTransaction = useCallback(
    (txId: TransactionId) => {
      if (!tx || tx.state === "committed") return;
      if (tx.validationErrors.length > 0) return;
      api.postMessage({ type: "transaction/commit", payload: { txId } } as never);
    },
    [api, tx],
  );

  const rollbackTransaction = useCallback(
    (txId: TransactionId) => {
      api.postMessage({ type: "transaction/rollback", payload: { txId } } as never);
    },
    [api],
  );

  const toggleFile = useCallback(
    (txId: TransactionId, filePath: string, include: boolean) => {
      api.postMessage({
        type: "transaction/toggle-file",
        payload: { txId, filePath, include },
      } as never);
    },
    [api],
  );

  return { commitTransaction, rollbackTransaction, toggleFile };
}
