import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { agentInstanceIdsAtom, runningAgentsCountAtom } from "~entities/agent-instance";

import { agentsPanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import { getVscodeApi } from "../../../shared/lib/vscodeApi";

export function useParallelAgents(): {
  agentIds: readonly string[];
  runningCount: number;
  panelVisible: boolean;
  togglePanel: () => void;
  cancelAgent: (agentId: string) => void;
  spawnAgent: (label: string, modelId?: string) => void;
} {
  const agentIds = useAtomValue(agentInstanceIdsAtom);
  const runningCount = useAtomValue(runningAgentsCountAtom);
  const panelVisible = useAtomValue(agentsPanelVisibleAtom);

  const setVisible = useSetAtom(agentsPanelVisibleAtom);
  const togglePanel = useCallback(() => setVisible((v) => !v), [setVisible]);

  const cancelAgent = useCallback((agentId: string) => {
    getVscodeApi().postMessage({ type: "CANCEL_AGENT", agent_id: agentId });
  }, []);

  const spawnAgent = useCallback((label: string, modelId?: string) => {
    getVscodeApi().postMessage({ type: "SPAWN_AGENT", label, model_id: modelId });
  }, []);

  return { agentIds, runningCount, panelVisible, togglePanel, cancelAgent, spawnAgent };
}
