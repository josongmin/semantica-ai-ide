import React from "react";
import { useAtomValue } from "jotai";

import { sessionMetaAtom } from "~entities/session/state";

import { cn, Icon, Text, Tooltip } from "../../shared/ui";

interface SessionSummaryCardProps {
  readonly className?: string;
}

/**
 * Thin sub-header strip showing an auto-updated one-line session summary
 * plus optional file/tool/error stats badges. Renders nothing when no
 * summary is available.
 */
export const SessionSummaryCard = React.memo(function SessionSummaryCard({
  className,
}: SessionSummaryCardProps) {
  const meta = useAtomValue(sessionMetaAtom);

  if (!meta.summary) return null;

  const {stats} = meta;

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-1.5 text-xs bg-vsc-surface-1 border-b border-vsc-border",
        className,
      )}
      data-testid="session-summary-card"
    >
      <Icon name="info" tokenSize="sm" className="text-vsc-text-tertiary shrink-0" />
      <Tooltip content={meta.summary}>
        <Text size="xs" tone="primary" truncate className="flex-1 min-w-0" title={meta.summary}>
          {meta.summary}
        </Text>
      </Tooltip>
      {stats && (
        <div className="flex items-center gap-2 text-vsc-text-tertiary shrink-0">
          {stats.files_modified > 0 && (
            <Tooltip content="Files modified">
              <Text size="2xs" tone="tertiary" className="flex items-center gap-1">
                <Icon name="edit" tokenSize="2xs" /> {stats.files_modified}
              </Text>
            </Tooltip>
          )}
          {stats.files_created > 0 && (
            <Tooltip content="Files created">
              <Text size="2xs" tone="success" className="flex items-center gap-1">
                <Icon name="new-file" tokenSize="2xs" /> {stats.files_created}
              </Text>
            </Tooltip>
          )}
          {stats.files_deleted > 0 && (
            <Tooltip content="Files deleted">
              <Text size="2xs" tone="error" className="flex items-center gap-1">
                <Icon name="trash" tokenSize="2xs" /> {stats.files_deleted}
              </Text>
            </Tooltip>
          )}
          {stats.errors_count > 0 && (
            <Tooltip content="Errors">
              <Text size="2xs" tone="error" className="flex items-center gap-1">
                <Icon name="error" tokenSize="2xs" /> {stats.errors_count}
              </Text>
            </Tooltip>
          )}
          {stats.tool_calls_count > 0 && (
            <Tooltip content="Tool calls">
              <Text size="2xs" tone="tertiary" className="flex items-center gap-1">
                <Icon name="tools" tokenSize="2xs" /> {stats.tool_calls_count}
              </Text>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
});
