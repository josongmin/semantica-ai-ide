import { useCallback } from "react";
import { useAtom, useAtomValue } from "jotai";

import { sessionMetaAtom } from "~entities/session/state";

import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import type { SessionId } from "../../../shared/protocol";
import { prSummaryContentAtom, prSummaryDialogOpenAtom } from "./prSummaryAtoms";

/**
 * Hook for PR summary generation functionality.
 * Sends GENERATE_PR_SUMMARY message to the extension host and reads back summary state.
 */
export function usePRSummary() {
  const sessionMeta = useAtomValue(sessionMetaAtom);
  const summary = useAtomValue(prSummaryContentAtom);
  const [dialogOpen, setDialogOpen] = useAtom(prSummaryDialogOpenAtom);

  const generateSummary = useCallback((sessionId: SessionId) => {
    getVscodeApi().postMessage({
      type: "GENERATE_PR_SUMMARY",
      session_id: sessionId,
    });
  }, []);

  const openInGitHub = useCallback((sessionId: SessionId) => {
    getVscodeApi().postMessage({
      type: "OPEN_PR_IN_GITHUB",
      session_id: sessionId,
    });
  }, []);

  const openDialog = useCallback(() => {
    setDialogOpen(true);
    // Auto-generate when opening if not already present
    if (!summary) {
      generateSummary(sessionMeta.session_id);
    }
  }, [setDialogOpen, summary, generateSummary, sessionMeta.session_id]);

  const closeDialog = useCallback(() => setDialogOpen(false), [setDialogOpen]);

  return {
    summary,
    dialogOpen,
    openDialog,
    closeDialog,
    generateSummary,
    openInGitHub,
    sessionId: sessionMeta.session_id,
  };
}
