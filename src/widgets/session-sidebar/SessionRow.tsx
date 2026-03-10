import React, { useCallback, useEffect, useRef, useState } from "react";

import { formatCost } from "../../shared/lib/formatters";
import type { SessionId, SessionListEntry } from "../../shared/protocol";
import { Button, cn, StatusDot, Text, Tooltip } from "../../shared/ui";
import { toStatusDotStatus } from "./helpers";

interface SessionRowProps {
  readonly entry: SessionListEntry;
  readonly isActive: boolean;
  readonly isPinned: boolean;
  readonly onSelect: (entry: SessionListEntry) => void;
  readonly onTogglePin: (id: SessionId) => void;
}

export const SessionRow = React.memo(function SessionRow({
  entry,
  isActive,
  isPinned,
  onSelect,
  onTogglePin,
}: SessionRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    onSelect(entry);
  }, [onSelect, entry]);

  const handleMenuToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setMenuOpen((prev) => !prev);
    },
    [],
  );

  const handlePin = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onTogglePin(entry.session_id);
      setMenuOpen(false);
    },
    [onTogglePin, entry.session_id],
  );

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const costStr = entry.cost_usd != null && entry.cost_usd > 0 ? formatCost(entry.cost_usd) : "";

  return (
    <div
      ref={rowRef}
      className={cn(
        "group relative flex w-full items-center gap-1.5 rounded px-2 py-1.5",
        "text-left transition-colors duration-normal",
        "hover:bg-vsc-list-hover cursor-pointer",
        isActive && "bg-vsc-list-active",
      )}
      data-testid="session-row"
      role="option"
      aria-selected={isActive}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(entry);
        }
      }}
      tabIndex={0}
    >
      {/* Status dot */}
      <StatusDot status={toStatusDotStatus(entry.status)} size="sm" />

      {/* Title */}
      <Text
        size="xs"
        className={cn(
          "flex-1 truncate text-vsc-fg",
          isActive && "font-medium",
        )}
      >
        {entry.title}
      </Text>

      {/* Cost */}
      {costStr && (
        <Text size="2xs" mono className="shrink-0 text-vsc-text-ghost">
          {costStr}
        </Text>
      )}

      {/* Turn count */}
      <Text size="2xs" mono className="shrink-0 text-vsc-text-ghost">
        {entry.turn_count}t
      </Text>

      {/* Menu button (visible on hover) */}
      <span
        className={cn(
          "shrink-0 opacity-0 transition-opacity duration-fast",
          "group-hover:opacity-100",
          menuOpen && "opacity-100",
        )}
      >
        <Tooltip content={isPinned ? "Unpin / Delete" : "Pin / Delete"}>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMenuToggle}
            className="p-0.5"
            aria-label="Session actions"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            icon="ellipsis-vertical"
          />
        </Tooltip>
      </span>

      {/* Dropdown menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className={cn(
            "absolute right-1 top-full z-[--z-overlay] mt-0.5",
            "min-w-[120px] rounded border border-vsc-border bg-vsc-dropdown py-1 shadow-lg",
          )}
          role="menu"
        >
          <Button
            variant="ghost"
            size="sm"
            role="menuitem"
            onClick={handlePin}
            className="flex w-full items-center gap-2 px-3 py-1 justify-start"
            icon={isPinned ? "pin-off" : "pin"}
          >
            {isPinned ? "Unpin" : "Pin"}
          </Button>
        </div>
      )}
    </div>
  );
});
