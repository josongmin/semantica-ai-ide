import { useCallback, useMemo, useState } from "react";
import type { Virtualizer } from "@tanstack/react-virtual";

import type { DiffLine } from "../../shared/lib/parseDiffLines";
import type { VisibleItem } from "./DiffViewer";

interface UseDiffHunkNavigationOptions {
  lines: readonly DiffLine[];
  visibleItems: VisibleItem[];
  virtualizer: Virtualizer<HTMLDivElement, Element>;
}

/**
 * Encapsulates hunk-based navigation logic for the inline diff viewer.
 * Tracks the current hunk index and provides prev/next scrolling.
 */
export function useDiffHunkNavigation({
  lines,
  visibleItems,
  virtualizer,
}: UseDiffHunkNavigationOptions) {
  const [currentHunk, setCurrentHunk] = useState(0);

  // Map from original line index to virtual row index (for hunk navigation)
  const lineToVirtualIndex = useMemo(() => {
    const map = new Map<number, number>();
    for (let vi = 0; vi < visibleItems.length; vi++) {
      const item = visibleItems[vi];
      if (item?.kind === "line") {
        map.set(item.lineIndex, vi);
      }
    }
    return map;
  }, [visibleItems]);

  // First hunk starting line (for "open in editor" with line)
  const firstHunkLine = useMemo(() => {
    const header = lines.find((l) => l.type === "header");
    if (!header) return undefined;
    const m = /@@ -\d+(?:,\d+)? \+(\d+)/.exec(header.content);
    return m ? parseInt(m[1] ?? "0", 10) : undefined;
  }, [lines]);

  // Hunk indices for navigation
  const hunkStartIndices = useMemo(
    () =>
      lines.reduce<number[]>((acc, line, idx) => {
        if (line.type === "header") acc.push(idx);
        return acc;
      }, []),
    [lines],
  );

  const totalHunks = hunkStartIndices.length;

  const scrollToHunk = useCallback(
    (hunkIdx: number) => {
      const lineIdx = hunkStartIndices[hunkIdx];
      if (lineIdx === undefined) return;
      const virtualIdx = lineToVirtualIndex.get(lineIdx);
      if (virtualIdx !== undefined) {
        virtualizer.scrollToIndex(virtualIdx, { align: "center", behavior: "smooth" });
      }
      setCurrentHunk(hunkIdx);
    },
    [hunkStartIndices, lineToVirtualIndex, virtualizer],
  );

  const goNextHunk = useCallback(() => {
    const next = Math.min(currentHunk + 1, totalHunks - 1);
    scrollToHunk(next);
  }, [currentHunk, totalHunks, scrollToHunk]);

  const goPrevHunk = useCallback(() => {
    const prev = Math.max(currentHunk - 1, 0);
    scrollToHunk(prev);
  }, [currentHunk, scrollToHunk]);

  return {
    currentHunk,
    totalHunks,
    firstHunkLine,
    goNextHunk,
    goPrevHunk,
  };
}
