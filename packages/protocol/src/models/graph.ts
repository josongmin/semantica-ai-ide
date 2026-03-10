// Knowledge graph domain models (RFC-007 canonical)

export type GraphNodeType = "function" | "class" | "module" | "service" | "file" | "package";
export type GraphEdgeType = "calls" | "imports" | "extends" | "implements" | "depends_on" | "contains";

export interface GraphNode {
  readonly id: string;
  readonly type: GraphNodeType;
  readonly label: string;
  readonly filePath?: string;
  readonly line?: number;
  readonly metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  readonly source: string;
  readonly target: string;
  readonly type: GraphEdgeType;
  readonly weight?: number;
  readonly metadata?: Record<string, unknown>;
}
