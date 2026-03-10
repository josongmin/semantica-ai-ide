import { useCallback, useEffect, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { getVscodeApi, pushToastAtom } from "../../../shared/lib";
import {
  addAlwaysAllowedToolAtom,
  alwaysAllowedToolsAtom,
  clearAlwaysAllowedToolsAtom,
  isToolAlwaysAllowed,
  removeAlwaysAllowedToolAtom,
} from "./approvalMemoryAtoms";

interface ToolApprovalMemoryResult {
  /** Set of tools that are always allowed */
  allowedTools: ReadonlySet<string>;
  /** Tool name currently being granted (null = idle) */
  pendingTool: string | null;
  /** Check if a tool is in the always-allow list */
  isAllowed: (toolName: string) => boolean;
  /** Add a tool to always-allow and grant the pending approval */
  allowAlways: (toolName: string, actionId: string) => void;
  /** Remove a tool from always-allow */
  revokeAlways: (toolName: string) => void;
  /** Clear all always-allow rules */
  clearAll: () => void;
}

/**
 * Hook for managing tool approval memory.
 * "Always Allow" stores a tool name so future approval requests are auto-granted.
 * Tracks a pending state during the approval grant for optimistic UI feedback.
 */
export function useToolApprovalMemory(): ToolApprovalMemoryResult {
  const allowedTools = useAtomValue(alwaysAllowedToolsAtom);
  const addAllowed = useSetAtom(addAlwaysAllowedToolAtom);
  const removeAllowed = useSetAtom(removeAlwaysAllowedToolAtom);
  const clearAllowed = useSetAtom(clearAlwaysAllowedToolsAtom);
  const pushToast = useSetAtom(pushToastAtom);
  const [pendingTool, setPendingTool] = useState<string | null>(null);
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(pendingTimerRef.current), []);

  const isAllowed = useCallback(
    (toolName: string) => isToolAlwaysAllowed(toolName, allowedTools),
    [allowedTools],
  );

  const allowAlways = useCallback(
    (toolName: string, actionId: string) => {
      setPendingTool(toolName);
      addAllowed(toolName);
      getVscodeApi().postMessage({ type: "GRANT_APPROVAL", action_id: actionId });

      // Clear pending state after a short delay (server confirmation is implicit)
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = setTimeout(() => {
        setPendingTool(null);
        pushToast({
          id: `tool-always-allow-${toolName}`,
          variant: "success",
          message: `"${toolName}" added to always-allow`,
          duration: 2000,
        });
      }, 300);
    },
    [addAllowed, pushToast],
  );

  const revokeAlways = useCallback(
    (toolName: string) => {
      removeAllowed(toolName);
    },
    [removeAllowed],
  );

  const clearAll = useCallback(() => {
    clearAllowed();
  }, [clearAllowed]);

  return { allowedTools, pendingTool, isAllowed, allowAlways, revokeAlways, clearAll };
}
