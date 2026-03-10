import { useEffect } from "react";
import { useSetAtom } from "jotai";

import { isAllowedOrigin } from "~shared/lib";
import type {
  TerminalAgentAction,
  TerminalOutput,
  TerminalSession,
} from "~shared/protocol";

import {
  appendTerminalOutputAtom,
  terminalSessionsAtom,
  upsertTerminalActionAtom,
} from "../../../../entities/terminal-bridge";

/**
 * Sync terminal bridge messages from extension host.
 */
export function useTerminalBridgeSync() {
  const appendOutput = useSetAtom(appendTerminalOutputAtom);
  const setSessions = useSetAtom(terminalSessionsAtom);
  const upsertAction = useSetAtom(upsertTerminalActionAtom);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!isAllowedOrigin(e.origin)) return;
      const msg = e.data as { type?: string; payload?: unknown } | null;
      if (!msg || typeof msg.type !== "string") return;

      switch (msg.type) {
        case "terminal/output":
          if (msg.payload != null) appendOutput(msg.payload as TerminalOutput);
          break;
        case "terminal/sessions":
          if (Array.isArray(msg.payload)) setSessions(msg.payload as readonly TerminalSession[]);
          break;
        case "terminal/action":
          if (msg.payload != null) upsertAction(msg.payload as TerminalAgentAction);
          break;
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [appendOutput, setSessions, upsertAction]);
}
