import React, { useCallback, useState } from "react";

import { usePRSummary } from "../../features/pr-summary";
import { writeToClipboard } from "../../shared/lib";
import type { FileChange, FileChangeStatus } from "../../shared/protocol";
import { Button, cn, COPY_FEEDBACK_MS, Dialog, Icon, Spinner, Text } from "../../shared/ui";

const STATUS_ICONS: Readonly<Record<FileChangeStatus, string>> = {
  added: "diff-added",
  modified: "diff-modified",
  deleted: "diff-removed",
  renamed: "diff-renamed",
};

const STATUS_COLORS: Readonly<Record<FileChangeStatus, string>> = {
  added: "text-vsc-success",
  modified: "text-vsc-warning",
  deleted: "text-vsc-error",
  renamed: "text-vsc-accent",
};

function formatAsMarkdown(
  title: string,
  changes: readonly FileChange[],
  intent: string,
  todos: readonly string[],
): string {
  const lines: string[] = [];
  lines.push(`## ${title}`);
  lines.push("");

  if (intent) {
    lines.push("### Intent");
    lines.push(intent);
    lines.push("");
  }

  if (changes.length > 0) {
    lines.push("### Changes");
    for (const change of changes) {
      let prefix: string;
      if (change.status === "added") {
        prefix = "+";
      } else if (change.status === "deleted") {
        prefix = "-";
      } else if (change.status === "renamed") {
        prefix = "~";
      } else {
        prefix = "*";
      }
      lines.push(
        `- \`${prefix}\` \`${change.file_path}\` (+${change.insertions}/-${change.deletions})`,
      );
    }
    lines.push("");
  }

  if (todos.length > 0) {
    lines.push("### TODO");
    for (const todo of todos) {
      lines.push(`- [ ] ${todo}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * PR summary card with auto-generated title, changes, intent, and TODOs.
 * Supports inline title editing, clipboard copy as Markdown, and "Open in GitHub".
 */
export const PRSummaryCard = React.memo(function PRSummaryCard() {
  const { summary, dialogOpen, closeDialog, generateSummary, openInGitHub, sessionId } =
    usePRSummary();

  const [editedTitle, setEditedTitle] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const displayTitle = editedTitle ?? summary?.title ?? "PR Summary";

  const handleCopyMarkdown = useCallback(async () => {
    if (!summary) return;
    const md = formatAsMarkdown(
      editedTitle ?? summary.title,
      summary.changes,
      summary.intent,
      summary.todos,
    );
    await writeToClipboard(md);
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  }, [summary, editedTitle]);

  const handleOpenInGitHub = useCallback(() => {
    openInGitHub(sessionId);
  }, [openInGitHub, sessionId]);

  const handleRegenerate = useCallback(() => {
    setEditedTitle(null);
    generateSummary(sessionId);
  }, [generateSummary, sessionId]);

  // Sync edited title when summary arrives
  React.useEffect(() => {
    if (summary?.title) setEditedTitle(null);
  }, [summary?.title]);

  return (
    <Dialog
      open={dialogOpen}
      onClose={closeDialog}
      title="PR Summary"
      description="Auto-generated pull request summary from this session."
      className="max-w-lg"
    >
      <div className="flex flex-col gap-3">
        {!summary ? (
          <div
            className="flex items-center justify-center gap-2 py-6"
            data-testid="pr-summary-loading"
          >
            <Spinner size="sm" />
            <Text size="sm" tone="secondary">
              Generating summary...
            </Text>
          </div>
        ) : (
          <>
            {/* Editable title */}
            <div>
              <Text size="xs" weight="medium" tone="secondary" className="mb-1">
                Title
              </Text>
              <input
                type="text"
                value={displayTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className={cn(
                  "w-full px-2 py-1.5 text-sm rounded border",
                  "bg-vsc-surface-1 text-vsc-fg border-vsc-border",
                  "focus:outline-none focus:border-vsc-accent focus:ring-1 focus:ring-vsc-accent/30",
                )}
                data-testid="pr-title-input"
              />
            </div>

            {/* Changes section */}
            {summary.changes.length > 0 && (
              <div data-testid="pr-changes-section">
                <Text size="xs" weight="medium" tone="secondary" className="mb-1.5">
                  Changes ({summary.changes.length} files)
                </Text>
                <div className="max-h-32 overflow-y-auto space-y-0.5 scroll-shadow">
                  {summary.changes.map((change) => (
                    <div
                      key={change.file_path}
                      className="flex items-center gap-1.5 text-xs py-0.5"
                    >
                      <Icon
                        name={STATUS_ICONS[change.status]}
                        tokenSize="xs"
                        className={STATUS_COLORS[change.status]}
                      />
                      <span className="flex-1 min-w-0 truncate font-mono text-vsc-fg">
                        {change.file_path}
                      </span>
                      <span className="text-vsc-success shrink-0">+{change.insertions}</span>
                      <span className="text-vsc-error shrink-0">-{change.deletions}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Intent section */}
            {summary.intent && (
              <div data-testid="pr-intent-section">
                <Text size="xs" weight="medium" tone="secondary" className="mb-1">
                  Intent
                </Text>
                <Text size="xs" tone="tertiary" className="leading-relaxed">
                  {summary.intent}
                </Text>
              </div>
            )}

            {/* TODO section */}
            {summary.todos.length > 0 && (
              <div data-testid="pr-todos-section">
                <Text size="xs" weight="medium" tone="secondary" className="mb-1">
                  TODO ({summary.todos.length})
                </Text>
                <ul className="space-y-0.5">
                  {summary.todos.map((todo) => (
                    <li
                      key={todo}
                      className="flex items-start gap-1.5 text-xs text-vsc-text-tertiary"
                    >
                      <Icon
                        name="circle-large-outline"
                        tokenSize="xs"
                        className="mt-0.5 shrink-0 text-vsc-text-secondary"
                      />
                      {todo}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-1 border-t border-vsc-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            disabled={!summary}
            data-testid="regenerate-summary-btn"
          >
            <Icon name="refresh" tokenSize="sm" />
            Regenerate
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyMarkdown}
              disabled={!summary}
              data-testid="copy-markdown-btn"
            >
              <Icon name={copied ? "check" : "copy"} tokenSize="sm" />
              {copied ? "Copied" : "Copy Markdown"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenInGitHub}
              disabled={!summary}
              data-testid="open-github-btn"
            >
              <Icon name="github" tokenSize="sm" />
              Open in GitHub
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
});
