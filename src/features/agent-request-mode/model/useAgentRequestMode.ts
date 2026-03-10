import { useCallback } from "react";
import { useAtom } from "jotai";

import { getVscodeApi } from "../../../shared/lib";
import type { AgentRequestMode } from "../../../shared/protocol";
import { agentRequestModeAtom } from "./agentRequestModeAtom";

export function useAgentRequestMode(): {
  mode: AgentRequestMode;
  changeMode: (newMode: AgentRequestMode) => void;
} {
  const [mode, setMode] = useAtom(agentRequestModeAtom);

  const changeMode = useCallback(
    (newMode: AgentRequestMode) => {
      setMode(newMode);
      getVscodeApi().postMessage({ type: "SET_AGENT_REQUEST_MODE", mode: newMode });
    },
    [setMode],
  );

  return { mode, changeMode };
}
