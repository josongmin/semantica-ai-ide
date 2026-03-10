import React, { useCallback, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAtom } from "jotai";

import { diffViewModeAtom } from "../../shared/lib";
import { cn, Tabs, Text } from "../../shared/ui";
import { ScopeViolationBanner } from "../scope-guard";
import { CollapsibleContextRow } from "./CollapsibleContextRow";
import { DiffViewerHeader } from "./DiffViewerHeader";
import { HighlightedLine } from "./HighlightedLine";
import {
  buildHiddenSet,
  findCollapsibleGroups,
  lineStyles,
  parseDiffLines,
} from "./parseDiffLines";
import { SideBySideDiffViewer } from "./SideBySideDiffViewer";
import { detectLanguage } from "./syntaxHighlight";
import { useDiffHunkNavigation } from "./useDiffHunkNavigation";
import { extractFileName } from "./utils";

interface DiffViewerProps {
  filePath: string;
  diffText: string;
  onAccept?: () => void;
  onReject?: () => void;
  onOpenInEditor?: (line?: number) => void;
}

/**
 * A visible row in the virtualized list. Either a normal diff line or a
 * collapsed-group placeholder.
 */
export type VisibleItem = { kind: "line"; lineIndex: number } | { kind: "collapsed"; groupIndex: number };

/**
 * Inline diff viewer with Accept/Reject actions, syntax highlighting, and hunk navigation.
 * Uses VSCode diff CSS variables for native look.
 * The inline view is virtualized via @tanstack/react-virtual for large diffs.
 */
const DIFF_VIEW_TABS = [
  { id: "inline", label: "Inline" },
  { id: "side-by-side", label: "Side-by-Side" },
] as const;

export const DiffViewer = React.memo(function DiffViewer({
  filePath,
  diffText,
  onAccept,
  onReject,
  onOpenInEditor,
}: DiffViewerProps) {
  const [viewMode, setViewMode] = useAtom(diffViewModeAtom);
  const lines = useMemo(() => parseDiffLines(diffText), [diffText]);
  const fileName = useMemo(() => extractFileName(filePath), [filePath]);
  const lang = useMemo(() => detectLanguage(filePath), [filePath]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<ReadonlySet<number>>(() => new Set());

  // Collapsible context groups + hidden lines
  const contextGroups = useMemo(() => findCollapsibleGroups(lines), [lines]);
  const hiddenLines = useMemo(
    () => buildHiddenSet(contextGroups, expandedGroups),
    [contextGroups, expandedGroups],
  );

  // Build visible items array
  const visibleItems = useMemo(() => {
    const items: VisibleItem[] = [];
    let i = 0;
    while (i < lines.length) {
      if (hiddenLines.has(i)) {
        const groupIdx = contextGroups.findIndex((g) => g.startIndex === i);
        const matchedGroup = groupIdx !== -1 ? contextGroups[groupIdx] : undefined;
        if (matchedGroup !== undefined) {
          items.push({ kind: "collapsed", groupIndex: groupIdx });
          i = matchedGroup.endIndex + 1;
          continue;
        }
        i++;
        continue;
      }
      items.push({ kind: "line", lineIndex: i });
      i++;
    }
    return items;
  }, [lines, hiddenLines, contextGroups]);

  // Virtualizer for the inline diff view
  const virtualizer = useVirtualizer({
    count: visibleItems.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 22,
    overscan: 10,
  });

  // Hunk navigation (extracted hook)
  const { currentHunk, totalHunks, firstHunkLine, goNextHunk, goPrevHunk } =
    useDiffHunkNavigation({ lines, visibleItems, virtualizer });

  // Stable handler for view mode tab change
  const handleViewModeChange = useCallback(
    (id: string) => setViewMode(id as "inline" | "side-by-side"),
    [setViewMode],
  );

  // Stable callback for "Open in editor"
  const handleOpenInEditor = useCallback(() => {
    onOpenInEditor?.(firstHunkLine);
  }, [onOpenInEditor, firstHunkLine]);

  if (lines.length === 0) {
    return (
      <div
        className="border border-vsc-border rounded-md p-3 text-center"
        data-testid="diff-viewer"
      >
        <Text size="xs" tone="tertiary">
          No diff available
        </Text>
      </div>
    );
  }

  return (
    <div className="border border-vsc-border rounded-md overflow-hidden" data-testid="diff-viewer">
      {/* Header */}
      <DiffViewerHeader
        fileName={fileName}
        filePath={filePath}
        currentHunk={currentHunk}
        totalHunks={totalHunks}
        onPrevHunk={goPrevHunk}
        onNextHunk={goNextHunk}
        onOpenInEditor={onOpenInEditor ? handleOpenInEditor : undefined}
        onAccept={onAccept}
        onReject={onReject}
      />

      {/* Scope violation warning */}
      <ScopeViolationBanner filePath={filePath} onAllow={onAccept} onDeny={onReject} />

      {/* View mode toggle */}
      <Tabs
        tabs={DIFF_VIEW_TABS}
        activeId={viewMode}
        onTabChange={handleViewModeChange}
        className="px-2"
      />

      {/* Diff body */}
      {viewMode === "side-by-side" ? (
        <SideBySideDiffViewer diffText={diffText} className="max-h-[--panel-max-h-lg]" />
      ) : (
        <div
          ref={scrollContainerRef}
          className="text-xs leading-relaxed overflow-x-auto m-0 max-h-[--panel-max-h-lg] overflow-y-auto font-mono scroll-shadow"
          tabIndex={0}
          role="region"
          aria-label={`Diff content for ${fileName}`}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const item = visibleItems[virtualRow.index];
              if (item === undefined) return null;

              if (item.kind === "collapsed") {
                const {groupIndex} = item;
                const group = contextGroups[groupIndex];
                if (group === undefined) return null;
                return (
                  <div
                    key={`cg-${groupIndex}`}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <CollapsibleContextRow
                      lineCount={group.lineCount}
                      onExpand={() => setExpandedGroups((s) => new Set([...s, groupIndex]))}
                    />
                  </div>
                );
              }

              const {lineIndex} = item;
              const line = lines[lineIndex];
              if (line === undefined) return null;
              return (
                <div
                  key={lineIndex}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className={cn("flex", lineStyles[line.type])}>
                    <span className="w-8 shrink-0 text-right pr-2 text-vsc-text-ghost select-none tabular-nums border-r border-vsc-border/30 mr-2">
                      {line.lineNumber ?? ""}
                    </span>
                    {line.type === "header" ? (
                      <span className="px-1 flex-1 whitespace-pre">{line.content}</span>
                    ) : (
                      <HighlightedLine content={line.content} lang={lang} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
