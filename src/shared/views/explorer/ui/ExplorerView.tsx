import React, { useCallback, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAtomValue, useSetAtom } from "jotai";

import { fileTurnLabelAtom } from "~features/file-permalink";
import { allWorkspaceFileChangesAtom } from "~shared/bootstrap/workspace-awareness";
import {
  buildFileTree,
  clearFocusedTurnAtom,
  filterTree,
  flattenTree,
  type FlatTreeEntry,
  focusedTurnIdAtom,
  projectFilesAtom,
  useNavigateToFile,
  workspaceNameAtom,
} from "~shared/lib";
import type { FileChangeStatus, TurnId } from "~shared/protocol";
import { cn, Icon } from "~shared/ui";

import { ROW_HEIGHT } from "./explorer/constants";
import { EmptyState } from "./explorer/EmptyState";
import { FileContextMenu, type FileContextTarget } from "./explorer/FileContextMenu";
import { collectAllFolders, deriveProjectStats, useAgentPresence } from "./explorer/helpers";
import { SidebarRow } from "./explorer/SidebarRow";
import { type ViewMode, ViewModeSelector } from "./explorer/ViewModeSelector";

import { activeTabAtom } from "~domains/editor/editorAtoms";

const TEST_PATTERN = /\/__tests__\/|\.test\.|\.spec\.|\/tests?\//;

const LANG_SHORT: Record<string, string> = {
  TypeScript: "TS",
  JavaScript: "JS",
  Python: "Py",
  Kotlin: "Kt",
  Svelte: "Sv",
};

export const ExplorerView = React.memo(function ExplorerView() {
  const projectFiles = useAtomValue(projectFilesAtom);
  const fileChanges = useAtomValue(allWorkspaceFileChangesAtom);
  const activeTab = useAtomValue(activeTabAtom);
  const getTurnLabel = useAtomValue(fileTurnLabelAtom);
  const setFocusedTurnId = useSetAtom(focusedTurnIdAtom);
  const clearFocusedTurn = useSetAtom(clearFocusedTurnAtom);
  const agentPresence = useAgentPresence();
  const workspaceName = useAtomValue(workspaceNameAtom);

  const [search] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("project");
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [treeOpen, setTreeOpen] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  const statusMap = useMemo(() => {
    const m = new Map<string, FileChangeStatus>();
    for (const e of fileChanges) {
      let status: FileChangeStatus;
      if (e.action === "created") {
        status = "added";
      } else if (e.action === "deleted") {
        status = "deleted";
      } else {
        status = "modified";
      }
      m.set(e.file_path, status);
    }
    return m;
  }, [fileChanges]);

  const recentFiles = useMemo(
    () => fileChanges.filter((e) => e.action !== "deleted").slice(0, 5),
    [fileChanges],
  );

  const viewFilteredFiles = useMemo(() => {
    switch (viewMode) {
      case "project":
      case "project-files":
        return projectFiles;
      case "packages":
        return projectFiles.filter((f) => f.includes("node_modules/") || f.includes("packages/"));
      case "production":
        return projectFiles.filter((f) => !TEST_PATTERN.test(f));
      case "tests":
        return projectFiles.filter((f) => TEST_PATTERN.test(f));
      case "open-files":
        return recentFiles.map((e) => e.file_path);
      case "all-changed-files":
        return fileChanges.map((e) => e.file_path);
      case "scratches":
        return projectFiles.filter((f) => f.includes("scratch") || f.includes(".scratch"));
      default:
        return projectFiles;
    }
  }, [viewMode, projectFiles, fileChanges, recentFiles]);

  const tree = useMemo(() => buildFileTree(viewFilteredFiles), [viewFilteredFiles]);

  const projectStats = useMemo(
    () => deriveProjectStats(viewFilteredFiles, tree),
    [viewFilteredFiles, tree],
  );

  const filtered = useMemo(() => (search ? filterTree(tree, search) : tree), [tree, search]);

  const activeExpanded = useMemo(() => {
    if (!search) return expanded;
    const all = new Set<string>();
    collectAllFolders(filtered, all);
    return all as ReadonlySet<string>;
  }, [search, expanded, filtered]);

  const flat: readonly FlatTreeEntry[] = useMemo(
    () => flattenTree(filtered, activeExpanded),
    [filtered, activeExpanded],
  );

  const virt = useVirtualizer({
    count: flat.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  const toggle = useCallback((path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const jumpToTurn = useCallback(
    (turnId: TurnId) => {
      setFocusedTurnId(turnId);
      clearFocusedTurn();
    },
    [setFocusedTurnId, clearFocusedTurn],
  );

  const navigateToFile = useNavigateToFile();
  const openFile = useCallback(
    (path: string) => {
      navigateToFile(path);
    },
    [navigateToFile],
  );

  // File context menu
  const [ctxPos, setCtxPos] = useState<{ x: number; y: number } | null>(null);
  const [ctxTarget, setCtxTarget] = useState<FileContextTarget | null>(null);

  const handleFileContextMenu = useCallback(
    (e: React.MouseEvent, path: string, name: string, isFolder: boolean) => {
      e.preventDefault();
      setCtxPos({ x: e.clientX, y: e.clientY });
      setCtxTarget({ path, name, isFolder });
    },
    [],
  );

  const closeCtxMenu = useCallback(() => {
    setCtxPos(null);
    setCtxTarget(null);
  }, []);

  return (
    <div className="flex flex-col h-full select-none text-sm">
      {/* View mode selector — IntelliJ "Project ∨" dropdown */}
      <ViewModeSelector value={viewMode} onChange={setViewMode} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {/* Root project node — IntelliJ style */}
        {!search && viewMode === "project" && (
          <button
            type="button"
            onClick={() => setTreeOpen((v) => !v)}
            className={cn(
              "flex items-center w-full gap-2 px-3",
              "bg-transparent border-none cursor-pointer text-left",
              "hover:bg-vsc-list-hover/60 transition-colors duration-fast focus-ring",
            )}
            style={{ height: ROW_HEIGHT + 8 }}
            aria-expanded={treeOpen}
          >
            <span
              className="w-5 h-5 rounded-md bg-vsc-text-ghost/15 flex items-center justify-center shrink-0"
              aria-hidden
            >
              <span className="text-[10px] font-semibold leading-none text-vsc-text-secondary uppercase">
                {(workspaceName || "P").charAt(0)}
              </span>
            </span>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[13px] font-medium text-vsc-fg truncate leading-tight">
                {workspaceName || "Project"}
              </span>
              <div className="flex items-center gap-1.5 text-[9px] text-vsc-text-ghost leading-none mt-0.5">
                <span className="flex items-center gap-0.5">
                  <Icon name="file" size={9} className="opacity-40" />
                  {projectStats.files}
                </span>
                <span className="flex items-center gap-0.5">
                  <Icon name="folder" size={9} className="opacity-40" />
                  {projectStats.folders}
                </span>
                {projectStats.langBreakdown.length > 0 && (
                  <>
                    <span className="opacity-20">·</span>
                    {projectStats.langBreakdown.map(({ lang, pct }) => (
                      <span key={lang}>
                        {LANG_SHORT[lang] ?? lang} {pct}%
                      </span>
                    ))}
                  </>
                )}
              </div>
            </div>
            <Icon
              name="chevron-right"
              size={10}
              className={cn(
                "shrink-0 transition-transform duration-normal text-vsc-text-ghost/50",
                treeOpen && "rotate-90",
              )}
            />
          </button>
        )}

        {/* File tree */}
        <section>
          {(!search ? treeOpen : true) && viewFilteredFiles.length === 0 && (
            <EmptyState icon="folder-opened" message="No files in workspace" />
          )}
          {(!search ? treeOpen : true) &&
            viewFilteredFiles.length > 0 &&
            flat.length === 0 &&
            search && <EmptyState icon="search" message={`No results for "${search}"`} />}
          {(!search ? treeOpen : true) &&
            viewFilteredFiles.length > 0 &&
            (flat.length > 0 || !search) && (
              <div
                role="tree"
                aria-label="File explorer"
                style={{ height: virt.getTotalSize(), width: "100%", position: "relative" }}
              >
                {virt.getVirtualItems().map((row) => {
                  const entry = flat[row.index];
                  if (entry === undefined) return null;
                  const { node, depth } = entry;
                  // Indent +1 under root node (not in search mode)
                  const indent = search || viewMode !== "project" ? depth : depth + 1;
                  const st = !node.isFolder ? statusMap.get(node.path) : undefined;
                  const turnLabel = !node.isFolder ? getTurnLabel(node.path) : null;
                  const isExp = activeExpanded.has(node.path);
                  const agents = !node.isFolder ? agentPresence.get(node.path) : undefined;

                  return (
                    <div
                      key={node.path}
                      data-index={row.index}
                      ref={virt.measureElement}
                      onContextMenu={(e) =>
                        handleFileContextMenu(e, node.path, node.name, node.isFolder)
                      }
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${row.start}px)`,
                      }}
                    >
                      {node.isFolder ? (
                        <SidebarRow
                          depth={indent}
                          isFolder
                          folderOpen={isExp}
                          label={node.name}
                          chevron
                          chevronOpen={isExp}
                          onClick={() => toggle(node.path)}
                          aria-expanded={isExp}
                        />
                      ) : (
                        <SidebarRow
                          depth={indent}
                          label={node.name}
                          status={st}
                          agents={agents}
                          onClick={() => openFile(node.path)}
                          title={node.path}
                          badge={turnLabel?.label}
                          onBadgeClick={turnLabel ? () => jumpToTurn(turnLabel.turnId) : undefined}
                          isSelected={activeTab?.filePath === node.path}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
        </section>
      </div>

      {/* File context menu */}
      <FileContextMenu position={ctxPos} target={ctxTarget} onClose={closeCtxMenu} />
    </div>
  );
});

/** @deprecated Use ExplorerView instead */
export { ExplorerView as ExplorerPanel };
