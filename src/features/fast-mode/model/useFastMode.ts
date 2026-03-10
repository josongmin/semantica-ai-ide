import { useCallback } from "react";
import { useAtomValue } from "jotai";

import { fastModeAtom } from "../../../shared/lib";
import { getVscodeApi } from "../../../shared/lib/vscodeApi";

export function useFastMode(): {
  enabled: boolean;
  toggle: () => void;
} {
  const enabled = useAtomValue(fastModeAtom);

  const toggle = useCallback(() => {
    getVscodeApi().postMessage({ type: "SET_FAST_MODE", enabled: !enabled });
  }, [enabled]);

  return { enabled, toggle };
}
