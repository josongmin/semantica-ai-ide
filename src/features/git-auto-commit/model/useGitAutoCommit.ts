import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { autoCommitEnabledAtom, gitCommitsAtom } from "~entities/git-history";

import { gitPanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import type { GitCommit } from "../../../shared/protocol";

/**
 * Provides git auto-commit state and actions to toggle the panel,
 * enable/disable auto-commit and undo the last commit via the extension host.
 */
export function useGitAutoCommit(): {
  commits: readonly GitCommit[];
  autoCommitEnabled: boolean;
  panelVisible: boolean;
  togglePanel: () => void;
  toggleAutoCommit: () => void;
  undoLastCommit: () => void;
} {
  const commits = useAtomValue(gitCommitsAtom);
  const autoCommitEnabled = useAtomValue(autoCommitEnabledAtom);
  const panelVisible = useAtomValue(gitPanelVisibleAtom);
  const setVisible = useSetAtom(gitPanelVisibleAtom);

  const togglePanel = useCallback(() => setVisible((v) => !v), [setVisible]);

  const toggleAutoCommit = useCallback(() => {
    getVscodeApi().postMessage({
      type: "TOGGLE_AUTO_COMMIT",
      enabled: !autoCommitEnabled,
    });
  }, [autoCommitEnabled]);

  const undoLastCommit = useCallback(() => {
    getVscodeApi().postMessage({ type: "GIT_UNDO_COMMIT" });
  }, []);

  return {
    commits,
    autoCommitEnabled,
    panelVisible,
    togglePanel,
    toggleAutoCommit,
    undoLastCommit,
  };
}
