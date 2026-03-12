/**
 * useTerminalIntentDispatch — RFC-TERMINAL-017 §5.2
 *
 * Typed dispatch functions for terminal cross-surface intents.
 * Wires ParsedDecorations clicks and BlockActions to the intent router.
 */

import { useCallback, useMemo } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { dispatchIntentAtom } from "~app/shell/model/intentRouter";
import type { TerminalSessionId } from "~shared/protocol/types/core";

import {
  activeTerminalSessionAtom,
  activeTerminalSessionIdAtom,
  terminalParsedEventMapAtom,
} from "../model/atoms";
import type {
  AskAgentPayload,
  OpenFilePayload,
  TerminalBlockAttachment,
} from "../model/intentTypes";
import type {
  DiagnosticEvent,
  FileLinkEvent,
  ParsedTerminalEvent,
  SummaryEvent,
  TerminalCommand,
  TestResultEvent,
  UrlEvent,
} from "../model/types";
import { resolveFilePath } from "./resolveFilePath";

// ─── Intent Bus (module-level event emitter) ─────────────

type IntentHandler = (type: string, payload: unknown) => void;
let intentHandler: IntentHandler | null = null;

/** Register a global intent handler (called by the shell-level intent router) */
export function registerTerminalIntentHandler(handler: IntentHandler): () => void {
  intentHandler = handler;
  return () => {
    if (intentHandler === handler) intentHandler = null;
  };
}

function dispatchIntent(type: string, payload: unknown) {
  if (intentHandler) {
    intentHandler(type, payload);
  }
}

// ─── Block Attachment Builder ────────────────────────────

function buildBlockAttachment(
  command: TerminalCommand,
  parsedEvents: ParsedTerminalEvent[],
): TerminalBlockAttachment {
  const diagnostics: DiagnosticEvent[] = [];
  const testResults: TestResultEvent[] = [];
  let summary: SummaryEvent | undefined;

  for (const event of parsedEvents) {
    if (event.commandId !== command.commandId) continue;
    switch (event.kind) {
      case "diagnostic":
        diagnostics.push(event.data as DiagnosticEvent);
        break;
      case "test-result":
        testResults.push(event.data as TestResultEvent);
        break;
      case "summary":
        summary = event.data as SummaryEvent;
        break;
      case "progress":
      case "url":
      case "file-link":
      case "port-binding":
      case "task-lifecycle":
        // Not relevant for attachment
        break;
    }
  }

  return {
    blockId: command.commandId,
    sessionId: command.sessionId,
    command: command.command,
    status: command.status,
    exitCode: command.exitCode,
    duration: command.duration,
    diagnostics,
    testResults,
    outputPreview: "", // filled by caller if needed
    summary,
  };
}

function generateAutoMessage(
  attachment: TerminalBlockAttachment,
  intent: "explain" | "fix" | "debug",
): string {
  switch (intent) {
    case "fix":
      return `\`${attachment.command}\` 실행이 실패했습니다 (exit ${attachment.exitCode ?? "?"}). ${attachment.diagnostics.length}개 에러를 수정해주세요.`;
    case "explain":
      return `\`${attachment.command}\` 출력을 설명해주세요.`;
    case "debug":
      return `\`${attachment.command}\`이 예상과 다른 결과를 보여줍니다. 디버깅해주세요.`;
  }
}

// ─── Hook ────────────────────────────────────────────────

export function useTerminalIntentDispatch() {
  const session = useAtomValue(activeTerminalSessionAtom);
  const parsedEventMap = useAtomValue(terminalParsedEventMapAtom);
  const dispatch = useSetAtom(dispatchIntentAtom);
  const setActiveSessionId = useSetAtom(activeTerminalSessionIdAtom);

  const sessionId = session?.sessionId ?? "";
  const parsedEvents = useMemo(
    () => parsedEventMap.get(sessionId) ?? [],
    [parsedEventMap, sessionId],
  );

  const cwd = session?.cwd ?? "";

  const openFile = useCallback(
    (link: FileLinkEvent) => {
      const resolved = resolveFilePath(link.file, cwd);
      const payload: OpenFilePayload = {
        file: resolved,
        line: link.line,
        column: link.column,
        revealMode: "focus",
      };
      dispatchIntent("open-file", payload);
    },
    [cwd],
  );

  const openDiagnostic = useCallback(
    (diag: DiagnosticEvent) => {
      const resolved = resolveFilePath(diag.file, cwd);
      const payload: OpenFilePayload = {
        file: resolved,
        line: diag.line,
        column: diag.column,
        revealMode: "focus",
        inlineHint: {
          severity: diag.severity,
          message: diag.message,
        },
      };
      dispatchIntent("open-file", payload);
    },
    [cwd],
  );

  const openUrl = useCallback((urlEvent: UrlEvent) => {
    window.open(urlEvent.url, "_blank", "noopener,noreferrer");
  }, []);

  const askAgent = useCallback(
    (command: TerminalCommand, intent: "explain" | "fix" | "debug") => {
      const attachment = buildBlockAttachment(command, parsedEvents);
      const payload: AskAgentPayload = {
        attachment,
        intent,
        autoMessage: generateAutoMessage(attachment, intent),
      };
      dispatchIntent("ask-agent", payload);

      // Also activate agent panel
      dispatch({ action: "show-frame", frame: "dock-right" });
    },
    [parsedEvents, dispatch],
  );

  const openProblems = useCallback(
    (command: TerminalCommand, diagnostics: DiagnosticEvent[]) => {
      dispatchIntent("open-problems", {
        filter: { sessionId, commandId: command.commandId },
        diagnostics,
      });
      dispatch({ action: "show-view", viewId: "problems" });
    },
    [sessionId, dispatch],
  );

  const revealTerminal = useCallback(
    (targetSessionId: string, commandId: string) => {
      setActiveSessionId(targetSessionId as TerminalSessionId);
      dispatch({ action: "show-view", viewId: "terminal" });
      dispatchIntent("reveal-terminal", {
        sessionId: targetSessionId,
        commandId,
        scrollTo: true,
      });
    },
    [setActiveSessionId, dispatch],
  );

  /** Dispatch ##ai inline query to agent (no TerminalCommand needed) */
  const dispatchAIQuery = useCallback(
    (
      _aiIntent: "ask" | "fix" | "explain",
      query: string,
      agentIntent: AskAgentPayload["intent"],
    ) => {
      const attachment: TerminalBlockAttachment = {
        blockId: `ai_${Date.now()}`,
        sessionId,
        command: query,
        status: "succeeded",
        diagnostics: [],
        testResults: [],
        outputPreview: "",
      };
      const payload: AskAgentPayload = {
        attachment,
        intent: agentIntent,
        customMessage: query,
        autoMessage: query,
      };
      dispatchIntent("ask-agent", payload);
      dispatch({ action: "show-frame", frame: "dock-right" });
    },
    [sessionId, dispatch],
  );

  return useMemo(
    () => ({
      openFile,
      openDiagnostic,
      openUrl,
      askAgent,
      openProblems,
      revealTerminal,
      dispatchAIQuery,
    }),
    [openFile, openDiagnostic, openUrl, askAgent, openProblems, revealTerminal, dispatchAIQuery],
  );
}
