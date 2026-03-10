import { useEffect, useMemo } from "react";
import { useSetAtom } from "jotai";

import { approvalGateAdapterAtom } from "~shared/lib";

import { useApprovalGate } from "./useApprovalGate";

/**
 * Hydrates the shared-layer `approvalGateAdapterAtom` so that widget
 * code can consume the approval-gate API without importing this feature
 * directly (DIP / FSD compliance).
 *
 * Mount this once near the app root (e.g. in App.tsx or a providers wrapper).
 */
export function useHydrateApprovalAdapter(): void {
  const gate = useApprovalGate();
  const setAdapter = useSetAtom(approvalGateAdapterAtom);

  // Stabilise the adapter reference — only re-create when `mode` changes
  // (the callback functions are already stable via useCallback in the hook).
  const adapter = useMemo(
    () => ({
      mode: gate.mode,
      changeMode: gate.changeMode,
      grantApproval: gate.grantApproval,
      grantApprovalInSandbox: gate.grantApprovalInSandbox,
      denyApproval: gate.denyApproval,
      stopTool: gate.stopTool,
      retryTool: gate.retryTool,
    }),
    [
      gate.mode,
      gate.changeMode,
      gate.grantApproval,
      gate.grantApprovalInSandbox,
      gate.denyApproval,
      gate.stopTool,
      gate.retryTool,
    ],
  );

  useEffect(() => {
    setAdapter(adapter);
    return () => setAdapter(null);
  }, [adapter, setAdapter]);
}
