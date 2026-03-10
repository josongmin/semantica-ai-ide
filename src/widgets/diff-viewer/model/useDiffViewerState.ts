import { useCallback, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";

import { diffViewModeAtom } from "../../../shared/lib";
import {
  buildHiddenSet,
  findCollapsibleGroups,
  parseDiffLines,
} from "../parseDiffLines";
import { detectLanguage } from "../syntaxHighlight";
import { extractFileName } from "../utils";

/**
 * Encapsulates all DiffViewer local state: parsed lines, hunk navigation,
 * collapsible context groups, and view mode toggling.
 */
export function useDiffViewerState(filePath: string, diffText: string) {
  const [viewMode, setViewMode] = useAtom(diffViewModeAtom);
  const lines = useMemo(() => parseDiffLines(diffText), [diffText]);
  const fileName = useMemo(() => extractFileName(filePath), [filePath]);
  const lang = useMemo(() => detectLanguage(filePath), [filePath]);
  const preRef = useRef<HTMLPreElement>(null);
  const [currentHunk, setCurrentHunk] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<ReadonlySet<number>>(() => new Set());

  // Collapsible context groups + hidden lines
  const contextGroups = useMemo(() => findCollapsibleGroups(lines), [lines]);
  const hiddenLines = useMemo(
    () => buildHiddenSet(contextGroups, expandedGroups),
    [contextGroups, expandedGroups],
  );

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
      if (lineIdx === undefined || !preRef.current) return;
      const el = preRef.current.children[lineIdx] as HTMLElement | undefined;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      setCurrentHunk(hunkIdx);
    },
    [hunkStartIndices],
  );

  const goNextHunk = useCallback(() => {
    const next = Math.min(currentHunk + 1, totalHunks - 1);
    scrollToHunk(next);
  }, [currentHunk, totalHunks, scrollToHunk]);

  const goPrevHunk = useCallback(() => {
    const prev = Math.max(currentHunk - 1, 0);
    scrollToHunk(prev);
  }, [currentHunk, scrollToHunk]);

  const expandGroup = useCallback((groupIdx: number) => {
    setExpandedGroups((s) => new Set([...s, groupIdx]));
  }, []);

  return {
    viewMode,
    setViewMode,
    lines,
    fileName,
    lang,
    preRef,
    currentHunk,
    totalHunks,
    contextGroups,
    hiddenLines,
    firstHunkLine,
    goNextHunk,
    goPrevHunk,
    expandGroup,
  } as const;
}
