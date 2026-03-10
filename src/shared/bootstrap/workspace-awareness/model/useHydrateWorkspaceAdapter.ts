/**
 * Hydrate hook that populates the workspace-awareness adapter atom.
 * Called once at bootstrap time from StreamingBootstrap.
 */
import { useEffect, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  type WorkspaceAwarenessAdapter,
  workspaceAwarenessAdapterAtom,
} from "~shared/lib/atoms/workspaceAdapterAtoms";

import {
  allWorkspaceFileChangesAtom,
  filteredWorkspaceFileGroupsAtom,
  inferLanguage,
  workspaceFileGroupsAtom,
  workspaceFileTotalCountAtom,
  workspaceTurnIdsAtom,
} from "./workspaceAwarenessAtoms";

export function useHydrateWorkspaceAdapter(): void {
  const allFileChanges = useAtomValue(allWorkspaceFileChangesAtom);
  const filteredGroups = useAtomValue(filteredWorkspaceFileGroupsAtom);
  const groups = useAtomValue(workspaceFileGroupsAtom);
  const totalCount = useAtomValue(workspaceFileTotalCountAtom);
  const turnIds = useAtomValue(workspaceTurnIdsAtom);
  const setAdapter = useSetAtom(workspaceAwarenessAdapterAtom);

  const adapter: WorkspaceAwarenessAdapter = useMemo(
    () => ({
      allFileChanges,
      filteredGroups,
      groups,
      totalCount,
      turnIds,
      inferLanguage,
    }),
    [allFileChanges, filteredGroups, groups, totalCount, turnIds],
  );

  useEffect(() => {
    setAdapter(adapter);
  }, [setAdapter, adapter]);
}
