import { useCallback } from "react";

import { getVscodeApi } from "~shared/lib";

export function useBackgroundAgent() {
  const launchJob = useCallback(
    (label: string, prompt: string, cloud: boolean) => {
      getVscodeApi().postMessage({
        type: "LAUNCH_BACKGROUND_JOB",
        label,
        prompt,
        cloud,
      });
    },
    [],
  );

  return { launchJob };
}
