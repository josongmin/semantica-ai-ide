/**
 * useFEParserFallback — Frontend Output Parser Fallback
 * RFC-TERMINAL-013 §FE-Fallback
 *
 * When the Tauri backend is not available (browser dev mode, VSCode webview),
 * this hook processes raw terminal output through FE-side parsers and
 * injects ParsedTerminalEvents into the Jotai store.
 *
 * Activated automatically when IS_TAURI is false.
 */

import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { activeTerminalSessionIdAtom, appendParsedEventAtom } from "../model/atoms";
import { parseBlock, parseLine } from "./parsers";

/**
 * Provides `processLine` and `processBlock` callbacks that parse raw terminal
 * output through the FE fallback parsers and append recognized events to the
 * terminal parsed-event store.
 *
 * Both callbacks are no-ops when no active session exists.
 */
export function useFEParserFallback() {
  const appendEvent = useSetAtom(appendParsedEventAtom);
  const sessionId = useAtomValue(activeTerminalSessionIdAtom);

  /**
   * Parse a single line of terminal output and, if recognized, append the
   * resulting event to the store.
   */
  const processLine = useCallback(
    (line: string, commandId: string, command: string) => {
      if (!sessionId) return;
      const event = parseLine(line, command, { commandId, sessionId });
      if (event) appendEvent(event);
    },
    [sessionId, appendEvent],
  );

  /**
   * Parse a block of terminal output lines (multi-line context-aware) and
   * append all recognized events to the store.
   */
  const processBlock = useCallback(
    (lines: string[], commandId: string, command: string) => {
      if (!sessionId) return;
      const events = parseBlock(lines, command, { commandId, sessionId });
      for (const event of events) {
        appendEvent(event);
      }
    },
    [sessionId, appendEvent],
  );

  return { processLine, processBlock } as const;
}
