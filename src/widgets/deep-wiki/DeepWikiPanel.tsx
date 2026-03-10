import React, { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  activeWikiPageAtom,
  activeWikiPageIdAtom,
  wikiTreeAtom,
  type WikiTreeNode,
} from "../../features/deep-wiki";
import { cn, Icon, ScrollArea, Text } from "../../shared/ui";
import { MarkdownContent } from "../markdown-content";

// ─── WikiTreeItem ────────────────────────────────────────────

interface WikiTreeItemProps {
  node: WikiTreeNode;
  depth: number;
  activePageId: string | null;
  onSelect: (id: string) => void;
}

const WikiTreeItem = React.memo(function WikiTreeItem({
  node,
  depth,
  activePageId,
  onSelect,
}: WikiTreeItemProps) {
  const isActive = node.page.id === activePageId;
  const hasChildren = node.children.length > 0;

  return (
    <>
      <button
        type="button"
        className={cn(
          "flex items-center gap-1.5 w-full text-left px-2 py-1 rounded text-xs",
          "hover:bg-vsc-list-hover transition-colors duration-fast focus-ring",
          isActive && "bg-vsc-list-active text-vsc-list-active-fg",
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => onSelect(node.page.id)}
        aria-current={isActive ? "page" : undefined}
        data-testid={`wiki-tree-item-${node.page.id}`}
      >
        <Icon
          name={hasChildren ? "folder" : "file"}
          tokenSize="xs"
          className="shrink-0 text-vsc-text-tertiary"
        />
        <span className="truncate min-w-0">{node.page.title}</span>
      </button>
      {node.children.map((child) => (
        <WikiTreeItem
          key={child.page.id}
          node={child}
          depth={depth + 1}
          activePageId={activePageId}
          onSelect={onSelect}
        />
      ))}
    </>
  );
});

// ─── WikiSidebar ─────────────────────────────────────────────

interface WikiSidebarProps {
  tree: readonly WikiTreeNode[];
  activePageId: string | null;
  onSelect: (id: string) => void;
}

const WikiSidebar = React.memo(function WikiSidebar({
  tree,
  activePageId,
  onSelect,
}: WikiSidebarProps) {
  return (
    <nav
      className="w-52 max-w-[calc(100vw-2rem)] shrink-0 border-r border-vsc-panel-border overflow-y-auto scroll-shadow"
      data-scroll-contain
      aria-label="Documentation navigation"
      data-testid="wiki-sidebar"
    >
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-vsc-panel-border">
        <Icon name="book" tokenSize="sm" className="text-vsc-text-secondary" />
        <Text size="sm" weight="semibold">
          Documentation
        </Text>
      </div>
      <div className="py-1">
        {tree.length === 0 ? (
          <Text size="xs" tone="tertiary" as="div" className="px-3 py-2">
            No pages generated yet
          </Text>
        ) : (
          tree.map((node) => (
            <WikiTreeItem
              key={node.page.id}
              node={node}
              depth={0}
              activePageId={activePageId}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </nav>
  );
});

// ─── WikiContent ─────────────────────────────────────────────

const WikiContent = React.memo(function WikiContent() {
  const page = useAtomValue(activeWikiPageAtom);

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center text-vsc-text-tertiary">
        <div className="text-center">
          <Icon name="book" tokenSize="lg" className="mb-2 opacity-40" />
          <Text size="sm" tone="tertiary" as="div">
            Select a page to view documentation
          </Text>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 min-w-0 p-4" data-testid="wiki-content">
      <Text size="lg" weight="bold" as="h2" className="mb-3">
        {page.title}
      </Text>

      {page.source_turn_id && (
        <div className="flex items-center gap-1 mb-3 text-2xs text-vsc-text-tertiary">
          <Icon name="link" tokenSize="2xs" />
          <span>Generated from turn {page.source_turn_id}</span>
        </div>
      )}

      <MarkdownContent text={page.content} />

      <div className="mt-4 pt-2 border-t border-vsc-panel-border">
        <Text size="2xs" tone="tertiary">
          Last updated: {new Date(page.updated_at_ms).toLocaleString()}
        </Text>
      </div>
    </ScrollArea>
  );
});

// ─── DeepWikiPanel ───────────────────────────────────────────

/**
 * AS-04: DeepWiki auto-generated documentation panel.
 * Navigation sidebar with document tree + main content area with rendered docs.
 * "Generated from" links connect docs back to source turns.
 */
export const DeepWikiPanel = React.memo(function DeepWikiPanel() {
  const tree = useAtomValue(wikiTreeAtom);
  const activePageId = useAtomValue(activeWikiPageIdAtom);
  const setActivePageId = useSetAtom(activeWikiPageIdAtom);

  const handleSelect = useCallback(
    (id: string) => {
      setActivePageId(id);
    },
    [setActivePageId],
  );

  return (
    <div
      className="flex h-full min-h-0"
      data-testid="deep-wiki-panel"
      role="region"
      aria-label="DeepWiki documentation"
    >
      <WikiSidebar tree={tree} activePageId={activePageId} onSelect={handleSelect} />
      <WikiContent />
    </div>
  );
});
