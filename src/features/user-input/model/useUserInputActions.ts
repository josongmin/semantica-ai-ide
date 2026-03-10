import { useCallback } from "react";

import { getVscodeApi } from "../../../shared/lib/vscodeApi";

export function useUserInputActions() {
  const skipUserInput = useCallback((requestId: string) => {
    getVscodeApi().postMessage({ type: "SKIP_USER_INPUT", request_id: requestId });
  }, []);

  return { skipUserInput };
}
