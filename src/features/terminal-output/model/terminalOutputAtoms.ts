import { createPushAtomSet } from "../../../shared/lib";
import { registerResetAtom } from "../../../shared/lib/atoms/resetRegistry";
import type { TerminalChunk } from "../../../shared/protocol";

export const [terminalChunksAtom, appendTerminalChunkAtom, resetTerminalOutputAtom] =
  createPushAtomSet<TerminalChunk>();

registerResetAtom(resetTerminalOutputAtom);
