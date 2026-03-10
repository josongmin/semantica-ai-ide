import React, { useState } from "react";

import { useGitAutoCommit } from "../../features/git-auto-commit";
import { Button, ConfirmDialog, EmptyState, Text } from "../../shared/ui";
import { GitCommitRow } from "./GitCommitRow";

export const GitHistoryPanel = React.memo(function GitHistoryPanel() {
  const { panelVisible, commits, autoCommitEnabled, toggleAutoCommit, undoLastCommit } =
    useGitAutoCommit();
  const [confirmUndo, setConfirmUndo] = useState(false);

  if (!panelVisible) return null;

  const canUndo = commits.length > 0 && (commits[0]?.auto ?? false);

  function handleUndo() {
    undoLastCommit();
    setConfirmUndo(false);
  }

  return (
    <div
      className="border-t border-vsc-border bg-vsc-surface-1"
      role="region"
      aria-label="Git history panel"
    >
      <div className="px-3 py-2 flex items-center justify-between border-b border-vsc-border">
        <Text size="3xs" tone="secondary" className="font-medium tracking-wide">
          Git History
        </Text>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={autoCommitEnabled ? "primary" : "ghost"}
            onClick={toggleAutoCommit}
            aria-pressed={autoCommitEnabled}
            aria-label="Toggle auto-commit"
          >
            Auto-commit {autoCommitEnabled ? "On" : "Off"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirmUndo(true)}
            disabled={!canUndo}
            aria-label="Undo last commit"
          >
            Undo
          </Button>
          <ConfirmDialog
            open={confirmUndo}
            onConfirm={handleUndo}
            onCancel={() => setConfirmUndo(false)}
            title="Undo last commit"
            description="This will undo the most recent auto-commit. Changes will be unstaged."
            confirmLabel="Undo"
            confirmVariant="danger"
          />
        </div>
      </div>

      {commits.length === 0 ? (
        <EmptyState icon="git-commit" title="No commits yet" />
      ) : (
        <div role="list" className="divide-y divide-vsc-border overflow-y-auto max-h-[--panel-max-h-md] scroll-shadow">
          {commits.map((commit) => (
            <GitCommitRow key={commit.id} commit={commit} />
          ))}
        </div>
      )}
    </div>
  );
});
