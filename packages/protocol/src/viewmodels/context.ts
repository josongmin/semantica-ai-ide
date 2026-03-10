export interface ContextPackViewModel {
  readonly files: ContextFile[];
  readonly symbols: ContextSymbol[];
  readonly totalTokens: number;
}

export interface ContextFile {
  readonly path: string;
  readonly relevance: number;
  readonly tokenCount: number;
}

export interface ContextSymbol {
  readonly name: string;
  readonly kind: string;
  readonly filePath: string;
  readonly relevance: number;
}
