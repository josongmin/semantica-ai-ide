import { useCallback } from "react";

import { getVscodeApi } from "../../../shared/lib";

export function useLivePreview() {
  const refreshPreview = useCallback(() => {
    getVscodeApi().postMessage({ type: "REFRESH_PREVIEW" });
  }, []);

  const openPreviewExternal = useCallback((url: string) => {
    getVscodeApi().postMessage({ type: "OPEN_PREVIEW_EXTERNAL", url });
  }, []);

  return { refreshPreview, openPreviewExternal };
}
