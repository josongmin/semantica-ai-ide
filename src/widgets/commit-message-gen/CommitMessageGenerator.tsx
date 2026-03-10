import React, { useCallback } from "react";
import { useAtom, useAtomValue } from "jotai";

import { commitDiffSummaryAtom, commitGenLoadingAtom,commitMessageDraftAtom } from "../../features/commit-gen";
import { getVscodeApi } from "../../shared/lib";
import { commitGenDialogOpenAtom } from "../../shared/lib/atoms/dialogAtoms";
import { Badge, Button, cn, Dialog } from "../../shared/ui";

export const CommitMessageGenerator = React.memo(function CommitMessageGenerator() {
  const [open, setOpen] = useAtom(commitGenDialogOpenAtom);
  const [draft, setDraft] = useAtom(commitMessageDraftAtom);
  const diff = useAtomValue(commitDiffSummaryAtom);
  const loading = useAtomValue(commitGenLoadingAtom);

  const handleRegenerate = useCallback(() => {
    getVscodeApi().postMessage({ type: "REGENERATE_COMMIT_MESSAGE" });
  }, []);

  const handleCommit = useCallback(() => {
    getVscodeApi().postMessage({ type: "COMMIT_WITH_MESSAGE", message: draft });
    setOpen(false);
  }, [draft, setOpen]);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(draft);
  }, [draft]);

  return (
    <Dialog open={open} onClose={() => setOpen(false)} title="Commit Message">
      <div className="flex flex-col gap-3 p-3">
        {/* Diff summary bar */}
        <div className="flex items-center gap-2 text-2xs">
          <span className="text-vsc-text-secondary">{diff.filesChanged} files</span>
          <span className="text-vsc-success tabular-nums">+{diff.insertions}</span>
          <span className="text-vsc-error tabular-nums">-{diff.deletions}</span>
          <Badge text="AI Generated" variant="info" className="ml-auto" />
        </div>

        {/* Diff visual bar */}
        {(diff.insertions + diff.deletions) > 0 && (
          <div className="flex h-1 rounded-full overflow-hidden bg-vsc-surface-3">
            <div
              className="bg-vsc-success"
              style={{ width: `${(diff.insertions / (diff.insertions + diff.deletions)) * 100}%` }}
            />
            <div className="bg-vsc-error flex-1" />
          </div>
        )}

        {/* Message textarea */}
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          className={cn(
            "w-full p-2 rounded-md text-xs resize-none",
            "bg-vsc-input-bg text-vsc-input-fg border border-vsc-input-border",
            "focus:border-vsc-focus focus:outline-none focus:ring-1 focus:ring-vsc-focus/30",
          )}
          placeholder="AI will generate a commit message..."
        />

        {/* Actions */}
        <div className="flex items-center gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!draft}>
            Copy
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRegenerate} disabled={loading}>
            {loading ? "Generating..." : "Regenerate"}
          </Button>
          <Button variant="primary" size="sm" onClick={handleCommit} disabled={!draft || loading}>
            Commit
          </Button>
        </div>
      </div>
    </Dialog>
  );
});
