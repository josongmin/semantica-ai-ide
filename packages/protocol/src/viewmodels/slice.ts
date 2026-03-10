export interface SliceViewModel {
  readonly criterion: string;
  readonly direction: "forward" | "backward" | "both";
  readonly statements: SliceStatement[];
  readonly coverage: number;
}

export interface SliceStatement {
  readonly filePath: string;
  readonly line: number;
  readonly content: string;
  readonly isRelevant: boolean;
}
