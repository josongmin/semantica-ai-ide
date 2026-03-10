import type { GraphNode, GraphEdge } from "../models/graph.js";

export interface KnowledgeGraphViewModel {
  readonly nodes: GraphNode[];
  readonly edges: GraphEdge[];
  readonly totalNodes: number;
  readonly totalEdges: number;
  readonly layoutType: "force" | "hierarchy" | "radial" | "grid";
}
