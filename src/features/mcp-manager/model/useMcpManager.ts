import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { allMcpToolsAtom, connectedServerCountAtom, mcpServerIdsAtom } from "~entities/mcp";

import { mcpPanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import type { McpTool } from "../../../shared/protocol";

export function useMcpManager(): {
  serverIds: readonly string[];
  connectedCount: number;
  allTools: readonly McpTool[];
  panelVisible: boolean;
  togglePanel: () => void;
  addServer: (url: string, name: string) => void;
  removeServer: (serverId: string) => void;
  toggleServer: (serverId: string, enabled: boolean) => void;
} {
  const serverIds = useAtomValue(mcpServerIdsAtom);
  const connectedCount = useAtomValue(connectedServerCountAtom);
  const allTools = useAtomValue(allMcpToolsAtom);
  const panelVisible = useAtomValue(mcpPanelVisibleAtom);

  const setVisible = useSetAtom(mcpPanelVisibleAtom);
  const togglePanel = useCallback(() => setVisible((v) => !v), [setVisible]);

  const addServer = useCallback((url: string, name: string) => {
    getVscodeApi().postMessage({ type: "ADD_MCP_SERVER", url, name });
  }, []);

  const removeServer = useCallback((serverId: string) => {
    getVscodeApi().postMessage({ type: "REMOVE_MCP_SERVER", server_id: serverId });
  }, []);

  const toggleServer = useCallback((serverId: string, enabled: boolean) => {
    getVscodeApi().postMessage({ type: "TOGGLE_MCP_SERVER", server_id: serverId, enabled });
  }, []);

  return {
    serverIds,
    connectedCount,
    allTools,
    panelVisible,
    togglePanel,
    addServer,
    removeServer,
    toggleServer,
  };
}
