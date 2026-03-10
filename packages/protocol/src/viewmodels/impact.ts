export interface ImpactGraphViewModel {
  readonly rootSymbol: string;
  readonly nodes: ImpactNode[];
  readonly edges: ImpactEdge[];
  readonly totalAffected: number;
}

export interface ImpactNode {
  readonly id: string;
  readonly label: string;
  readonly type: "function" | "class" | "module" | "file";
  readonly filePath: string;
  readonly impactLevel: "direct" | "transitive";
}

export interface ImpactEdge {
  readonly source: string;
  readonly target: string;
  readonly type: "calls" | "imports" | "extends";
}
