import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { Diagnostic } from "../../../shared/protocol";

export const diagnosticsMapAtom = atom<ReadonlyMap<string, readonly Diagnostic[]>>(new Map());

export const setDiagnosticsAtom = atom(
  null,
  (get, set, payload: { file_path: string; diagnostics: readonly Diagnostic[] }) => {
    const current = get(diagnosticsMapAtom);
    const next = new Map(current);
    if (payload.diagnostics.length === 0) {
      next.delete(payload.file_path);
    } else {
      next.set(payload.file_path, payload.diagnostics);
    }
    set(diagnosticsMapAtom, next);
  },
);

export const resetDiagnosticsAtom = atom(null, (_get, set) => {
  set(diagnosticsMapAtom, new Map());
});

/** Derived: total error / warning counts across all files */
export const diagnosticCountsAtom = atom((get) => {
  const map = get(diagnosticsMapAtom);
  let errors = 0;
  let warnings = 0;
  for (const diags of map.values()) {
    for (const d of diags) {
      if (d.severity === "error") errors++;
      else if (d.severity === "warning") warnings++;
    }
  }
  return { errors, warnings };
});

registerResetAtom(resetDiagnosticsAtom);
