/**
 * useTerminalIntentReceiver — RFC-TERMINAL-017 §6
 *
 * Registers shell-level handlers that receive terminal intents
 * and route them to the appropriate surfaces:
 *   - open-file      → EditorSurface (openFileInEditorAtom)
 *   - ask-agent      → Agent panel (terminalAgentAttachmentAtom)
 *   - open-problems  → Problems panel (layout already handled by dispatch)
 *   - reveal-terminal→ Terminal panel (scrollToCommand via blockNav)
 *
 * Mount this hook once at the shell level (e.g., ShellLayout).
 */

import { useEffect } from "react";
import { useSetAtom } from "jotai";

import { terminalAgentAttachmentAtom } from "../model/agentBridgeAtoms";
import type { AskAgentPayload, OpenFilePayload } from "../model/intentTypes";
import { registerTerminalIntentHandler } from "./useTerminalIntentDispatch";

import { openFileInEditorAtom } from "~domains/editor/editorAtoms";

export function useTerminalIntentReceiver() {
  const openFile = useSetAtom(openFileInEditorAtom);
  const setAgentAttachment = useSetAtom(terminalAgentAttachmentAtom);

  useEffect(() => {
    const unregister = registerTerminalIntentHandler((type, payload) => {
      switch (type) {
        case "open-file": {
          const p = payload as OpenFilePayload;
          openFile(p.file);
          break;
        }
        case "ask-agent": {
          const p = payload as AskAgentPayload;
          setAgentAttachment(p);
          break;
        }
        // open-problems: layout switch already handled by dispatch (setBottomPanel)
        // reveal-terminal: session switch + scroll already handled by dispatch
        default:
          break;
      }
    });

    return unregister;
  }, [openFile, setAgentAttachment]);
}
