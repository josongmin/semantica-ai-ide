import { useEffect } from "react";
import { useSetAtom } from "jotai";

import { isAllowedOrigin } from "~shared/lib";
import type { GraphNode, WorkspaceGraphSnapshot } from "~shared/protocol";

import { workspaceGraphAtom } from "../../../../entities/workspace-graph";

/**
 * Sync workspace graph snapshots from the LSP engine via extension host.
 */
export function useWorkspaceGraphSync() {
  const setGraph = useSetAtom(workspaceGraphAtom);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!isAllowedOrigin(e.origin)) return;
      const msg = e.data as { type?: string; payload?: unknown } | null;
      if (!msg || typeof msg.type !== "string") return;

      switch (msg.type) {
        case "workspace-graph/sync":
          if (msg.payload != null) {
            setGraph(msg.payload as WorkspaceGraphSnapshot);
          }
          break;
        case "workspace-graph/node-updated": {
          if (msg.payload == null) break;
          const update = msg.payload as { id: string; node: Partial<GraphNode> };
          setGraph((prev) => {
            if (!prev) return prev;
            const nodes = prev.nodes.map((n) =>
              n.id === update.id
                ? { ...n, ...update.node, id: n.id, kind: n.kind }
                : n,
            );
            return { ...prev, nodes };
          });
          break;
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [setGraph]);
}
