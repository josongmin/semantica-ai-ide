import { atom } from "jotai";

import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { RemoteCommand, RemoteConnectionStatus } from "../../../shared/protocol";

// ─── Remote Control Atoms ──────────────────────────────────

/** Maximum number of remote commands to retain in memory */
export const MAX_REMOTE_COMMANDS = 20;

/** Current remote connection status */
export const remoteStatusAtom = atom<RemoteConnectionStatus>("disconnected");

/** QR code data URL for pairing (null when not waiting) */
export const remoteQrCodeAtom = atom<string | null>(null);

/** Ordered list of received remote commands (newest first) */
export const remoteCommandsAtom = atom<readonly RemoteCommand[]>([]);

/** Write-only: set connection status and optional QR code. Clears QR code on disconnect. */
export const setRemoteStatusAtom = atom(
  null,
  (_get, set, payload: { status: RemoteConnectionStatus; qr_code_data_url?: string }) => {
    set(remoteStatusAtom, payload.status);
    if (payload.qr_code_data_url !== undefined) {
      set(remoteQrCodeAtom, payload.qr_code_data_url);
    } else if (payload.status === "disconnected") {
      set(remoteQrCodeAtom, null);
    }
  },
);

/** Write-only: prepend a new command to the list, capped at MAX_REMOTE_COMMANDS. Deduplicates by id. */
export const pushRemoteCommandAtom = atom(null, (get, set, command: RemoteCommand) => {
  const commands = get(remoteCommandsAtom);
  if (commands.some((c) => c.id === command.id)) return;
  const next = [command, ...commands];
  set(
    remoteCommandsAtom,
    next.length > MAX_REMOTE_COMMANDS ? next.slice(0, MAX_REMOTE_COMMANDS) : next,
  );
});

/** Write-only: reset all remote control state */
export const resetRemoteStoreAtom = atom(null, (_get, set) => {
  set(remoteStatusAtom, "disconnected");
  set(remoteQrCodeAtom, null);
  set(remoteCommandsAtom, []);
});

registerResetAtom(resetRemoteStoreAtom);
