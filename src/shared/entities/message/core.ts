/**
 * Core message read atoms — for streaming & rendering consumers.
 *
 * Import from here when you only need message-level reads,
 * e.g. `import { messageAtomFamily, messageOrderAtom } from "@/entities/message/core";`
 */
export {
  appendTextAtom,
  effectiveAgentRoleForMessageAtomFamily,
  messageAtomFamily,
  messageOrderAtom,
} from "./model/coreAtoms";
export type { MessageId, MessageStatus, UiMessage } from "./model/types";
