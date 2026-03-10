/**
 * LensOverlay — container wiring atoms to hover card + mini graph
 *
 * Reads system-lens atoms and conditionally renders LensHoverCard
 * and LensMiniGraph with proper action dispatch.
 */

import { memo, useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  clearLensHoverAtom,
  closeMiniGraphAtom,
  lensDetailDataAtom,
  lensDetailLoadingAtom,
  lensHoverTargetAtom,
  lensMiniGraphCenterAtom,
  lensMiniGraphVisibleAtom,
  openMiniGraphAtom,
} from "../model/atoms";
import { LensHoverCard } from "./LensHoverCard";
import { LensMiniGraph } from "./LensMiniGraph";

// ─── Component ───────────────────────────────────────────

export const LensOverlay = memo(function LensOverlay() {
  const hoverTarget = useAtomValue(lensHoverTargetAtom);
  const detail = useAtomValue(lensDetailDataAtom);
  const loading = useAtomValue(lensDetailLoadingAtom);
  const miniGraphVisible = useAtomValue(lensMiniGraphVisibleAtom);
  const miniGraphCenter = useAtomValue(lensMiniGraphCenterAtom);

  const clearHover = useSetAtom(clearLensHoverAtom);
  const openMiniGraph = useSetAtom(openMiniGraphAtom);
  const closeMiniGraph = useSetAtom(closeMiniGraphAtom);

  const handleAction = useCallback(
    (action: "graph" | "dataflow" | "impact" | "explain") => {
      if (action === "graph" && detail) {
        openMiniGraph(detail.symbolId);
      }
      // dataflow, impact, explain — future dispatch points
    },
    [detail, openMiniGraph],
  );

  const handleNodeClick = useCallback(
    (_filePath: string, _line: number) => {
      // Future: navigate to file:line in editor
      clearHover();
    },
    [clearHover],
  );

  const handleClose = useCallback(() => {
    clearHover();
  }, [clearHover]);

  // Determine which detail to show in the mini graph
  const miniGraphDetail =
    miniGraphVisible && miniGraphCenter && detail?.symbolId === miniGraphCenter
      ? detail
      : null;

  return (
    <>
      {/* Hover Card */}
      {hoverTarget && detail && (
        <LensHoverCard
          detail={detail}
          loading={loading}
          position={hoverTarget.position}
          onClose={handleClose}
          onAction={handleAction}
          onNodeClick={handleNodeClick}
        />
      )}

      {/* Mini Graph */}
      {miniGraphDetail && (
        <LensMiniGraph
          detail={miniGraphDetail}
          onNodeClick={handleNodeClick}
          onClose={closeMiniGraph}
        />
      )}
    </>
  );
});
