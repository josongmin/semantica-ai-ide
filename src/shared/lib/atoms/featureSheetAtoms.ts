import { atom, type WritableAtom } from "jotai";

import { activityFeedVisibleAtom } from "./dialogAtoms";
import {
  agentsPanelVisibleAtom,
  backgroundJobsPanelVisibleAtom,
  bgAgentsPanelVisibleAtom,
  compactionPanelVisibleAtom,
  deepWikiPanelVisibleAtom,
  gitPanelVisibleAtom,
  graphPanelVisibleAtom,
  intentPanelVisibleAtom,
  livePreviewPanelVisibleAtom,
  missionControlPanelVisibleAtom,
  pipelineGlobalVisibleAtom,
  resourcesPanelVisibleAtom,
  scratchpadPanelVisibleAtom,
  searchPanelVisibleAtom,
  snapshotsPanelVisibleAtom,
  teamPanelVisibleAtom,
  terminalPanelVisibleAtom,
  workspaceAwarenessPanelVisibleAtom,
} from "./panelAtoms";
import { reviewChangesPanelVisibleAtom } from "./reviewPanelAtoms";

/**
 * Active feature sheet identifier — only one BottomSheet open at a time.
 * null = all closed. Value matches FeatureBar button key.
 */
export type FeatureSheetId =
  | "agents"
  | "search"
  | "git"
  | "compact"
  | "wiki"
  | "preview"
  | "snapshots"
  | "notes"
  | "graph"
  | "bg-agents"
  | "intent"
  | "terminal"
  | "team"
  | "resources"
  | "mission"
  | "pipeline"
  | "review"
  | "jobs"
  | "workspace"
  | "activity"
  | null;

export const activeFeatureSheetAtom = atom<FeatureSheetId>(null);

/** Toggle a feature sheet — mutex: opening one closes others */
export const toggleFeatureSheetAtom: WritableAtom<null, [FeatureSheetId], void> = atom(
  null,
  (get, set, sheetId: FeatureSheetId) => {
    const current = get(activeFeatureSheetAtom);
    const next = current === sheetId ? null : sheetId;
    set(activeFeatureSheetAtom, next);

    // Sync individual panel visibility atoms for backward-compat
    const mapping: Record<string, WritableAtom<boolean, [boolean], void>> = {
      agents: agentsPanelVisibleAtom,
      search: searchPanelVisibleAtom,
      git: gitPanelVisibleAtom,
      compact: compactionPanelVisibleAtom,
      wiki: deepWikiPanelVisibleAtom,
      preview: livePreviewPanelVisibleAtom,
      snapshots: snapshotsPanelVisibleAtom,
      notes: scratchpadPanelVisibleAtom,
      graph: graphPanelVisibleAtom,
      "bg-agents": bgAgentsPanelVisibleAtom,
      intent: intentPanelVisibleAtom,
      terminal: terminalPanelVisibleAtom,
      team: teamPanelVisibleAtom,
      resources: resourcesPanelVisibleAtom,
      mission: missionControlPanelVisibleAtom,
      pipeline: pipelineGlobalVisibleAtom,
      review: reviewChangesPanelVisibleAtom,
      jobs: backgroundJobsPanelVisibleAtom,
      workspace: workspaceAwarenessPanelVisibleAtom,
      activity: activityFeedVisibleAtom,
    };
    for (const [key, panelAtom] of Object.entries(mapping)) {
      set(panelAtom, key === next);
    }
  },
);
