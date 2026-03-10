import React, { useMemo } from "react";

import { extractDirPath } from "../../shared/lib";
import type { FileChange } from "../../shared/protocol";
import { Collapsible, Text } from "../../shared/ui";
import { FileChangeRow } from "./FileChangeRow";

interface FileChangeTreeViewProps {
  files: readonly FileChange[];
}

interface DirGroup {
  readonly dir: string;
  readonly files: readonly FileChange[];
  readonly insertions: number;
  readonly deletions: number;
}

/**
 * Group file changes by parent directory.
 * Files with no directory are grouped under "/".
 */
function groupByDirectory(files: readonly FileChange[]): readonly DirGroup[] {
  const map = new Map<string, { files: FileChange[]; insertions: number; deletions: number }>();

  for (const fc of files) {
    const dir = extractDirPath(fc.file_path) || "/";
    let entry = map.get(dir);
    if (!entry) {
      entry = { files: [], insertions: 0, deletions: 0 };
      map.set(dir, entry);
    }
    entry.files.push(fc);
    entry.insertions += fc.insertions;
    entry.deletions += fc.deletions;
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dir, data]) => ({
      dir,
      files: data.files,
      insertions: data.insertions,
      deletions: data.deletions,
    }));
}

/**
 * Directory-based tree view for file changes.
 * Groups files by parent directory with aggregate stats.
 */
export const FileChangeTreeView = React.memo(function FileChangeTreeView({
  files,
}: FileChangeTreeViewProps) {
  const groups = useMemo(() => groupByDirectory(files), [files]);

  if (groups.length === 0) return null;

  return (
    <div data-testid="file-change-tree-view" className="space-y-0.5">
      {groups.map((group) => (
        <Collapsible
          key={group.dir}
          title={group.dir}
          icon="folder"
          badge={group.files.length}
          defaultCollapsed={false}
          className="border-b-0"
          contentClassName="pl-4 pr-1 pb-1"
          headerRight={
            <div className="flex items-center gap-1.5 text-xs mr-1">
              <Text size="xs" tone="success" mono>
                +{group.insertions}
              </Text>
              <Text size="xs" tone="error" mono>
                -{group.deletions}
              </Text>
            </div>
          }
        >
          {group.files.map((fc) => (
            <FileChangeRow key={fc.file_path} fileChange={fc} />
          ))}
        </Collapsible>
      ))}
    </div>
  );
});
