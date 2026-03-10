/**
 * DataflowOverlay — container wiring atoms to DataflowPanel
 *
 * Reads dataflow-lens atoms and conditionally renders the panel
 * with proper action dispatch.
 */

import { memo, useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { useNavigateToFile } from "~shared/lib";

import {
  clearHighlightAtom,
  closeDataflowAtom,
  dataflowAnalysisAtom,
  dataflowLoadingAtom,
  dataflowVisibleAtom,
  highlightedPathIdAtom,
  highlightPathAtom,
} from "../model/atoms";
import { DataflowPanel, DataflowPanelSkeleton } from "./DataflowPanel";

// ─── Component ──────────────────────────────────────────

export const DataflowOverlay = memo(function DataflowOverlay() {
  const visible = useAtomValue(dataflowVisibleAtom);
  const analysis = useAtomValue(dataflowAnalysisAtom);
  const loading = useAtomValue(dataflowLoadingAtom);
  const highlightedPathId = useAtomValue(highlightedPathIdAtom);

  const close = useSetAtom(closeDataflowAtom);
  const highlightPath = useSetAtom(highlightPathAtom);
  const clearHighlight = useSetAtom(clearHighlightAtom);

  const navigateToFile = useNavigateToFile();

  const handleNodeClick = useCallback(
    (filePath: string, line: number) => {
      navigateToFile(filePath, line);
      close();
    },
    [navigateToFile, close],
  );

  const handleHighlightPath = useCallback(
    (pathId: string) => {
      highlightPath(pathId);
    },
    [highlightPath],
  );

  const handleClearHighlight = useCallback(() => {
    clearHighlight();
  }, [clearHighlight]);

  if (!visible) return null;

  if (loading || !analysis) {
    return <DataflowPanelSkeleton />;
  }

  return (
    <DataflowPanel
      analysis={analysis}
      highlightedPathId={highlightedPathId}
      onClose={close}
      onNodeClick={handleNodeClick}
      onHighlightPath={handleHighlightPath}
      onClearHighlight={handleClearHighlight}
    />
  );
});
