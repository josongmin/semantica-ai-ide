import { useCallback, useEffect, useMemo, useRef } from "react";
import { type createStore, useSetAtom, useStore } from "jotai";

import { turnOrderAtom } from "~entities/message/turns";
import {
  completionSettingsOpenAtom,
  currentPageAtom,
  type ExtensionHostMessage,
  getVscodeApi,
} from "~shared/lib";
import { demoModalOpenAtom } from "~shared/lib/atoms/dialogAtoms";
import {
  agentsPanelVisibleAtom,
  gitPanelVisibleAtom,
  mcpPanelVisibleAtom,
  memoryPanelVisibleAtom,
  remotePanelVisibleAtom,
  searchPanelVisibleAtom,
} from "~shared/lib/atoms/sidebarPanelAtoms";

import type { SlashCommandDef } from "./types";

type Store = ReturnType<typeof createStore>;
type CommandHandler = (callbacks: CommandCallbacks, store: Store) => void;

/** Static map from command id → extension host message. Easy to extend without touching control flow. */
const EXECUTE_COMMAND_MAP: Readonly<Record<string, ExtensionHostMessage>> = {
  new: { type: "NEW_SESSION" },
  clear: { type: "CLEAR_CONVERSATION" },
  export: { type: "EXPORT_SESSION", format: "markdown" },
  undo: { type: "UNDO" },
  redo: { type: "REDO" },
  approve: { type: "APPROVE_ALL" },
  context: { type: "SHOW_CONTEXT" },
  settings: { type: "OPEN_SETTINGS" },
  help: { type: "SHOW_HELP" },
  rules: { type: "LOAD_AGENT_RULES" },
};

interface CommandCallbacks {
  onSendMessage?: (text: string) => void;
  onClearText?: () => void;
  onGetText?: () => string;
}

/**
 * Maps command definitions to concrete execution handlers.
 * Returns an execute function that dispatches based on command action type.
 */
export function useCommandExecution(callbacks?: CommandCallbacks) {
  const setCurrentPage = useSetAtom(currentPageAtom);
  const setCompletionOpen = useSetAtom(completionSettingsOpenAtom);
  const setDemoModalOpen = useSetAtom(demoModalOpenAtom);
  const setAgentsPanel = useSetAtom(agentsPanelVisibleAtom);
  const setSearchPanel = useSetAtom(searchPanelVisibleAtom);
  const setMcpPanel = useSetAtom(mcpPanelVisibleAtom);
  const setMemoryPanel = useSetAtom(memoryPanelVisibleAtom);
  const setGitPanel = useSetAtom(gitPanelVisibleAtom);
  const setRemotePanel = useSetAtom(remotePanelVisibleAtom);
  const store = useStore();

  // Use ref to avoid including the unstable callbacks object in the dependency array.
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  /** Registry map: command id → handler. Built inside the hook so setters are captured by closure. */
  const COMMAND_HANDLERS: Record<string, CommandHandler> = useMemo(
    () => ({
      completion: () => setCompletionOpen(true),
      replay: (_cb, s) => {
        const turns = s.get(turnOrderAtom);
        const lastTurnId = turns[turns.length - 1] ?? "";
        getVscodeApi().postMessage({ type: "START_REPLAY", turn_id: lastTurnId });
      },
      debate: (cb) => {
        const text = cb.onGetText?.() ?? "";
        getVscodeApi().postMessage({
          type: "START_DEBATE",
          prompt: text,
          model_ids: ["claude-sonnet-4-6", "claude-haiku-4-5"],
        });
      },
      smartctx: (cb) => {
        const text = cb.onGetText?.() ?? "";
        getVscodeApi().postMessage({ type: "REQUEST_AUTO_CONTEXT", prompt_text: text });
      },
      speculate: (cb) => {
        const text = cb.onGetText?.() ?? "";
        getVscodeApi().postMessage({ type: "REQUEST_SPECULATIVE_EDIT", prompt_text: text });
      },
      background: (cb) => {
        const text = cb.onGetText?.() ?? "Background Task";
        getVscodeApi().postMessage({
          type: "LAUNCH_BACKGROUND_JOB",
          label: text,
          prompt: text,
          cloud: false,
        });
      },
      demo: () => setDemoModalOpen(true),
      agents: () => setAgentsPanel((v) => !v),
      index: () => setSearchPanel((v) => !v),
      mcp: () => setMcpPanel((v) => !v),
      memory: () => setMemoryPanel((v) => !v),
      gitlog: () => setGitPanel((v) => !v),
      remote: () => setRemotePanel((v) => !v),
    }),
    [
      setCompletionOpen,
      setDemoModalOpen,
      setAgentsPanel,
      setSearchPanel,
      setMcpPanel,
      setMemoryPanel,
      setGitPanel,
      setRemotePanel,
    ],
  );

  const execute = useCallback(
    (command: SlashCommandDef) => {
      const cbs = callbacksRef.current;
      switch (command.action.type) {
        case "execute": {
          const handler = COMMAND_HANDLERS[command.id];
          if (handler) {
            handler(cbs ?? {}, store);
          } else {
            const msg = EXECUTE_COMMAND_MAP[command.id];
            if (msg) getVscodeApi().postMessage(msg);
          }
          cbs?.onClearText?.();
          break;
        }
        case "send_message": {
          cbs?.onSendMessage?.(command.action.text);
          cbs?.onClearText?.();
          break;
        }
        case "navigate": {
          setCurrentPage(command.action.page);
          cbs?.onClearText?.();
          break;
        }
        case "open_sub_panel": {
          getVscodeApi().postMessage({ type: "OPEN_SUB_PANEL", panelId: command.action.panelId });
          cbs?.onClearText?.();
          break;
        }
      }
    },
    [COMMAND_HANDLERS, setCurrentPage, store],
  );

  return { execute };
}
