import React, { memo } from "react";

import type { FileChangeStatus } from "~shared/protocol";
import { cn, FileIcon, Icon } from "~shared/ui";

import {
  INDENT_PX,
  ROW_HEIGHT,
  STATUS_BG,
  STATUS_COLOR,
  STATUS_LETTER,
  STATUS_LETTER_COLOR,
} from "./constants";
import type { AgentPresence } from "./helpers";

export const SidebarRow = memo(function SidebarRow({
  depth,
  label,
  description,
  status,
  isFolder,
  folderOpen: _folderOpen,
  chevron,
  chevronOpen,
  onClick,
  title,
  badge,
  onBadgeClick,
  agents,
  ...rest
}: {
  depth: number;
  label: string;
  description?: string;
  status?: FileChangeStatus;
  isFolder?: boolean;
  folderOpen?: boolean;
  chevron?: boolean;
  chevronOpen?: boolean;
  onClick?: () => void;
  title?: string;
  badge?: string;
  onBadgeClick?: () => void;
  agents?: readonly AgentPresence[];
} & React.AriaAttributes) {
  const statusColor: string | undefined = status ? STATUS_COLOR[status] : undefined;
  const statusBg: string | undefined = status ? STATUS_BG[status] : undefined;

  return (
    <button
      type="button"
      className={cn(
        "group/row flex items-center w-full pr-4 gap-0.5",
        "bg-transparent border-none cursor-pointer text-left",
        "hover:bg-vsc-list-hover/60 active:bg-vsc-list-active-bg",
        "transition-colors duration-fast focus-ring rounded-none",
        statusBg,
      )}
      style={{ paddingLeft: `${depth * INDENT_PX + 6}px`, height: ROW_HEIGHT }}
      onClick={onClick}
      title={title}
      {...rest}
    >
      {/* Chevron or spacer */}
      {chevron ? (
        <Icon
          name="chevron-right"
          tokenSize="2xs"
          className={cn(
            "shrink-0 transition-transform duration-normal text-vsc-text-tertiary",
            chevronOpen && "rotate-90",
          )}
        />
      ) : (
        <span className="w-3 shrink-0" />
      )}

      {/* Icon */}
      {isFolder ? (
        <Icon
          name={chevronOpen ? "folder-opened" : "folder"}
          size={14}
          className="shrink-0 text-vsc-text-tertiary"
        />
      ) : (
        <FileIcon name={label} size={14} />
      )}

      {/* Label */}
      <span className={cn("truncate text-sm leading-none text-vsc-fg/90", statusColor)}>
        {label}
      </span>

      {/* Folder path description */}
      {description && (
        <span className="truncate text-2xs text-vsc-text-ghost leading-none">{description}</span>
      )}

      {/* Agent presence dots */}
      {agents && agents.length > 0 && (
        <span className="flex items-center gap-0.5 ml-1 shrink-0">
          {agents.map((a) => (
            <span
              key={`${a.agentName}-${a.status}`}
              className={cn(
                "w-1.5 h-1.5 rounded-full shrink-0",
                a.color,
                a.status === "active" && "animate-pulse",
                a.status === "queued" && "opacity-50",
                a.status === "done" && "opacity-30",
              )}
              title={`${a.agentName} — ${a.status}`}
            />
          ))}
        </span>
      )}

      {/* Status letter indicator (M/A/D/R) */}
      {status && (
        <span
          className={cn(
            "ml-auto shrink-0 text-2xs font-bold leading-none px-1 py-0.5 rounded",
            STATUS_LETTER_COLOR[status],
            "opacity-0 group-hover/row:opacity-100 transition-opacity duration-fast",
          )}
        >
          {STATUS_LETTER[status]}
        </span>
      )}

      {/* Status dot (visible by default, hides on hover when letter shows) */}
      {status && (
        <span
          className={cn(
            "ml-auto shrink-0 size-1 rounded-full",
            status === "added" && "bg-vsc-success",
            status === "modified" && "bg-vsc-warning",
            status === "deleted" && "bg-vsc-error",
            status === "renamed" && "bg-vsc-info",
            "group-hover/row:opacity-0 transition-opacity duration-fast",
          )}
        />
      )}

      {/* Turn permalink badge */}
      {badge && !status && (
        <span
          role="button"
          tabIndex={0}
          className="ml-auto shrink-0 px-1 rounded text-2xs leading-snug bg-vsc-badge-bg text-vsc-badge-fg hover:bg-vsc-info/20 cursor-pointer transition-colors duration-fast focus-ring"
          aria-label="Badge action"
          onClick={(e) => {
            e.stopPropagation();
            onBadgeClick?.();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              e.preventDefault();
              onBadgeClick?.();
            }
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
});
