/**
 * Symbol Mention Types
 */

// ─── Symbol Mention ──────────────────────────────────────
export type SymbolKind = "function" | "class" | "variable" | "type" | "file";

export interface SymbolMention {
  readonly name: string;
  readonly kind: SymbolKind;
  readonly file_path: string;
  readonly line?: number;
  readonly turn_id: string;
}
