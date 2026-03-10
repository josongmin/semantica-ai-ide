import React, { useCallback } from "react";
import { useAtomValue } from "jotai";

import { extractDirPath, extractFileName } from "../../shared/lib";
import { diffReviewAdapterAtom } from "../../shared/lib/atoms";
import type { WorkspaceFileEntry } from "../../shared/lib/atoms/workspaceAdapterAtoms";
import { cn, Icon, Text } from "../../shared/ui";
import { WORKSPACE_ACTION_COLORS, WORKSPACE_ACTION_ICONS } from "./constants";

interface WorkspaceFileRowProps {
  entry: WorkspaceFileEntry;
}

const LANGUAGE_ICONS: Readonly<Record<string, string>> = {
  typescript: "symbol-namespace",
  typescriptreact: "symbol-namespace",
  javascript: "symbol-event",
  javascriptreact: "symbol-event",
  python: "symbol-misc",
  rust: "gear",
  go: "package",
  json: "json",
  markdown: "markdown",
  css: "symbol-color",
  html: "code",
};

export const WorkspaceFileRow = React.memo(function WorkspaceFileRow({
  entry,
}: WorkspaceFileRowProps) {
  const fileName = extractFileName(entry.file_path);
  const dirPath = extractDirPath(entry.file_path);
  const diffReview = useAtomValue(diffReviewAdapterAtom);

  const handleOpen = useCallback(() => {
    diffReview?.openInEditor(entry.file_path);
  }, [diffReview, entry.file_path]);

  const langIcon = entry.language ? LANGUAGE_ICONS[entry.language] : undefined;

  return (
    <button
      type="button"
      className="flex items-center gap-1.5 py-0.5 px-1 rounded-md text-xs hover:bg-vsc-list-hover transition-colors duration-fast cursor-pointer bg-transparent border-none w-full text-left focus-ring"
      onClick={handleOpen}
      title={`Open ${entry.file_path}`}
      aria-label={`Open ${entry.file_path}`}
    >
      {langIcon ? (
        <Icon name={langIcon} tokenSize="2xs" className="text-vsc-text-secondary shrink-0" />
      ) : (
        <Icon name="file" tokenSize="2xs" className="text-vsc-text-tertiary shrink-0" />
      )}

      <Text size="xs" weight="medium" truncate>
        {fileName}
      </Text>
      {dirPath && (
        <Text size="xs" tone="ghost" truncate>
          {dirPath}
        </Text>
      )}

      <Icon
        name={WORKSPACE_ACTION_ICONS[entry.action]}
        tokenSize="2xs"
        className={cn("ml-auto shrink-0", WORKSPACE_ACTION_COLORS[entry.action])}
      />
    </button>
  );
});
