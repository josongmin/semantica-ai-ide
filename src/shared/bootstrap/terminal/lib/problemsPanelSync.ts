/**
 * Problems Panel Sync — Phase C
 *
 * Sends terminal diagnostics to the VSCode Problems panel via
 * the extension host message bridge.
 */

import { getVscodeApi } from "~shared/lib/vscodeApi";

import type { DiagnosticEvent } from "../model/types";

/**
 * Sync diagnostics for a given terminal session to the VSCode Problems panel.
 * Each call replaces the previous diagnostics for that session (full sync).
 */
export function syncDiagnosticsToProblems(
  sessionId: string,
  diagnostics: DiagnosticEvent[],
): void {
  const api = getVscodeApi();
  api.postMessage({
    type: "SYNC_DIAGNOSTICS",
    sessionId,
    diagnostics: diagnostics.map((d) => ({
      severity: d.severity,
      file: d.file,
      line: d.line,
      ...(d.column !== undefined && { column: d.column }),
      message: d.message,
      ...(d.source !== undefined && { source: d.source }),
    })),
  });
}
