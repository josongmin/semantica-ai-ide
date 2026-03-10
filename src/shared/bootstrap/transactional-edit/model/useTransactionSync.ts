import { useEffect } from "react";
import { useSetAtom } from "jotai";

import { activeTransactionAtom } from "~entities/transaction";
import { isAllowedOrigin } from "~shared/lib";
import type { TransactionStatus } from "~shared/protocol";

/**
 * Sync transaction state from extension host messages.
 */
export function useTransactionSync() {
  const setTransaction = useSetAtom(activeTransactionAtom);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!isAllowedOrigin(e.origin)) return;
      const msg = e.data as { type?: string; payload?: unknown } | null;
      if (!msg || typeof msg.type !== "string") return;

      switch (msg.type) {
        case "transaction/update":
          if (msg.payload != null) {
            setTransaction(msg.payload as TransactionStatus);
          }
          break;
        case "transaction/cleared":
          setTransaction(null);
          break;
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [setTransaction]);
}
