import React from "react";

import type { GitCommit } from "~entities/git-history";

import { formatRelativeTime } from "../../shared/lib";
import { Badge, Text } from "../../shared/ui";

interface GitCommitRowProps {
  commit: GitCommit;
}

export const GitCommitRow = React.memo(function GitCommitRow({ commit }: GitCommitRowProps) {
  return (
    <div className="flex items-start gap-2 px-3 py-2" role="listitem" aria-label={commit.message}>
      <Text size="xs" mono tone="tertiary" className="shrink-0">
        {commit.sha.slice(0, 7)}
      </Text>
      <div className="flex-1 min-w-0">
        <Text size="xs" tone="primary" className="truncate min-w-0">
          {commit.message}
        </Text>
        <Text size="xs" tone="tertiary">
          {formatRelativeTime(commit.timestamp_ms)}
        </Text>
      </div>
      {commit.auto && <Badge text="auto" variant="default" className="shrink-0" />}
    </div>
  );
});
