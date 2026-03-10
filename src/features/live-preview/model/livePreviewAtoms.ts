import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { PreviewState } from "../../../shared/protocol";

/** Default initial preview state */
const DEFAULT_PREVIEW_STATE: PreviewState = {
  url: "",
  status: "disconnected",
};

/** Current live preview state */
export const previewStateAtom = atom<PreviewState>(DEFAULT_PREVIEW_STATE);

/** Write-only: replace the preview state */
export const setPreviewStateAtom = atom(null, (_get, set, state: PreviewState) => {
  set(previewStateAtom, state);
});

/** Whether the preview panel is visible */
export const previewPanelVisibleAtom = atom(false);

/** Write-only: reset preview state */
export const resetLivePreviewStoreAtom = atom(null, (_get, set) => {
  set(previewStateAtom, DEFAULT_PREVIEW_STATE);
  set(previewPanelVisibleAtom, false);
});

registerResetAtom(resetLivePreviewStoreAtom);
