import { atom } from "jotai";

import { createBoundedAtomFamily } from "../../../shared/lib/atoms/createBoundedAtomFamily";
import { setDebugLabel } from "../../../shared/lib/atoms/debugLabel";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type {
  GraphEdge,
  GraphNode,
  GraphNodeKind,
  WorkspaceGraphNodeId,
  WorkspaceGraphSnapshot,
} from "../../../shared/protocol";

/** Full workspace graph snapshot from LSP engine */
export const workspaceGraphAtom = atom<WorkspaceGraphSnapshot | null>(null);

/** Currently selected/focused node for context view */
export const selectedNodeIdAtom = atom<WorkspaceGraphNodeId | null>(null);

/** Per-node lookup */
export const graphNodeFamily = createBoundedAtomFamily(
  (id: WorkspaceGraphNodeId) =>
    atom((get) => {
      const graph = get(workspaceGraphAtom);
      return graph?.nodes.find((n) => n.id === id) ?? null;
    }),
  { maxSize: 2000 },
  (a: WorkspaceGraphNodeId, b: WorkspaceGraphNodeId) => a === b,
);
setDebugLabel(graphNodeFamily, "graphNodeFamily");

/** Nodes related to the currently focused file */
export const activeFileGraphNodesAtom = atom<readonly GraphNode[]>([]);

/** Search/filter state */
export const graphFilterAtom = atom<{ kinds: GraphNodeKind[]; query: string }>({
  kinds: [],
  query: "",
});

/** Filtered nodes based on search/filter */
export const filteredGraphNodesAtom = atom((get) => {
  const graph = get(workspaceGraphAtom);
  const filter = get(graphFilterAtom);
  if (!graph) return [];
  return graph.nodes.filter((n) => {
    if (filter.kinds.length > 0 && !filter.kinds.includes(n.kind)) return false;
    if (filter.query && !n.name.toLowerCase().includes(filter.query.toLowerCase())) return false;
    return true;
  });
});

/** Subgraph for focused view: selected node + direct connections */
export const focusedSubgraphAtom = atom((get) => {
  const graph = get(workspaceGraphAtom);
  const selectedId = get(selectedNodeIdAtom);
  if (!graph || !selectedId) return null;
  const selected = graph.nodes.find((n) => n.id === selectedId);
  if (!selected) return null;
  const nodeIds = new Set<WorkspaceGraphNodeId>([selectedId, ...selected.connections]);
  const nodes = graph.nodes.filter((n) => nodeIds.has(n.id));
  const edges = graph.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
  return { nodes, edges, selected } as {
    nodes: readonly GraphNode[];
    edges: readonly GraphEdge[];
    selected: GraphNode;
  };
});

/** Nodes visible in current view (focused subgraph or filtered) */
export const visibleGraphNodesAtom = atom((get) => {
  const subgraph = get(focusedSubgraphAtom);
  const filtered = get(filteredGraphNodesAtom);
  if (subgraph) return subgraph.nodes;
  return filtered;
});

/** Reset all workspace-graph state */
export const resetWorkspaceGraphStoreAtom = atom(null, (_get, set) => {
  set(workspaceGraphAtom, null);
  set(selectedNodeIdAtom, null);
  set(activeFileGraphNodesAtom, []);
  set(graphFilterAtom, { kinds: [], query: "" });
  graphNodeFamily.setShouldRemove(() => true);
  graphNodeFamily.setShouldRemove(null);
});
registerResetAtom(resetWorkspaceGraphStoreAtom);

/** Total node/edge counts for status display */
export const graphStatsAtom = atom((get) => {
  const graph = get(workspaceGraphAtom);
  return {
    nodes: graph?.nodes.length ?? 0,
    edges: graph?.edges.length ?? 0,
    updatedAt: graph?.updatedAt ?? 0,
  };
});
