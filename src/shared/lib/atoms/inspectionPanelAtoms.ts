import { atom } from "jotai";

// ─── Inspection Panels ──────────────────────────────────────
// AI Native Coding OS deep-inspection and collaboration panels.

/** Workspace graph panel visibility */
export const graphPanelVisibleAtom = atom(false);

/** Background agents panel visibility */
export const bgAgentsPanelVisibleAtom = atom(false);

/** Intent timeline panel visibility */
export const intentPanelVisibleAtom = atom(false);

/** Terminal bridge panel visibility */
export const terminalPanelVisibleAtom = atom(false);

/** Team presence panel visibility */
export const teamPanelVisibleAtom = atom(false);

/** Resource monitor panel visibility */
export const resourcesPanelVisibleAtom = atom(false);

/** Mission control panel visibility */
export const missionControlPanelVisibleAtom = atom(false);

/** Workspace awareness panel visibility (popup) */
export const workspaceAwarenessPanelVisibleAtom = atom(false);

/** Three-model architecture panel visibility */
export const threeModelPanelVisibleAtom = atom(false);

/** DeepWiki documentation panel visibility */
export const deepWikiPanelVisibleAtom = atom(false);

/** Multi-agent review panel visibility */
export const multiAgentReviewPanelVisibleAtom = atom(false);
