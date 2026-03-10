import React, { useCallback } from "react";
import { useSetAtom } from "jotai";

import { selectedNodeIdAtom } from "../../../entities/workspace-graph";
import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import type { GraphNode } from "../../../shared/protocol";
import { cn, Icon, Text } from "../../../shared/ui";
import { KIND_CONFIG } from "./kindConfig";

// ─── Node Row (clickable, opens file) ──────────────────────────

export const NodeRow = React.memo(function NodeRow({ node, isSelected }: { node: GraphNode; isSelected: boolean }) {
  const cfg = KIND_CONFIG[node.kind];
  const setSelectedId = useSetAtom(selectedNodeIdAtom);

  const handleClick = useCallback(() => {
    setSelectedId(node.id);
    getVscodeApi().postMessage({
      type: "OPEN_FILE",
      file_path: node.filePath,
      line: node.line,
    } as never);
  }, [node, setSelectedId]);

  const fileShort = node.filePath.split("/").pop() ?? node.filePath;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left",
        "hover:bg-vsc-list-hover/60 transition-colors duration-fast cursor-pointer focus-ring",
        isSelected && "bg-vsc-list-active-bg/60 ring-1 ring-vsc-focus/50",
      )}
    >
      <span className="shrink-0" style={{ color: `var(${cfg.cssVar}, ${cfg.fallback})` }}>
        <Icon name={cfg.icon as "symbol-misc"} tokenSize="xs" />
      </span>
      <Text size="xs" truncate className="flex-1 min-w-0 font-mono" title={node.name}>
        {node.name}
      </Text>
      <Text size="2xs" tone="ghost" className="shrink-0 tabular-nums">
        {fileShort}:{node.line}
      </Text>
      {node.connections.length > 0 && (
        <span className="shrink-0 text-2xs text-vsc-text-ghost">
          {node.connections.length}
        </span>
      )}
    </button>
  );
});
