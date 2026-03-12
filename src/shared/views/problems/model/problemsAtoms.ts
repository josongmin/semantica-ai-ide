import { atom } from "jotai";

// ─── Problem Model ───────────────────────────────────────

export interface Diagnostic {
  readonly id: string;
  readonly file: string;
  readonly line: number;
  readonly col: number;
  readonly severity: "error" | "warning" | "info" | "hint";
  readonly message: string;
  readonly source?: string;
  /** Optional error code (e.g. TS2345) */
  readonly code?: string;
  /** Optional quick-fix available flag */
  readonly fixable?: boolean;
}

/** Global diagnostics atom — updated by LSP bridge or agent */

export const diagnosticsAtom = atom<Diagnostic[]>([]);
