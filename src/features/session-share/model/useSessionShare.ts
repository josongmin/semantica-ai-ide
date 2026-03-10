import { useCallback } from "react";
import { useAtom, useAtomValue } from "jotai";

import { sessionMetaAtom } from "~entities/session/state";

import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import type { SessionId } from "../../../shared/protocol";
import { shareDialogOpenAtom, shareLinksAtom } from "./sessionShareAtoms";

export interface ShareSessionOptions {
  expires_in_hours?: number;
  mask_secrets?: boolean;
}

/**
 * Hook for session sharing functionality.
 * Sends SHARE_SESSION message to the extension host and reads back share link state.
 */
export function useSessionShare() {
  const sessionMeta = useAtomValue(sessionMetaAtom);
  const shareLinks = useAtomValue(shareLinksAtom);
  const [dialogOpen, setDialogOpen] = useAtom(shareDialogOpenAtom);

  const currentLink = shareLinks.get(sessionMeta.session_id) ?? null;

  const shareSession = useCallback((sessionId: SessionId, options: ShareSessionOptions = {}) => {
    getVscodeApi().postMessage({
      type: "SHARE_SESSION",
      session_id: sessionId,
      options: {
        expires_in_hours: options.expires_in_hours,
        mask_secrets: options.mask_secrets ?? true,
      },
    });
  }, []);

  const openDialog = useCallback(() => setDialogOpen(true), [setDialogOpen]);
  const closeDialog = useCallback(() => setDialogOpen(false), [setDialogOpen]);

  return {
    shareSession,
    dialogOpen,
    openDialog,
    closeDialog,
    currentLink,
    shareLinks,
    sessionId: sessionMeta.session_id,
  };
}
