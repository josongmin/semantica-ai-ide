import { useCallback } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { sessionMetaAtom } from "~entities/session/state";

import { getVscodeApi } from "../../../shared/lib/vscodeApi";
import type { ExportFormat, ExportOptions, SessionId } from "../../../shared/protocol";
import {
  exportDialogOpenAtom,
  exportErrorMessageAtom,
  exportFormatAtom,
  exportOptionsAtom,
  exportProgressAtom,
} from "./exportAtoms";

/**
 * Hook for exporting conversations in various formats.
 * Sends export messages to the extension host via vscodeApi.
 */
export function useExport() {
  const sessionMeta = useAtomValue(sessionMetaAtom);
  const progress = useAtomValue(exportProgressAtom);
  const errorMessage = useAtomValue(exportErrorMessageAtom);
  const [dialogOpen, setDialogOpen] = useAtom(exportDialogOpenAtom);
  const [format, setFormat] = useAtom(exportFormatAtom);
  const [options, setOptions] = useAtom(exportOptionsAtom);
  const setProgress = useSetAtom(exportProgressAtom);

  const exportAsHTML = useCallback(
    (sessionId: SessionId, opts?: ExportOptions) => {
      setProgress("exporting");
      getVscodeApi().postMessage({
        type: "EXPORT_HTML",
        session_id: sessionId,
        options: opts ?? options,
      });
    },
    [options, setProgress],
  );

  const exportAsPDF = useCallback(
    (sessionId: SessionId, opts?: ExportOptions) => {
      setProgress("exporting");
      getVscodeApi().postMessage({
        type: "EXPORT_PDF",
        session_id: sessionId,
        options: opts ?? options,
      });
    },
    [options, setProgress],
  );

  const exportAsMarkdown = useCallback(
    (sessionId: SessionId, opts?: ExportOptions) => {
      setProgress("exporting");
      getVscodeApi().postMessage({
        type: "EXPORT_MARKDOWN",
        session_id: sessionId,
        options: opts ?? options,
      });
    },
    [options, setProgress],
  );

  const exportSession = useCallback(
    (sessionId: SessionId, fmt: ExportFormat, opts?: ExportOptions) => {
      const resolvedOpts = opts ?? options;
      switch (fmt) {
        case "html":
          exportAsHTML(sessionId, resolvedOpts);
          break;
        case "pdf":
          exportAsPDF(sessionId, resolvedOpts);
          break;
        case "markdown":
          exportAsMarkdown(sessionId, resolvedOpts);
          break;
      }
    },
    [exportAsHTML, exportAsPDF, exportAsMarkdown, options],
  );

  const openDialog = useCallback(() => setDialogOpen(true), [setDialogOpen]);
  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setProgress("idle");
  }, [setDialogOpen, setProgress]);

  const updateOption = useCallback(
    (key: keyof ExportOptions, value: boolean) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    [setOptions],
  );

  return {
    // State
    progress,
    errorMessage,
    dialogOpen,
    format,
    options,
    sessionId: sessionMeta.session_id,
    // Actions
    exportAsHTML,
    exportAsPDF,
    exportAsMarkdown,
    exportSession,
    openDialog,
    closeDialog,
    setFormat,
    updateOption,
  };
}
