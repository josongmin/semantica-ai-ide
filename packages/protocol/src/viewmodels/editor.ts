export interface EditorDiagnosticViewModel {
  readonly filePath: string;
  readonly diagnostics: DiagnosticItem[];
}

export interface DiagnosticItem {
  readonly line: number;
  readonly column: number;
  readonly severity: "error" | "warning" | "info" | "hint";
  readonly message: string;
  readonly source?: string;
  readonly code?: string;
}

export interface SymbolNavigationViewModel {
  readonly symbols: SymbolItem[];
}

export interface SymbolItem {
  readonly name: string;
  readonly kind: string;
  readonly filePath: string;
  readonly line: number;
  readonly column: number;
  readonly containerName?: string;
}
