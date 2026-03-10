import { useCallback } from "react";
import { useAtom } from "jotai";

import { approvalModeAtom } from "~entities/session/settings";
import { getVscodeApi } from "~shared/lib";
import type { ApprovalMode } from "~shared/protocol";

/**
 * 3-tier approval mode management:
 * - confirm: All actions require user confirmation
 * - auto: Read-only auto, writes require confirmation
 * - turbo: All auto except dangerous operations
 */
export function useApprovalGate(): {
  mode: ApprovalMode;
  changeMode: (newMode: ApprovalMode) => void;
  grantApproval: (actionId: string) => void;
  grantApprovalInSandbox: (actionId: string) => void;
  denyApproval: (actionId: string) => void;
  stopTool: (toolCallId: string) => void;
  retryTool: (toolCallId: string) => void;
} {
  const [mode, setMode] = useAtom(approvalModeAtom);

  const changeMode = useCallback(
    (newMode: ApprovalMode) => {
      setMode(newMode);
      getVscodeApi().postMessage({
        type: "SET_APPROVAL_MODE",
        mode: newMode,
      });
    },
    [setMode],
  );

  const grantApproval = useCallback((actionId: string) => {
    getVscodeApi().postMessage({
      type: "GRANT_APPROVAL",
      action_id: actionId,
    });
  }, []);

  const grantApprovalInSandbox = useCallback((actionId: string) => {
    getVscodeApi().postMessage({
      type: "GRANT_APPROVAL",
      action_id: actionId,
      sandbox: true,
    });
  }, []);

  const denyApproval = useCallback((actionId: string) => {
    getVscodeApi().postMessage({
      type: "DENY_APPROVAL",
      action_id: actionId,
    });
  }, []);

  const stopTool = useCallback((toolCallId: string) => {
    getVscodeApi().postMessage({
      type: "STOP_TOOL",
      tool_call_id: toolCallId,
    });
  }, []);

  const retryTool = useCallback((toolCallId: string) => {
    getVscodeApi().postMessage({
      type: "RETRY_TOOL",
      tool_call_id: toolCallId,
    });
  }, []);

  return { mode, changeMode, grantApproval, grantApprovalInSandbox, denyApproval, stopTool, retryTool };
}
