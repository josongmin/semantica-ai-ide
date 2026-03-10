import { useCallback } from "react";

import { getVscodeApi } from "~shared/lib/vscodeApi";
import type { TerminalSessionId } from "~shared/protocol";

/**
 * Send commands to terminal via extension host.
 */
export function useTerminalCommand() {
  const api = getVscodeApi();

  const sendCommand = useCallback(
    (sessionId: TerminalSessionId, command: string) => {
      api.postMessage({
        type: "terminal/command",
        payload: { sessionId, cmd: command },
      } as never);
    },
    [api],
  );

  const approveAction = useCallback(
    (actionId: string) => {
      api.postMessage({
        type: "terminal/approve",
        payload: { actionId },
      } as never);
    },
    [api],
  );

  const rejectAction = useCallback(
    (actionId: string) => {
      api.postMessage({
        type: "terminal/reject",
        payload: { actionId },
      } as never);
    },
    [api],
  );

  return { sendCommand, approveAction, rejectAction };
}
