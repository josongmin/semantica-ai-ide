import { useCallback } from "react";

import { getVscodeApi } from "~shared/lib/vscodeApi";
import type { BackgroundAgentId, BackgroundAgentKind } from "~shared/protocol";

/**
 * Control actions for background agents (start/stop/pause).
 */
export function useBackgroundAgentControl() {
  const api = getVscodeApi();

  const startAgent = useCallback(
    (kind: BackgroundAgentKind, config?: Record<string, unknown>) => {
      const agentId = `bg_${Date.now()}` as BackgroundAgentId;
      api.postMessage({
        type: "bg-agent/start",
        payload: { agentId, task: kind, config },
      } as never);
      return agentId;
    },
    [api],
  );

  const stopAgent = useCallback(
    (agentId: BackgroundAgentId) => {
      api.postMessage({
        type: "bg-agent/stop",
        payload: { agentId },
      } as never);
    },
    [api],
  );

  const pauseAgent = useCallback(
    (agentId: BackgroundAgentId) => {
      api.postMessage({
        type: "bg-agent/pause",
        payload: { agentId },
      } as never);
    },
    [api],
  );

  const resumeAgent = useCallback(
    (agentId: BackgroundAgentId) => {
      api.postMessage({
        type: "bg-agent/resume",
        payload: { agentId },
      } as never);
    },
    [api],
  );

  return { startAgent, stopAgent, pauseAgent, resumeAgent };
}
