import React, { useCallback } from "react";
import { useAtomValue } from "jotai";

import {
  activeTransactionAtom,
  transactionHasErrorsAtom,
  transactionStatsAtom,
} from "~entities/transaction";
import { useTransactionControl } from "~shared/bootstrap/transactional-edit";

import type { TransactionFileChange } from "../../shared/protocol";
import { Badge, cn, Icon, Text } from "../../shared/ui";

// ─── State Colors ────────────────────────────────────────────

const STATE_BADGE: Record<string, { variant: "info" | "warning" | "error" | "success"; label: string }> = {
  preparing: { variant: "info", label: "Preparing" },
  preview: { variant: "info", label: "Preview" },
  applying: { variant: "warning", label: "Applying..." },
  committed: { variant: "success", label: "Committed" },
  rolled_back: { variant: "info", label: "Rolled Back" },
  error: { variant: "error", label: "Error" },
};

// ─── File Row ────────────────────────────────────────────────

interface FileRowProps {
  readonly file: TransactionFileChange;
  readonly onToggle: (filePath: string, include: boolean) => void;
}

const TransactionFileRow = React.memo(function TransactionFileRow({
  file,
  onToggle,
}: FileRowProps) {
  let typeIcon: string;
  if (file.type === "create") {
    typeIcon = "new-file";
  } else if (file.type === "delete") {
    typeIcon = "trash";
  } else if (file.type === "rename") {
    typeIcon = "arrow-swap";
  } else {
    typeIcon = "edit";
  }
  let typeColor: string;
  if (file.type === "create") {
    typeColor = "text-vsc-success";
  } else if (file.type === "delete") {
    typeColor = "text-vsc-error";
  } else {
    typeColor = "text-vsc-text-secondary";
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 hover:bg-vsc-list-hover/50 rounded transition-colors duration-fast">
      <input
        type="checkbox"
        checked={file.included}
        onChange={(e) => onToggle(file.filePath, e.target.checked)}
        className="size-3.5 rounded border-vsc-border accent-vsc-info shrink-0"
        aria-label={`Include ${file.filePath}`}
      />
      <Icon name={typeIcon} tokenSize="xs" className={cn("shrink-0", typeColor)} />
      <Text size="xs" tone="secondary" truncate className="flex-1 min-w-0 font-mono">
        {file.filePath}
      </Text>
      <div className="flex items-center gap-1.5 shrink-0 text-2xs font-mono">
        {file.insertions > 0 && (
          <span className="text-vsc-success">+{file.insertions}</span>
        )}
        {file.deletions > 0 && (
          <span className="text-vsc-error">-{file.deletions}</span>
        )}
      </div>
    </div>
  );
});

// ─── Main Panel ──────────────────────────────────────────────

export const TransactionPanel = React.memo(function TransactionPanel() {
  const tx = useAtomValue(activeTransactionAtom);
  const stats = useAtomValue(transactionStatsAtom);
  const hasErrors = useAtomValue(transactionHasErrorsAtom);
  const { commitTransaction, rollbackTransaction, toggleFile } = useTransactionControl();

  const handleToggle = useCallback(
    (filePath: string, include: boolean) => {
      if (tx) toggleFile(tx.txId, filePath, include);
    },
    [tx, toggleFile],
  );

  if (!tx) return null;

  const badge = STATE_BADGE[tx.state] ?? STATE_BADGE.preparing ?? { label: "Unknown", variant: "info" as const };
  const isActionable = tx.state === "preview" || tx.state === "preparing";

  return (
    <div
      className="rounded-lg border border-vsc-border/40 bg-vsc-surface-1 overflow-hidden"
      data-testid="transaction-panel"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-vsc-border/30">
        <Icon name="git-merge" tokenSize="sm" className="text-vsc-text-secondary shrink-0" />
        <Text size="sm" weight="medium" className="flex-1 min-w-0" truncate>
          {tx.description || "Transaction"}
        </Text>
        <Badge text={badge.label} variant={badge.variant} />
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 bg-vsc-surface-2/50 text-2xs">
        <span className="text-vsc-text-secondary">{stats.files} files</span>
        <span className="text-vsc-success">+{stats.insertions}</span>
        <span className="text-vsc-error">-{stats.deletions}</span>
      </div>

      {/* Validation errors */}
      {hasErrors && (
        <div className="mx-2 mt-2 p-2 rounded bg-vsc-error/10 border-l-2 border-vsc-error">
          <Text size="2xs" tone="primary" className="font-medium">Validation Errors</Text>
          {tx.validationErrors.map((err) => (
            <Text key={err} size="2xs" tone="secondary" className="mt-0.5">{err}</Text>
          ))}
        </div>
      )}

      {/* File list */}
      <div className="max-h-[--panel-max-h-sm] overflow-y-auto scroll-shadow py-1" role="list" aria-label="Transaction files">
        {tx.files.map((file) => (
          <TransactionFileRow
            key={file.filePath}
            file={file}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {/* Actions */}
      {isActionable && (
        <div className="flex items-center gap-2 px-3 py-2 border-t border-vsc-border/30">
          <button
            type="button"
            onClick={() => commitTransaction(tx.txId)}
            disabled={hasErrors}
            className={cn(
              "h-7 px-3 rounded-md text-xs font-medium transition-colors duration-fast cursor-pointer focus-ring",
              hasErrors
                ? "bg-vsc-surface-2 text-vsc-text-ghost cursor-not-allowed"
                : "bg-vsc-success/20 text-vsc-success hover:bg-vsc-success/30",
            )}
          >
            Commit All
          </button>
          <button
            type="button"
            onClick={() => rollbackTransaction(tx.txId)}
            className="h-7 px-3 rounded-md text-xs font-medium
                       bg-vsc-error/10 text-vsc-error hover:bg-vsc-error/20
                       transition-colors duration-fast cursor-pointer focus-ring"
          >
            Rollback
          </button>
        </div>
      )}
    </div>
  );
});
