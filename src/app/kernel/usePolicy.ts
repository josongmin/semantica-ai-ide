import { useCallback } from "react";

import type { PolicyResult } from "./types";
import { useKernel } from "./useKernel";

/**
 * Hook for policy checks through the Policy Engine.
 * Returns memoized `checkCapability` and `evaluatePolicy` functions.
 */
export function usePolicy() {
  const kernel = useKernel();

  const checkCapability = useCallback(
    async (action: string): Promise<boolean> => {
      return kernel.policy.checkCapability(action);
    },
    [kernel],
  );

  const evaluatePolicy = useCallback(
    async (
      action: string,
      resource: string,
      riskLevel?: "low" | "medium" | "high" | "critical",
    ): Promise<PolicyResult> => {
      return kernel.policy.evaluatePolicy({ action, resource, riskLevel });
    },
    [kernel],
  );

  return { checkCapability, evaluatePolicy };
}
