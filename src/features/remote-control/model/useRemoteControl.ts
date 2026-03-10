import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  remoteCommandsAtom,
  remoteQrCodeAtom,
  remoteStatusAtom,
} from "../../../entities/remote-control";
import { remotePanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import type { RemoteCommand, RemoteConnectionStatus } from "../../../shared/protocol";

/**
 * Provides remote-control panel state and actions to show QR code
 * pairing and disconnect the remote session via the extension host.
 */
export function useRemoteControl(): {
  status: RemoteConnectionStatus;
  qrCodeDataUrl: string | null;
  commands: readonly RemoteCommand[];
  panelVisible: boolean;
  togglePanel: () => void;
  requestQr: () => void;
  disconnect: () => void;
} {
  const status = useAtomValue(remoteStatusAtom);
  const qrCodeDataUrl = useAtomValue(remoteQrCodeAtom);
  const commands = useAtomValue(remoteCommandsAtom);
  const panelVisible = useAtomValue(remotePanelVisibleAtom);
  const setVisible = useSetAtom(remotePanelVisibleAtom);

  const togglePanel = useCallback(() => setVisible((v) => !v), [setVisible]);

  const requestQr = useCallback(() => {
    getVscodeApi().postMessage({ type: "REQUEST_REMOTE_QR" });
  }, []);

  const disconnect = useCallback(() => {
    getVscodeApi().postMessage({ type: "DISCONNECT_REMOTE" });
  }, []);

  return { status, qrCodeDataUrl, commands, panelVisible, togglePanel, requestQr, disconnect };
}
