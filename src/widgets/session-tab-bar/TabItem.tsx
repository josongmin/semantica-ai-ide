import React, { useCallback, useState } from "react";

import type { SessionTab } from "../../shared/lib";
import type { SessionId } from "../../shared/protocol";
import { cn, Icon, StatusDot, Text } from "../../shared/ui";

const STATUS_DOT_MAP: Record<
  SessionTab["status"],
  "idle" | "running" | "success" | "info" | "error" | "paused"
> = {
  idle: "idle",
  running: "running",
  paused: "paused",
  error: "error",
  completed: "info",
};

interface TabItemProps {
  tab: SessionTab;
  index: number;
  isActive: boolean;
  isPinned: boolean;
  onSwitch: (id: SessionId) => void;
  onClose: (id: SessionId) => void;
  onContextMenu: (e: React.MouseEvent, id: SessionId) => void;
}

export const TabItem = React.memo(function TabItem({
  tab,
  index,
  isActive,
  isPinned,
  onSwitch,
  onClose,
  onContextMenu,
}: TabItemProps) {
  const [hovered, setHovered] = useState(false);

  const handleClick = useCallback(() => {
    onSwitch(tab.session_id);
  }, [onSwitch, tab.session_id]);

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose(tab.session_id);
    },
    [onClose, tab.session_id],
  );

  const handleAuxClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        onClose(tab.session_id);
      }
    },
    [onClose, tab.session_id],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      onContextMenu(e, tab.session_id);
    },
    [onContextMenu, tab.session_id],
  );

  let costLabel: string | null;
  if (tab.cost_usd == null) {
    costLabel = null;
  } else if (tab.cost_usd < 0.01) {
    costLabel = "<$0.01";
  } else {
    costLabel = `$${tab.cost_usd.toFixed(2)}`;
  }

  return (
    <div
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      draggable
      data-tab-index={index}
      className={cn(
        "group relative flex h-8 shrink-0 cursor-pointer select-none items-center gap-1.5 border-r border-vsc-tab-border px-2",
        "max-w-[180px] min-w-[80px]",
        "transition-colors duration-normal",
        isActive
          ? "bg-vsc-tab-active text-vsc-fg"
          : "bg-vsc-tab-inactive text-vsc-text-secondary hover:bg-vsc-list-hover",
        isActive && "border-b-2 border-b-transparent",
      )}
      onClick={handleClick}
      onAuxClick={handleAuxClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <StatusDot status={STATUS_DOT_MAP[tab.status]} size="sm" />

      {isPinned && (
        <Icon name="pin" tokenSize="2xs" className="shrink-0 text-vsc-text-tertiary" />
      )}

      <Text
        as="span"
        title={tab.title}
        className={cn(
          "truncate text-2xs leading-none",
          isActive ? "text-vsc-fg" : "text-vsc-text-secondary",
        )}
      >
        {tab.title}
      </Text>

      {costLabel && (
        <Text as="span" size="2xs" tone="tertiary" className="shrink-0 rounded px-1 leading-none">
          {costLabel}
        </Text>
      )}

      <button
        type="button"
        aria-label={`Close ${tab.title}`}
        className={cn(
          "ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-sm",
          "text-vsc-text-tertiary hover:bg-vsc-list-hover hover:text-vsc-fg",
          "transition-opacity duration-fast focus-ring",
          hovered || isActive ? "opacity-100" : "opacity-0",
        )}
        onClick={handleClose}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Icon name="close" tokenSize="xs" />
      </button>
    </div>
  );
});
