import React, { useCallback } from "react";

import {
  extractFileName,
  type FileTreeNode as FileTreeNodeType,
  getVscodeApi,
} from "../../shared/lib";
import type { FileChangeStatus } from "../../shared/protocol";
import { cn, FILE_CHANGE_STATUS_COLOR, FILE_CHANGE_STATUS_ICON, Icon, Text } from "../../shared/ui";

interface FileTreeNodeProps {
  node: FileTreeNodeType;
  depth: number;
  isExpanded: boolean;
  onToggle: (path: string) => void;
  fileStatus?: FileChangeStatus;
  permalinkLabel?: string;
  onPermalinkClick?: () => void;
}

const LANGUAGE_ICONS: Readonly<Record<string, string>> = {
  ts: "symbol-namespace",
  tsx: "symbol-namespace",
  js: "symbol-event",
  jsx: "symbol-event",
  py: "symbol-misc",
  rs: "gear",
  go: "package",
  json: "json",
  md: "markdown",
  css: "symbol-color",
  html: "code",
};

function getFileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return LANGUAGE_ICONS[ext] ?? "file";
}

export const FileTreeNode = React.memo(function FileTreeNode({
  node,
  depth,
  isExpanded,
  onToggle,
  fileStatus,
  permalinkLabel,
  onPermalinkClick,
}: FileTreeNodeProps) {
  const handleClick = useCallback(() => {
    if (node.isFolder) {
      onToggle(node.path);
    } else {
      getVscodeApi().postMessage({ type: "OPEN_FILE", file_path: node.path });
    }
  }, [node.isFolder, node.path, onToggle]);

  const fileName = extractFileName(node.name);
  const statusColor = fileStatus ? FILE_CHANGE_STATUS_COLOR[fileStatus] : undefined;

  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-1 py-0.5 px-1 rounded-md text-xs w-full text-left",
        "hover:bg-vsc-list-hover transition-colors duration-fast cursor-pointer",
        "bg-transparent border-none focus-ring active:scale-[0.99]",
      )}
      style={{ paddingLeft: `${depth * 12 + 4}px` }}
      onClick={handleClick}
      aria-label={
        node.isFolder ? `${isExpanded ? "Collapse" : "Expand"} ${node.name}` : `Open ${node.path}`
      }
      aria-expanded={node.isFolder ? isExpanded : undefined}
      data-testid={`file-tree-node-${node.path}`}
    >
      {node.isFolder ? (
        <>
          <Icon
            name="chevron-right"
            tokenSize="2xs"
            className={cn(
              "transition-transform duration-normal text-vsc-text-tertiary shrink-0",
              isExpanded && "rotate-90",
            )}
          />
          <Icon
            name={isExpanded ? "folder-opened" : "folder"}
            tokenSize="sm"
            className="text-vsc-warning shrink-0"
          />
        </>
      ) : (
        <>
          {/* Spacer matching chevron width */}
          <span className="w-3 shrink-0" />
          <Icon
            name={fileStatus ? FILE_CHANGE_STATUS_ICON[fileStatus] : getFileIcon(fileName)}
            tokenSize="sm"
            className={cn("shrink-0", statusColor ?? "text-vsc-text-secondary")}
          />
        </>
      )}

      <Text size="xs" truncate className={statusColor}>
        {node.name}
      </Text>

      {permalinkLabel && (
        <span
          role="button"
          tabIndex={0}
          className="ml-auto shrink-0 px-1 py-0.5 rounded text-2xs bg-vsc-badge-bg text-vsc-badge-fg hover:bg-vsc-info/20 transition-colors duration-fast cursor-pointer focus-ring"
          onClick={(e) => {
            e.stopPropagation();
            onPermalinkClick?.();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              e.preventDefault();
              onPermalinkClick?.();
            }
          }}
          aria-label={`Jump to ${permalinkLabel}`}
          title={`Jump to ${permalinkLabel}`}
        >
          {permalinkLabel}
        </span>
      )}
    </button>
  );
});
