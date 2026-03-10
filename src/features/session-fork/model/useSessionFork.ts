import { useCallback } from "react";
import { useSetAtom } from "jotai";

import { pushToastAtom } from "../../../shared/lib";
import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import type { TurnId } from "../../../shared/protocol";

let forkCounter = 0;

/**
 * Hook for session forking — creating a branch from a specific turn.
 * Sends fork command to extension host and shows toast notification.
 */
export function useSessionFork() {
  const pushToast = useSetAtom(pushToastAtom);

  const forkFromTurn = useCallback(
    (turnId: TurnId) => {
      getVscodeApi().postMessage({
        type: "FORK_SESSION",
        source_turn_id: turnId,
      });

      pushToast({
        id: `fork-${++forkCounter}`,
        message: "Forking session — navigating to new branch...",
        variant: "info",
        duration: 4000,
      });
    },
    [pushToast],
  );

  return { forkFromTurn } as const;
}
