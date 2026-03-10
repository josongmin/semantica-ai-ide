import { useCallback } from "react";
import { useAtomValue } from "jotai";

import { thinkingModeAtom } from "../../../shared/lib";
import { getVscodeApi } from "../../../shared/lib/vscodeApi";

export function useThinkingMode(): {
  enabled: boolean;
  toggle: () => void;
} {
  const enabled = useAtomValue(thinkingModeAtom);

  const toggle = useCallback(() => {
    getVscodeApi().postMessage({ type: "SET_THINKING_MODE", enabled: !enabled });
  }, [enabled]);

  return { enabled, toggle };
}
