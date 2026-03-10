import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { ExportFormat, ExportOptions, ExportProgress } from "../../../shared/protocol";

/** Whether the export dialog is open */
export const exportDialogOpenAtom = atom(false);

/** Current export progress state */
export const exportProgressAtom = atom<ExportProgress>("idle");

/** Optional error message when export fails */
export const exportErrorMessageAtom = atom<string | null>(null);

/** Selected export format */
export const exportFormatAtom = atom<ExportFormat>("html");

/** Export options (toggles for what to include) */
export const exportOptionsAtom = atom<ExportOptions>({
  include_diffs: true,
  include_tool_calls: true,
  include_timestamps: true,
});

/** Write-only: set export progress from a serverEvent */
export const setExportProgressAtom = atom(
  null,
  (_get, set, payload: { progress: ExportProgress; error_message?: string }) => {
    set(exportProgressAtom, payload.progress);
    set(exportErrorMessageAtom, payload.error_message ?? null);
  },
);

/** Write-only: reset the export store */
export const resetExportStoreAtom = atom(null, (_get, set) => {
  set(exportDialogOpenAtom, false);
  set(exportProgressAtom, "idle");
  set(exportErrorMessageAtom, null);
  set(exportFormatAtom, "html");
  set(exportOptionsAtom, {
    include_diffs: true,
    include_tool_calls: true,
    include_timestamps: true,
  });
});

registerResetAtom(resetExportStoreAtom);
