import React, { useCallback, useMemo } from "react";

import { getVscodeApi } from "~shared/lib";
import { ContextMenu, type ContextMenuGroup } from "~shared/ui";

// ─── Types ──────────────────────────────────────────────

export interface FileContextTarget {
  path: string;
  name: string;
  isFolder: boolean;
}

export interface FileContextMenuProps {
  position: { x: number; y: number } | null;
  target: FileContextTarget | null;
  onClose: () => void;
  onAddToChat?: (path: string) => void;
}

// ─── Menu definitions ───────────────────────────────────

function buildGroups(target: FileContextTarget): ContextMenuGroup[] {
  const { isFolder, path } = target;

  const groups: ContextMenuGroup[] = [];

  // ── Open ──
  groups.push({
    items: [
      { id: "open", label: isFolder ? "Expand in Explorer" : "Open in Editor", icon: isFolder ? "folder-opened" : "go-to-file" },
      ...(!isFolder ? [{ id: "open-side", label: "Open to the Side", icon: "split-horizontal", shortcut: "⌘↵" }] : []),
      { id: "reveal-finder", label: "Reveal in Finder", icon: "folder", shortcut: "⌥⌘R" },
      { id: "open-terminal", label: "Open in Terminal", icon: "terminal" },
    ],
  });

  // ── Agent ──
  groups.push({
    label: "Agent",
    items: [
      { id: "add-to-chat", label: "Add to Chat Context", icon: "comment-discussion", shortcut: "@" },
      { id: "ask-agent", label: "Ask Agent About This", icon: "sparkle" },
      ...(!isFolder ? [{ id: "review-agent", label: "Review with Agent", icon: "eye" }] : []),
    ],
  });

  // ── Edit (files only) ──
  if (!isFolder) {
    groups.push({
      items: [
        { id: "find-references", label: "Find File References", icon: "references" },
        { id: "open-changes", label: "Open Changes", icon: "diff" },
        { id: "file-history", label: "File History", icon: "history" },
      ],
    });
  }

  // ── Clipboard ──
  groups.push({
    items: [
      { id: "copy-name", label: "Copy Name", icon: "copy" },
      { id: "copy-path", label: "Copy Path", icon: "file-symlink-file", shortcut: "⌥⌘C" },
      { id: "copy-relative", label: "Copy Relative Path", icon: "file-symlink-directory", shortcut: "⇧⌥⌘C" },
    ],
  });

  // ── File ops ──
  groups.push({
    items: [
      { id: "rename", label: "Rename…", icon: "edit", shortcut: "↵" },
      { id: "duplicate", label: "Duplicate…", icon: "files" },
      { id: "move", label: "Move…", icon: "move" },
    ],
  });

  // ── Danger ──
  groups.push({
    items: [
      { id: "delete", label: `Delete ${isFolder ? "Folder" : "File"}`, icon: "trash", danger: true, shortcut: "⌘⌫" },
    ],
  });

  // ── Tests (test files only) ──
  const isTestFile = /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(path);
  if (isTestFile) {
    // Insert before danger zone
    groups.splice(groups.length - 1, 0, {
      items: [
        { id: "run-tests", label: "Run Tests", icon: "beaker" },
        { id: "debug-tests", label: "Debug Tests", icon: "debug-alt" },
      ],
    });
  }

  return groups;
}

// ─── Component ──────────────────────────────────────────

export const FileContextMenu = React.memo(function FileContextMenu({
  position,
  target,
  onClose,
  onAddToChat,
}: FileContextMenuProps) {
  const groups = useMemo(
    () => (target ? buildGroups(target) : []),
    [target],
  );

  const handleSelect = useCallback(
    (id: string) => {
      if (!target) return;
      const { path, name } = target;
      const vscode = getVscodeApi();

      switch (id) {
        // ── Open ──
        case "open":
          vscode.postMessage({ type: "OPEN_FILE", file_path: path });
          break;
        case "open-side":
          vscode.postMessage({ type: "OPEN_FILE", file_path: path, split: true });
          break;
        case "reveal-finder":
          vscode.postMessage({ type: "REVEAL_IN_FINDER", file_path: path });
          break;
        case "open-terminal":
          vscode.postMessage({ type: "OPEN_TERMINAL", cwd: path });
          break;

        // ── Agent ──
        case "add-to-chat":
          onAddToChat?.(path);
          break;
        case "ask-agent":
          vscode.postMessage({ type: "ASK_AGENT", prompt: `Explain the file: ${path}` });
          break;
        case "review-agent":
          vscode.postMessage({ type: "ASK_AGENT", prompt: `Review the code in: ${path}` });
          break;

        // ── Code ──
        case "find-references":
          vscode.postMessage({ type: "FIND_REFERENCES", file_path: path });
          break;
        case "open-changes":
          vscode.postMessage({ type: "OPEN_CHANGES", file_path: path });
          break;
        case "file-history":
          vscode.postMessage({ type: "FILE_HISTORY", file_path: path });
          break;

        // ── Clipboard ──
        case "copy-name":
          void navigator.clipboard.writeText(name);
          break;
        case "copy-path":
          void navigator.clipboard.writeText(path);
          break;
        case "copy-relative":
          void navigator.clipboard.writeText(path);
          break;

        // ── File ops ──
        case "rename":
          vscode.postMessage({ type: "RENAME_FILE", file_path: path });
          break;
        case "duplicate":
          vscode.postMessage({ type: "DUPLICATE_FILE", file_path: path });
          break;
        case "move":
          vscode.postMessage({ type: "MOVE_FILE", file_path: path });
          break;
        case "delete":
          vscode.postMessage({ type: "DELETE_FILE", file_path: path });
          break;

        // ── Tests ──
        case "run-tests":
          vscode.postMessage({ type: "RUN_TESTS", file_path: path });
          break;
        case "debug-tests":
          vscode.postMessage({ type: "DEBUG_TESTS", file_path: path });
          break;
      }
    },
    [target, onAddToChat],
  );

  if (!target) return null;

  return (
    <ContextMenu
      position={position}
      groups={groups}
      onSelect={handleSelect}
      onClose={onClose}
    />
  );
});
