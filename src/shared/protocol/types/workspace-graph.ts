/**
 * Workspace Graph Protocol Types
 *
 * Graph nodes, edges, and snapshot types for workspace analysis.
 */

import type { WorkspaceGraphNodeId } from "./core";

// ─── Workspace Graph ────────────────────────────────────
export type GraphNodeKind = "file" | "class" | "function" | "interface" | "module" | "variable";

export interface GraphNode {
  readonly id: WorkspaceGraphNodeId;
  readonly kind: GraphNodeKind;
  readonly name: string;
  readonly filePath: string;
  readonly line: number;
  readonly connections: readonly WorkspaceGraphNodeId[];
  readonly metrics?: {
    readonly complexity: number;
    readonly changeFreq: number;
    readonly lastModified: number;
  };
}

export interface GraphEdge {
  readonly source: WorkspaceGraphNodeId;
  readonly target: WorkspaceGraphNodeId;
  readonly kind: "imports" | "calls" | "extends" | "implements" | "references";
}

export interface WorkspaceGraphSnapshot {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly updatedAt: number;
}
