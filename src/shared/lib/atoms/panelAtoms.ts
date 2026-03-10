import { atom } from "jotai";

import {
  backgroundJobsPanelVisibleAtom,
  livePreviewPanelVisibleAtom,
  pipelineGlobalVisibleAtom,
  snapshotsPanelVisibleAtom,
  usageDashboardPanelVisibleAtom,
  watchModePanelVisibleAtom,
} from "./bottomSheetAtoms";
import {
  activityFeedVisibleAtom,
  codeBlockPickerOpenAtom,
  commitGenDialogOpenAtom,
  conversationSearchOpenAtom,
  demoModalOpenAtom,
  mcpRegistryOpenAtom,
  modeGalleryOpenAtom,
  playbookMarketOpenAtom,
  rewindPanelOpenAtom,
} from "./dialogAtoms";
import {
  bgAgentsPanelVisibleAtom,
  deepWikiPanelVisibleAtom,
  graphPanelVisibleAtom,
  intentPanelVisibleAtom,
  missionControlPanelVisibleAtom,
  multiAgentReviewPanelVisibleAtom,
  resourcesPanelVisibleAtom,
  teamPanelVisibleAtom,
  terminalPanelVisibleAtom,
  threeModelPanelVisibleAtom,
  workspaceAwarenessPanelVisibleAtom,
} from "./inspectionPanelAtoms";
import {
  reviewChangesPanelVisibleAtom,
  reviewExpandedFileAtom,
  reviewSearchQueryAtom,
} from "./reviewPanelAtoms";
import {
  agentsPanelVisibleAtom,
  browserPanelVisibleAtom,
  compactionPanelVisibleAtom,
  gitPanelVisibleAtom,
  mcpPanelVisibleAtom,
  memoryPanelVisibleAtom,
  remotePanelVisibleAtom,
  scratchpadPanelVisibleAtom,
  searchPanelVisibleAtom,
  ticketLinkPanelVisibleAtom,
} from "./sidebarPanelAtoms";

// ─── Sidebar Panels ─────────────────────────────────────────
export {
  agentsPanelVisibleAtom,
  browserPanelVisibleAtom,
  compactionPanelVisibleAtom,
  gitPanelVisibleAtom,
  mcpPanelVisibleAtom,
  memoryPanelVisibleAtom,
  remotePanelVisibleAtom,
  scratchpadPanelVisibleAtom,
  searchPanelVisibleAtom,
  ticketLinkPanelVisibleAtom,
} from "./sidebarPanelAtoms";

// ─── Bottom Sheets ──────────────────────────────────────────
export {
  backgroundJobsPanelVisibleAtom,
  livePreviewPanelVisibleAtom,
  pipelineGlobalVisibleAtom,
  snapshotsPanelVisibleAtom,
  usageDashboardPanelVisibleAtom,
  watchModePanelVisibleAtom,
} from "./bottomSheetAtoms";

// ─── Inspection Panels ──────────────────────────────────────
export {
  bgAgentsPanelVisibleAtom,
  deepWikiPanelVisibleAtom,
  graphPanelVisibleAtom,
  intentPanelVisibleAtom,
  missionControlPanelVisibleAtom,
  multiAgentReviewPanelVisibleAtom,
  resourcesPanelVisibleAtom,
  teamPanelVisibleAtom,
  terminalPanelVisibleAtom,
  threeModelPanelVisibleAtom,
  workspaceAwarenessPanelVisibleAtom,
} from "./inspectionPanelAtoms";

// ─── Review State (re-exported from reviewPanelAtoms) ───────
export {
  reviewChangesPanelVisibleAtom,
  reviewExpandedFileAtom,
  reviewSearchQueryAtom,
} from "./reviewPanelAtoms";

// ─── Reset ──────────────────────────────────────────────────

/** Reset all panel visibility atoms to their defaults */
export const resetPanelAtomsAtom = atom(null, (_get, set) => {
  // Sidebar
  set(agentsPanelVisibleAtom, false);
  set(searchPanelVisibleAtom, false);
  set(mcpPanelVisibleAtom, false);
  set(browserPanelVisibleAtom, false);
  set(memoryPanelVisibleAtom, false);
  set(gitPanelVisibleAtom, false);
  set(remotePanelVisibleAtom, false);
  set(compactionPanelVisibleAtom, false);
  set(scratchpadPanelVisibleAtom, false);
  set(ticketLinkPanelVisibleAtom, false);

  // Bottom sheets
  set(usageDashboardPanelVisibleAtom, false);
  set(backgroundJobsPanelVisibleAtom, false);
  set(pipelineGlobalVisibleAtom, false);
  set(watchModePanelVisibleAtom, false);
  set(livePreviewPanelVisibleAtom, false);
  set(snapshotsPanelVisibleAtom, false);

  // Inspection panels
  set(graphPanelVisibleAtom, false);
  set(bgAgentsPanelVisibleAtom, false);
  set(intentPanelVisibleAtom, false);
  set(terminalPanelVisibleAtom, false);
  set(teamPanelVisibleAtom, false);
  set(resourcesPanelVisibleAtom, false);
  set(missionControlPanelVisibleAtom, false);
  set(workspaceAwarenessPanelVisibleAtom, false);
  set(threeModelPanelVisibleAtom, false);
  set(deepWikiPanelVisibleAtom, false);
  set(multiAgentReviewPanelVisibleAtom, false);

  // Review state
  set(reviewChangesPanelVisibleAtom, false);
  set(reviewExpandedFileAtom, null);
  set(reviewSearchQueryAtom, "");

  // Dialog atoms (cross-file reset)
  set(mcpRegistryOpenAtom, false);
  set(modeGalleryOpenAtom, false);
  set(playbookMarketOpenAtom, false);
  set(codeBlockPickerOpenAtom, false);
  set(rewindPanelOpenAtom, false);
  set(commitGenDialogOpenAtom, false);
  set(conversationSearchOpenAtom, false);
  set(demoModalOpenAtom, false);
  set(activityFeedVisibleAtom, false);
});
