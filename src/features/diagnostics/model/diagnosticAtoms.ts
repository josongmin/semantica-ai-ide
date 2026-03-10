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

registerResetAtom(resetDiagnosticsAtom);
