import { atom } from "jotai";

// ─── Bottom Sheets ──────────────────────────────────────────
// Dashboard and monitoring panels rendered as bottom sheets.

/** Usage dashboard panel visibility */
export const usageDashboardPanelVisibleAtom = atom(false);

/** Background jobs panel visibility */
export const backgroundJobsPanelVisibleAtom = atom(false);

/** Pipeline panels global visibility toggle */
export const pipelineGlobalVisibleAtom = atom(false);

/** Watch mode panel visibility */
export const watchModePanelVisibleAtom = atom(false);

/** Live preview panel visibility */
export const livePreviewPanelVisibleAtom = atom(false);

/** Machine snapshots panel visibility */
export const snapshotsPanelVisibleAtom = atom(false);
