import { useCallback } from "react";

import { getVscodeApi } from "../../../shared/lib";

export function useActionReplay() {
  const replayStep = useCallback((direction: "forward" | "backward") => {
    getVscodeApi().postMessage({ type: "REPLAY_STEP", direction });
  }, []);

  const replayBranch = useCallback((step_index: number) => {
    getVscodeApi().postMessage({ type: "REPLAY_BRANCH", step_index });
  }, []);

  const stopReplay = useCallback(() => {
    getVscodeApi().postMessage({ type: "STOP_REPLAY" });
  }, []);

  const startReplay = useCallback((turnId: string) => {
    getVscodeApi().postMessage({ type: "START_REPLAY", turn_id: turnId });
  }, []);

  return { replayStep, replayBranch, stopReplay, startReplay };
}
