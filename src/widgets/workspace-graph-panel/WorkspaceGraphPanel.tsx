import React, { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  focusedSubgraphAtom,
  graphStatsAtom,
  selectedNodeIdAtom,
  visibleGraphNodesAtom,
  workspaceGraphAtom,
} from "../../entities/workspace-graph";
import { Text } from "../../shared/ui";
import { GraphCanvas } from "./components/GraphCanvas";
import { GraphEmptyState } from "./components/GraphEmptyState";
import { GraphFilterBar } from "./components/GraphFilterBar";
import { NodeRow } from "./components/NodeRow";

// ─── Main Panel (composition root) ───────────────────────────

export const WorkspaceGraphPanel = React.memo(function WorkspaceGraphPanel() {
  const graph = useAtomValue(workspaceGraphAtom);
  const subgraph = useAtomValue(focusedSubgraphAtom);
  const selectedId = useAtomValue(selectedNodeIdAtom);
  const visible = useAtomValue(visibleGraphNodesAtom);
  const stats = useAtomValue(graphStatsAtom);
  const setSelectedId = useSetAtom(selectedNodeIdAtom);

  const clearSelection = useCallback(() => setSelectedId(null), [setSelectedId]);

  if (!graph) {
    return <GraphEmptyState />;
  }

  const narrative = subgraph ? (
    <>
      <Text size="xs" weight="medium" className="text-vsc-text-primary">
        {subgraph.selected.name}
      </Text>
      <Text size="2xs" tone="ghost" className="ml-1">
        &rarr; {subgraph.selected.connections.length} connections
      </Text>
    </>
  ) : (
    <Text size="2xs" tone="ghost">
      Click a symbol to see its dependencies and navigate
    </Text>
  );

  return (
    <div className="flex flex-col gap-3 p-3" data-testid="workspace-graph-panel">
      {/* Header: contextual narrative */}
      <div className="flex items-center justify-between gap-2 min-h-6">
        <div className="flex items-center gap-2 min-w-0">
          {narrative}
        </div>
        {selectedId && (
          <button
            type="button"
            onClick={clearSelection}
            className="shrink-0 text-2xs text-vsc-text-ghost hover:text-vsc-text-secondary transition-colors duration-fast focus-ring"
          >
            Clear
          </button>
        )}
      </div>

      {/* Graph canvas */}
      <div className="w-full min-h-[160px]">
        <GraphCanvas />
      </div>

      {/* Filter */}
      <GraphFilterBar />

      {/* Node list */}
      <div
        className="max-h-[--panel-max-h-sm] overflow-y-auto space-y-0.5 -mx-1 px-1 scroll-shadow"
        role="list"
        aria-label="Symbols"
      >
        {visible.slice(0, 80).map((node) => (
          <NodeRow key={node.id} node={node} isSelected={node.id === selectedId} />
        ))}
        {visible.length > 80 && (
          <Text size="2xs" tone="ghost" className="px-2 py-1">
            +{visible.length - 80} more
          </Text>
        )}
        {visible.length === 0 && stats.nodes > 0 && (
          <Text size="xs" tone="ghost" className="px-2 py-4 text-center">
            No symbols match
          </Text>
        )}
      </div>
    </div>
  );
});
