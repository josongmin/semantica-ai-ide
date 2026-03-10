import { useEffect } from "react";
import { useSetAtom } from "jotai";

import { isAllowedOrigin } from "~shared/lib";
import type { IntentEntry } from "~shared/protocol";

import {
  intentTimelineAtom,
  upsertIntentAtom,
} from "../../../../entities/intent-timeline";

/**
 * Sync intent timeline from extension host (auto-detected + manual).
 */
export function useIntentSync() {
  const upsert = useSetAtom(upsertIntentAtom);
  const setTimeline = useSetAtom(intentTimelineAtom);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!isAllowedOrigin(e.origin)) return;
      const msg = e.data as { type?: string; payload?: unknown } | null;
      if (!msg || typeof msg.type !== "string") return;

      switch (msg.type) {
        case "intent/update":
          if (msg.payload != null) upsert(msg.payload as IntentEntry);
          break;
        case "intent/sync":
          if (Array.isArray(msg.payload)) setTimeline(msg.payload as readonly IntentEntry[]);
          break;
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [upsert, setTimeline]);
}
