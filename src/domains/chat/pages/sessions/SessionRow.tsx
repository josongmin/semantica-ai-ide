import React, { useCallback } from "react";

import { SessionCostBadge } from "~widgets/session-cost-badge/SessionCostBadge";
import type { SessionTag } from "~features/session-tags";
import { useSessionPrefetch } from "~shared/bootstrap/session-lifecycle";
import { formatRelativeTime } from "~shared/lib";
import type { SessionListEntry } from "~shared/protocol";
import { Icon, StatusDot, Text } from "~shared/ui";

export const SessionRow = React.memo(function SessionRow({
  entry,
  onResume,
  onDelete,
  tags,
}: {
  entry: SessionListEntry;
  onResume: (id: string) => void;
  onDelete: (entry: SessionListEntry) => void;
  tags: readonly SessionTag[];
}) {
  const { onMouseEnter, onMouseLeave } = useSessionPrefetch(entry.session_id);

  const handleClick = useCallback(() => {
    onResume(entry.session_id);
  }, [entry.session_id, onResume]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(entry);
    },
    [entry, onDelete],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          if ((e.target as HTMLElement).closest("[data-delete-btn]")) return;
          e.preventDefault();
          handleClick();
        }
      }}
      className="group w-full text-left px-3 py-2 rounded hover:bg-vsc-list-hover transition-colors
                 duration-fast cursor-pointer focus-ring flex flex-col gap-1 relative"
      aria-label={`Open session: ${entry.title}`}
      data-testid={`session-row-${entry.session_id}`}
    >
      <div className="flex items-center gap-1.5">
        <StatusDot
          status={
            (() => {
              if (entry.status === "running") return "running" as const;
              if (entry.status === "error") return "error" as const;
              if (entry.status === "completed") return "success" as const;
              return "idle" as const;
            })()
          }
        />
        <Text
          size="sm"
          weight="medium"
          tone="primary"
          truncate
          className="flex-1 min-w-0"
          title={entry.title}
        >
          {entry.title}
        </Text>
        <Text size="2xs" tone="ghost" mono>
          {formatRelativeTime(entry.created_at_ms)}
        </Text>
        <button
          type="button"
          data-delete-btn
          aria-label={`Delete session "${entry.title}"`}
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-0.5 rounded hover:bg-vsc-error/20
                     transition-opacity duration-fast cursor-pointer bg-transparent border-none focus-ring"
        >
          <Icon
            name="trash"
            tokenSize="xs"
            className="text-vsc-text-tertiary hover:text-vsc-error transition-colors duration-fast"
          />
        </button>
      </div>
      <div className="flex items-center gap-2 pl-4">
        <Text size="2xs" tone="tertiary">
          {entry.model_label}
        </Text>
        <Text size="2xs" tone="ghost">
          {entry.turn_count} turns
        </Text>
        <SessionCostBadge costUsd={entry.cost_usd} />
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center px-1.5 py-0 rounded-full text-2xs leading-4 font-medium"
            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            data-testid={`tag-${tag.id}`}
          >
            {tag.label}
          </span>
        ))}
      </div>
      {entry.last_message_preview && (
        <Text size="2xs" tone="ghost" truncate className="pl-4" title={entry.last_message_preview}>
          {entry.last_message_preview}
        </Text>
      )}
    </div>
  );
});
