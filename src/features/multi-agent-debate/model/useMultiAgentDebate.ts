import { useCallback } from "react";

import { getVscodeApi } from "../../../shared/lib";

export function useMultiAgentDebate() {
  const startDebate = useCallback(
    (prompt: string, modelIds: string[]) => {
      getVscodeApi().postMessage({
        type: "START_DEBATE",
        prompt,
        model_ids: modelIds,
      });
    },
    [],
  );

  return { startDebate };
}
