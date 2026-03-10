import { useCallback } from "react";
import { useAtom, useAtomValue } from "jotai";

import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import type { ConfigChoice } from "../../../shared/protocol";
import {
  teamConfigDialogOpenAtom,
  teamConfigDiffCountAtom,
  teamConfigDifferencesAtom,
  teamConfigItemsAtom,
} from "./teamConfigAtoms";

/**
 * Hook for team configuration sync functionality.
 * Provides actions to sync, compare, and resolve config differences.
 */
export function useTeamConfigSync() {
  const items = useAtomValue(teamConfigItemsAtom);
  const differences = useAtomValue(teamConfigDifferencesAtom);
  const diffCount = useAtomValue(teamConfigDiffCountAtom);
  const [dialogOpen, setDialogOpen] = useAtom(teamConfigDialogOpenAtom);

  const openDialog = useCallback(() => setDialogOpen(true), [setDialogOpen]);
  const closeDialog = useCallback(() => setDialogOpen(false), [setDialogOpen]);

  /** Request the extension host to sync team config */
  const syncConfig = useCallback(() => {
    getVscodeApi().postMessage({ type: "SYNC_TEAM_CONFIG" });
  }, []);

  /** Apply a choice (local/team/merge) for a single config key */
  const applyChoice = useCallback((key: string, choice: ConfigChoice) => {
    getVscodeApi().postMessage({
      type: "APPLY_CONFIG_CHOICE",
      key,
      choice,
    });
  }, []);

  /** Accept all team values for differing config items */
  const acceptAllTeam = useCallback(() => {
    for (const item of differences) {
      getVscodeApi().postMessage({
        type: "APPLY_CONFIG_CHOICE",
        key: item.key,
        choice: "team",
      });
    }
  }, [differences]);

  /** Keep all local values for differing config items */
  const keepAllLocal = useCallback(() => {
    for (const item of differences) {
      getVscodeApi().postMessage({
        type: "APPLY_CONFIG_CHOICE",
        key: item.key,
        choice: "local",
      });
    }
  }, [differences]);

  return {
    // State
    items,
    differences,
    diffCount,
    dialogOpen,
    // Actions
    openDialog,
    closeDialog,
    syncConfig,
    applyChoice,
    acceptAllTeam,
    keepAllLocal,
  };
}
