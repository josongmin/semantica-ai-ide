import React, { useCallback, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAtomValue, useSetAtom } from "jotai";

import { allWorkspaceFileChangesAtom } from "~shared/bootstrap/workspace-awareness";

import { fileTurnLabelAtom } from "../../features/file-permalink";
import {
  buildFileTree,
  clearFocusedTurnAtom,
  type FileTreeNode as FileTreeNodeType,
  fileTreePanelVisibleAtom,
  filterTree,
  flattenTree,
  focusedTurnIdAtom,
  projectFilesAtom,
} from "../../shared/lib";
import type { FileChangeStatus, TurnId } from "../../shared/protocol";
import { Badge, Icon, Text } from "../../shared/ui";
import { FileTreeNode } from "./FileTreeNode";

/**
 * FileTree: Full file explorer panel with change-status highlighting.
 * Shows all project files in a collapsible tree, overlaying file change
 * status colors (modified=yellow, created=green, deleted=red).
 * Includes a "Recent Files" section and a search/filter input.
 */
export const FileTree = React.memo(function FileTree() {
  const visible = useAtomValue(fileTreePanelVisibleAtom);
  const projectFiles = useAtomValue(projectFilesAtom);
  const fileChanges = useAtomValue(allWorkspaceFileChangesAtom);
  const getTurnLabel = useAtomValue(fileTurnLabelAtom);
  const setFocusedTurnId = useSetAtom(focusedTurnIdAtom);
  const clearFocusedTurn = useSetAtom(clearFocusedTurnAtom);

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPaths, setExpandedPaths] = useState<ReadonlySet<string>>(new Set());

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Build a status map for quick lookup: filePath → FileChangeStatus
  const fileStatusMap = useMemo(() => {
    const map = new Map<string, FileChangeStatus>();
    for (const entry of fileChanges) {
      let status: FileChangeStatus;
      if (entry.action === "created") {
        status = "added";
      } else if (entry.action === "deleted") {
        status = "deleted";
      } else {
        status = "modified";
      }
      map.set(entry.file_path, status);
    }
    return map;
  }, [fileChanges]);

  // Recent files: last 5 modified/created files
  const recentFiles = useMemo(() => {
    return fileChanges.filter((e) => e.action === "created" || e.action === "modified").slice(0, 5);
  }, [fileChanges]);

  // Build and filter tree
  const tree = useMemo(() => buildFileTree(projectFiles), [projectFiles]);
  const filteredTree = useMemo(
    () => (searchQuery ? filterTree(tree, searchQuery) : tree),
    [tree, searchQuery],
  );

  // When filtering, auto-expand all folders
  const effectiveExpanded = useMemo(() => {
    if (!searchQuery) return expandedPaths;
    // Expand all folders in filtered tree
    const allPaths = new Set<string>();
    function collect(
      nodes: readonly { path: string; isFolder: boolean; children: readonly FileTreeNodeType[] }[],
    ) {
      for (const node of nodes) {
        if (node.isFolder) {
          allPaths.add(node.path);
          collect(node.children);
        }
      }
    }
    collect(filteredTree);
    return allPaths as ReadonlySet<string>;
  }, [searchQuery, expandedPaths, filteredTree]);

  const flatEntries = useMemo(
    () => flattenTree(filteredTree, effectiveExpanded),
    [filteredTree, effectiveExpanded],
  );

  const virtualizer = useVirtualizer({
    count: flatEntries.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 28,
    overscan: 10,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  const handleToggle = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handlePermalinkClick = useCallback(
    (turnId: TurnId) => {
      setFocusedTurnId(turnId);
      clearFocusedTurn();
    },
    [setFocusedTurnId, clearFocusedTurn],
  );

  if (!visible) return null;

  return (
    <div
      className="border-t border-vsc-border bg-vsc-surface-1 overflow-hidden max-h-[--panel-max-h-lg]"
      role="region"
      aria-label="File tree explorer"
      data-testid="file-tree-panel"
    >
      {/* Header */}
      <div className="px-3 py-1 text-2xs font-medium text-vsc-text-tertiary tracking-wide border-b border-vsc-border sticky top-0 bg-vsc-surface-1 z-[--z-sticky] flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Icon name="list-tree" tokenSize="2xs" />
          File Explorer
        </span>
        {projectFiles.length > 0 && <Badge text={projectFiles.length} variant="default" />}
      </div>

      {/* Search input */}
      <div className="px-2 py-1 border-b border-vsc-border">
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-vsc-input-bg border border-vsc-input-border">
          <Icon name="search" tokenSize="2xs" className="text-vsc-text-tertiary shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter files..."
            className="flex-1 bg-transparent border-none outline-none text-xs text-vsc-fg placeholder:text-vsc-text-tertiary focus-ring"
            aria-label="Filter files"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="bg-transparent border-none cursor-pointer p-0 text-vsc-text-tertiary hover:text-vsc-fg transition-colors duration-fast focus-ring"
              aria-label="Clear filter"
            >
              <Icon name="close" tokenSize="2xs" />
            </button>
          )}
        </div>
      </div>

      <div ref={scrollContainerRef} className="overflow-y-auto max-h-[--panel-max-h-md] scroll-shadow" data-scroll-contain>
        {/* Recent Files section */}
        {recentFiles.length > 0 && !searchQuery && (
          <div className="border-b border-vsc-border">
            <div className="px-3 py-1 text-2xs font-medium text-vsc-text-tertiary flex items-center gap-1">
              <Icon name="history" tokenSize="2xs" />
              Recent Files
            </div>
            <div className="px-1 pb-1">
              {recentFiles.map((entry) => {
                const turnLabel = getTurnLabel(entry.file_path);
                return (
                  <FileTreeNode
                    key={`recent-${entry.file_path}`}
                    node={{
                      name: entry.file_path.split("/").pop() ?? entry.file_path,
                      path: entry.file_path,
                      isFolder: false,
                      children: [],
                    }}
                    depth={0}
                    isExpanded={false}
                    onToggle={handleToggle}
                    fileStatus={fileStatusMap.get(entry.file_path)}
                    permalinkLabel={turnLabel?.label}
                    onPermalinkClick={
                      turnLabel ? () => handlePermalinkClick(turnLabel.turnId) : undefined
                    }
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* File tree */}
        {projectFiles.length === 0 && (
          <div className="px-3 py-4 text-center">
            <Text size="xs" tone="tertiary">
              No project files loaded
            </Text>
          </div>
        )}
        {projectFiles.length > 0 && flatEntries.length === 0 && (
          <div className="px-3 py-4 text-center">
            <Text size="xs" tone="tertiary">
              No files match &quot;{searchQuery}&quot;
            </Text>
          </div>
        )}
        {projectFiles.length > 0 && flatEntries.length > 0 && (
          <div
            className="px-1 py-0.5"
            role="tree"
            style={{
              height: virtualizer.getTotalSize(),
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const flatEntry = flatEntries[virtualRow.index];
              if (flatEntry === undefined) return null;
              const { node, depth } = flatEntry;
              const turnLabel = !node.isFolder ? getTurnLabel(node.path) : null;
              return (
                <div
                  key={node.path}
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
                  <FileTreeNode
                    node={node}
                    depth={depth}
                    isExpanded={effectiveExpanded.has(node.path)}
                    onToggle={handleToggle}
                    fileStatus={!node.isFolder ? fileStatusMap.get(node.path) : undefined}
                    permalinkLabel={turnLabel?.label}
                    onPermalinkClick={
                      turnLabel ? () => handlePermalinkClick(turnLabel.turnId) : undefined
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
