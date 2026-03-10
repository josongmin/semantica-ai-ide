import { useCallback } from "react";

import { getVscodeApi } from "../../../shared/lib";

export function useCompactAction() {
  const compactContext = useCallback(() => {
    getVscodeApi().postMessage({ type: "COMPACT_CONTEXT" });
  }, []);

  return { compactContext };
}
