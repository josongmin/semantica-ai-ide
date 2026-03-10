// Types (re-exported from shared/protocol)
export type { RemoteCommand, RemoteCommandId, RemoteConnectionStatus } from "./model/types";

// Atoms (entity-owned state)
export {
  pushRemoteCommandAtom,
  remoteCommandsAtom,
  remoteQrCodeAtom,
  remoteStatusAtom,
  resetRemoteStoreAtom,
  setRemoteStatusAtom,
} from "./model/atoms";
