import React from "react";
import { useAtomValue } from "jotai";

import { Icon } from "~shared/ui";

import { selectedNodeIdAtom } from "./graphAtoms";

export const NodeDetail = React.memo(function NodeDetail() {
  const selectedNodeId = useAtomValue(selectedNodeIdAtom);

  return (
    <div className="flex items-center gap-4 px-4 py-2.5 border-t border-vsc-border bg-vsc-surface-1 text-xs">
      {selectedNodeId ? (
        <>
          <div className="flex items-center gap-1.5">
            <span className="text-vsc-text-tertiary">Name:</span>
            <span className="text-vsc-fg font-mono">{selectedNodeId}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-vsc-text-tertiary">Type:</span>
            <span className="text-vsc-fg">module</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-vsc-text-tertiary">File:</span>
            <span className="text-vsc-fg font-mono">--</span>
          </div>
        </>
      ) : (
        <span className="flex items-center gap-1.5 text-vsc-text-tertiary">
          <Icon name="info" tokenSize="2xs" className="shrink-0" />
          Click a node in the graph to view details
        </span>
      )}
    </div>
  );
});
