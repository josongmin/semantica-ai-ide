import React, { useCallback, useMemo, useRef } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { turnAtomFamily } from "~entities/message/turns";

import {
  bookmarkDrawerOpenAtom,
  bookmarkedTurnIdsAtom,
  bookmarkFilterAtom,
  bookmarkLabelsAtom,
  clearFocusedTurnAtom,
  focusedTurnIdAtom,
  useOverlayBehavior,
} from "../../shared/lib";
import type { BookmarkFilter } from "../../shared/lib/atoms/bookmarkAtoms";
import type { BookmarkLabel, TurnId } from "../../shared/protocol";
import { Badge, Button, cn, Icon, Text } from "../../shared/ui";

const FILTER_TABS: readonly { value: BookmarkFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "decision", label: "Decision" },
  { value: "fix", label: "Fix" },
  { value: "risk", label: "Risk" },
  { value: "important", label: "Important" },
];

/** Single bookmark entry row */
const BookmarkEntry = React.memo(function BookmarkEntry({
  turnId,
  label,
  onNavigate,
}: {
  readonly turnId: TurnId;
  readonly label?: BookmarkLabel;
  readonly onNavigate: (turnId: TurnId) => void;
}) {
  const turn = useAtomValue(turnAtomFamily(turnId));

  const handleClick = useCallback(() => {
    onNavigate(turnId);
  }, [turnId, onNavigate]);

  if (!turn) return null;

  const time = new Date(turn.created_at_ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="w-full px-3 py-2 text-left gap-2 hover:bg-vsc-list-hover transition-[background-color] duration-fast rounded"
    >
      <Icon name="star-full" tokenSize="2xs" className="text-vsc-warning shrink-0" />
      <div className="flex-1 min-w-0">
        <Text size="xs" truncate>
          Turn {turnId}
        </Text>
        <div className="flex items-center gap-1.5">
          <Text size="2xs" tone="ghost" mono>
            {time}
          </Text>
          {label && <Badge text={label} />}
        </div>
      </div>
      <Icon name="arrow-right" tokenSize="2xs" className="text-vsc-text-ghost shrink-0" />
    </Button>
  );
});

export const BookmarkDrawer = React.memo(function BookmarkDrawer() {
  const [drawerOpen, setDrawerOpen] = useAtom(bookmarkDrawerOpenAtom);
  const [filter, setFilter] = useAtom(bookmarkFilterAtom);
  const bookmarkedIds = useAtomValue(bookmarkedTurnIdsAtom);
  const labels = useAtomValue(bookmarkLabelsAtom);
  const setFocusedTurnId = useSetAtom(focusedTurnIdAtom);
  const clearFocused = useSetAtom(clearFocusedTurnAtom);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredIds = useMemo(() => {
    const ids = Array.from(bookmarkedIds);
    if (filter === "all") return ids;
    return ids.filter((id) => labels.get(id) === filter);
  }, [bookmarkedIds, labels, filter]);

  const handleNavigate = useCallback(
    (turnId: TurnId) => {
      setFocusedTurnId(turnId);
      clearFocused();
      // Dispatch custom event for MessageList to scroll
      window.dispatchEvent(new CustomEvent("scroll-to-turn", { detail: { turnId } }));
    },
    [setFocusedTurnId, clearFocused],
  );

  const handleClose = useCallback(() => {
    setDrawerOpen(false);
  }, [setDrawerOpen]);

  const { mounted, exiting, handleTabKeyDown } = useOverlayBehavior({
    id: "bookmark-drawer",
    type: "drawer",
    open: drawerOpen,
    onClose: handleClose,
    containerRef,
    escape: true,
    focusTrap: true,
  });

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      onKeyDown={handleTabKeyDown}
      tabIndex={-1}
      className={cn(
        "border-l border-vsc-border glass-panel w-64 max-w-[calc(100vw-2rem)] flex flex-col overflow-hidden outline-none",
        exiting
          ? "animate-[slide-out-right_var(--duration-normal)_var(--ease-default)]"
          : "animate-[slide-in-right_var(--duration-slow)_var(--ease-spring)]",
      )}
      role="complementary"
      aria-label="Bookmarked turns"
      data-testid="bookmark-drawer"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-vsc-border">
        <Icon name="bookmark" tokenSize="sm" className="text-vsc-warning" />
        <Text size="sm" weight="medium" className="flex-1">
          Bookmarks
        </Text>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          aria-label="Close bookmarks"
          className="p-0.5"
        >
          <Icon name="close" tokenSize="xs" className="text-vsc-text-tertiary" />
        </Button>
      </div>

      {/* Filter tabs */}
      <div
        className="flex gap-1 px-2 py-1.5 border-b border-vsc-border overflow-x-auto"
        role="tablist"
        aria-label="Bookmark filters"
      >
        {FILTER_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant="ghost"
            size="sm"
            role="tab"
            aria-selected={filter === tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(
              "px-2 py-0.5 rounded text-2xs whitespace-nowrap overflow-hidden text-ellipsis",
              filter === tab.value
                ? "bg-vsc-button text-vsc-button-fg"
                : "text-vsc-text-secondary hover:bg-vsc-toolbar transition-colors duration-fast",
            )}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Bookmark list */}
      <div className="flex-1 overflow-y-auto py-1 scroll-shadow" data-scroll-contain>
        {filteredIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center animate-[fade-in_var(--duration-slow)_var(--ease-default)]">
            <Icon name="star-empty" tokenSize="base" className="text-vsc-text-ghost mb-2" />
            <Text size="xs" tone="ghost">
              {filter === "all" ? "No bookmarks yet" : `No ${filter} bookmarks`}
            </Text>
          </div>
        ) : (
          filteredIds.map((turnId) => (
            <BookmarkEntry
              key={turnId}
              turnId={turnId}
              label={labels.get(turnId)}
              onNavigate={handleNavigate}
            />
          ))
        )}
      </div>
    </div>
  );
});
