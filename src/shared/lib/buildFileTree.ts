/**
 * Converts a flat list of file paths into a nested tree structure.
 * Each node is either a folder (with children) or a file (leaf).
 */

export interface FileTreeNode {
  readonly name: string;
  readonly path: string;
  readonly isFolder: boolean;
  readonly children: readonly FileTreeNode[];
}

/**
 * Build a nested file tree from flat file paths.
 * Sorts folders first, then files, both alphabetically.
 */
export function buildFileTree(paths: readonly string[]): readonly FileTreeNode[] {
  // Intermediate mutable structure for building
  interface MutableNode {
    name: string;
    path: string;
    isFolder: boolean;
    children: Map<string, MutableNode>;
  }

  const root = new Map<string, MutableNode>();

  for (const filePath of paths) {
    const normalized = filePath.replace(/\\/g, "/");
    const parts = normalized.split("/").filter(Boolean);
    let current = root;
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i] ?? "";
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = i === parts.length - 1;

      let node = current.get(part);
      if (!node) {
        node = {
          name: part,
          path: currentPath,
          isFolder: !isLast,
          children: new Map(),
        };
        current.set(part, node);
      } else if (!isLast && !node.isFolder) {
        // Promote to folder if a deeper path is found
        node.isFolder = true;
      }

      current = node.children;
    }
  }

  function toReadonly(map: Map<string, MutableNode>): readonly FileTreeNode[] {
    const folders: FileTreeNode[] = [];
    const files: FileTreeNode[] = [];

    for (const node of map.values()) {
      const converted: FileTreeNode = {
        name: node.name,
        path: node.path,
        isFolder: node.isFolder,
        children: node.isFolder ? toReadonly(node.children) : [],
      };
      if (node.isFolder) {
        folders.push(converted);
      } else {
        files.push(converted);
      }
    }

    // Sort folders first alphabetically, then files alphabetically
    folders.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));

    return [...folders, ...files];
  }

  return toReadonly(root);
}

/**
 * Flatten a file tree into a list of nodes with depth info for rendering.
 * Useful for virtualized/flat rendering of the tree.
 */
export interface FlatTreeEntry {
  readonly node: FileTreeNode;
  readonly depth: number;
}

export function flattenTree(
  nodes: readonly FileTreeNode[],
  expandedPaths: ReadonlySet<string>,
  depth = 0,
): readonly FlatTreeEntry[] {
  const result: FlatTreeEntry[] = [];
  for (const node of nodes) {
    result.push({ node, depth });
    if (node.isFolder && expandedPaths.has(node.path)) {
      const childEntries = flattenTree(node.children, expandedPaths, depth + 1);
      for (const entry of childEntries) {
        result.push(entry);
      }
    }
  }
  return result;
}

/**
 * Filter tree nodes by a search query (case-insensitive).
 * Returns only nodes whose name or path matches, preserving parent folders.
 */
export function filterTree(nodes: readonly FileTreeNode[], query: string): readonly FileTreeNode[] {
  if (!query.trim()) return nodes;

  const lowerQuery = query.toLowerCase();

  function filterNodes(list: readonly FileTreeNode[]): readonly FileTreeNode[] {
    const result: FileTreeNode[] = [];

    for (const node of list) {
      if (node.isFolder) {
        const filteredChildren = filterNodes(node.children);
        if (filteredChildren.length > 0) {
          result.push({ ...node, children: filteredChildren });
        }
      } else if (
          node.name.toLowerCase().includes(lowerQuery) ||
          node.path.toLowerCase().includes(lowerQuery)
        ) {
          result.push(node);
        }
    }

    return result;
  }

  return filterNodes(nodes);
}
