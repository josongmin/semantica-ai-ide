import { useEffect } from "react";
import { useSetAtom } from "jotai";

import { isAllowedOrigin } from "~shared/lib";
import type { BackgroundAgentId, BackgroundAgentStatus } from "~shared/protocol";

import {
  removeBackgroundAgentAtom,
  upsertBackgroundAgentAtom,
} from "../../../../entities/background-agent";

/**
 * Sync background agent status updates from extension host → Jotai atoms.
 * Mount once at App level.
 */
export function useBackgroundAgentSync() {
  const upsert = useSetAtom(upsertBackgroundAgentAtom);
  const remove = useSetAtom(removeBackgroundAgentAtom);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!isAllowedOrigin(e.origin)) return;
      const msg = e.data as { type?: string; payload?: Record<string, unknown> } | null;
      if (!msg || typeof msg.type !== "string") return;

      switch (msg.type) {
        case "bg-agent/status":
          if (msg.payload) upsert(msg.payload as unknown as BackgroundAgentStatus);
          break;
        case "bg-agent/removed":
          if (msg.payload && typeof (msg.payload as { agentId?: unknown }).agentId === "string") {
            remove((msg.payload as { agentId: BackgroundAgentId }).agentId);
          }
          break;
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [upsert, remove]);
}
