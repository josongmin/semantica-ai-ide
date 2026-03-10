import { atom } from "jotai";

// ─── Sidebar Panels ─────────────────────────────────────────
// Panels that appear as primary sidebar views (left/right drawers).

/** Parallel agents panel visibility */
export const agentsPanelVisibleAtom = atom(false);

/** Semantic search panel visibility */
export const searchPanelVisibleAtom = atom(false);

/** MCP management panel visibility */
export const mcpPanelVisibleAtom = atom(false);

/** Browser preview panel visibility */
export const browserPanelVisibleAtom = atom(false);

/** Project memory/rules panel visibility */
export const memoryPanelVisibleAtom = atom(false);

/** Git history panel visibility */
export const gitPanelVisibleAtom = atom(false);

/** Remote control panel visibility */
export const remotePanelVisibleAtom = atom(false);

/** Compaction history panel visibility */
export const compactionPanelVisibleAtom = atom(false);

/** Scratchpad/notepads panel visibility */
export const scratchpadPanelVisibleAtom = atom(false);

/** Ticket link panel visibility */
export const ticketLinkPanelVisibleAtom = atom(false);
