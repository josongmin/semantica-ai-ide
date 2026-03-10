import { useEffect } from "react";
import { useSetAtom } from "jotai";

import { isAllowedOrigin } from "~shared/lib";
import type { SemanticDiffResult } from "~shared/protocol";

import { setSemanticDiffResultAtom } from "../../../../entities/semantic-diff";

/**
 * Sync semantic diff results for turns from extension host.
 */
export function useSemanticDiffSync() {
  const setResult = useSetAtom(setSemanticDiffResultAtom);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!isAllowedOrigin(e.origin)) return;
      const msg = e.data as { type?: string; payload?: unknown } | null;
      if (!msg || typeof msg.type !== "string") return;
      if (msg.type === "semantic-diff/result" && msg.payload != null) {
        setResult(msg.payload as SemanticDiffResult);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [setResult]);
}
