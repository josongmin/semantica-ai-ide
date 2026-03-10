/**
 * useTerminalProblemsSync — Phase C
 *
 * Subscribes to `terminalParsedEventMapAtom` and automatically syncs
 * diagnostics to the VSCode Problems panel whenever they change for
 * the active terminal session.
 */

import { useEffect, useRef } from "react";
import { useAtomValue } from "jotai";

import { activeTerminalSessionIdAtom, terminalParsedEventMapAtom } from "../model/atoms";
import type { DiagnosticEvent } from "../model/types";
import { syncDiagnosticsToProblems } from "./problemsPanelSync";

/**
 * Hook that watches parsed events for the active session and pushes
 * diagnostic changes to the VSCode Problems panel.
 *
 * Mount this once in the terminal panel root (e.g., `OverlayRoot` or `TerminalPanel`).
 */
export function useTerminalProblemsSync(): void {
  const activeSessionId = useAtomValue(activeTerminalSessionIdAtom);
  const parsedEventMap = useAtomValue(terminalParsedEventMapAtom);
  const prevDigestRef = useRef<string>("");

  useEffect(() => {
    if (!activeSessionId) return;

    const events = parsedEventMap.get(activeSessionId) ?? [];
    const diagnostics = events
      .filter((e) => e.kind === "diagnostic")
      .map((e) => e.data as DiagnosticEvent);

    // Simple digest to avoid re-syncing identical diagnostics
    const lastDiag = diagnostics.length > 0 ? diagnostics[diagnostics.length - 1] : null;
    const digest = `${activeSessionId}:${diagnostics.length}:${lastDiag?.message ?? ""}`;

    if (digest === prevDigestRef.current) return;
    prevDigestRef.current = digest;

    syncDiagnosticsToProblems(activeSessionId, diagnostics);
  }, [activeSessionId, parsedEventMap]);
}
