import { createPushAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { ExternalFileChange } from "../../../shared/protocol";

export const [externalChangesAtom, pushExternalChangeAtom, resetFileWatchAtom] =
  createPushAtomSet<ExternalFileChange>();

registerResetAtom(resetFileWatchAtom);
