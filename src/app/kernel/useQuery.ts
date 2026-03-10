import { useCallback } from "react";

import type { QueryContext, QueryIntent, QueryJob } from "./types";
import { useKernel } from "./useKernel";

/**
 * Hook for executing queries through the Query Gateway.
 * Returns memoized `executeQuery` and `cancelQuery` functions.
 */
export function useQuery() {
  const kernel = useKernel();

  const executeQuery = useCallback(
    async (
      category: string,
      params: Record<string, unknown>,
      context?: Partial<QueryContext>,
    ): Promise<QueryJob> => {
      const intent: QueryIntent = {
        category,
        params,
        context: {
          workspaceId: context?.workspaceId ?? "default",
          ...context,
        },
      };
      return kernel.query.query(intent);
    },
    [kernel],
  );

  const cancelQuery = useCallback(
    async (jobId: string): Promise<void> => {
      return kernel.query.cancel(jobId);
    },
    [kernel],
  );

  return { executeQuery, cancelQuery };
}
