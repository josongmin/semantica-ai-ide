/**
 * Sub-barrel: Panel visibility atoms.
 *
 * Usage: import { agentsPanelVisibleAtom } from "~shared/lib/atoms/panels"
 *
 * Groups sidebar, bottom-sheet, inspection, and review panel toggles.
 */
export {
  // Sidebar
  agentsPanelVisibleAtom,
  // Bottom sheets
  backgroundJobsPanelVisibleAtom,
  // Inspection
  bgAgentsPanelVisibleAtom,
  browserPanelVisibleAtom,
  compactionPanelVisibleAtom,
  deepWikiPanelVisibleAtom,
  gitPanelVisibleAtom,
  graphPanelVisibleAtom,
  intentPanelVisibleAtom,
  livePreviewPanelVisibleAtom,
  mcpPanelVisibleAtom,
  memoryPanelVisibleAtom,
  missionControlPanelVisibleAtom,
  multiAgentReviewPanelVisibleAtom,
  pipelineGlobalVisibleAtom,
  remotePanelVisibleAtom,
  // Reset
  resetPanelAtomsAtom,
  resourcesPanelVisibleAtom,
  // Review
  reviewChangesPanelVisibleAtom,
  reviewExpandedFileAtom,
  reviewSearchQueryAtom,
  scratchpadPanelVisibleAtom,
  searchPanelVisibleAtom,
  snapshotsPanelVisibleAtom,
  teamPanelVisibleAtom,
  terminalPanelVisibleAtom,
  threeModelPanelVisibleAtom,
  ticketLinkPanelVisibleAtom,
  usageDashboardPanelVisibleAtom,
  watchModePanelVisibleAtom,
  workspaceAwarenessPanelVisibleAtom,
} from "./panelAtoms";
