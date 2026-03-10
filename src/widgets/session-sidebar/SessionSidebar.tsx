import React, { useCallback, useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  activeTabIdAtom,
  newTabAtom,
  openSessionTabAtom,
  pinnedSessionIdsAtom,
  sessionListAtom,
  sessionSidebarOpenAtom,
  togglePinSessionAtom,
} from "../../shared/lib";
import type { SessionId, SessionListEntry } from "../../shared/protocol";
import { Button, cn, Icon, Text, Tooltip } from "../../shared/ui";
import { GroupSection } from "./GroupSection";
import { DATE_GROUP_ORDER, getDateGroup } from "./helpers";
import { SessionRow } from "./SessionRow";
import { SummaryBar } from "./SummaryBar";

export const SessionSidebar = React.memo(function SessionSidebar() {
  const isOpen = useAtomValue(sessionSidebarOpenAtom);
  const sessions = useAtomValue(sessionListAtom);
  const activeTabId = useAtomValue(activeTabIdAtom);
  const pinnedIds = useAtomValue(pinnedSessionIdsAtom);
  const openTab = useSetAtom(openSessionTabAtom);
  const createNew = useSetAtom(newTabAtom);
  const togglePin = useSetAtom(togglePinSessionAtom);

  const [search, setSearch] = useState("");

  const handleSelect = useCallback(
    (entry: SessionListEntry) => {
      openTab(entry);
    },
    [openTab],
  );

  const handleTogglePin = useCallback(
    (id: SessionId) => {
      togglePin(id);
    },
    [togglePin],
  );

  const handleNewTab = useCallback(() => {
    createNew();
  }, [createNew]);

  // Filter sessions by search query
  const filteredSessions = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.last_message_preview.toLowerCase().includes(q),
    );
  }, [sessions, search]);

  // Group sessions by date, with pinned at top
  const grouped = useMemo(() => {
    const groups = new Map<(typeof DATE_GROUP_ORDER)[number], SessionListEntry[]>();

    for (const group of DATE_GROUP_ORDER) {
      groups.set(group, []);
    }

    for (const session of filteredSessions) {
      if (pinnedIds.has(session.session_id)) {
        groups.get("Pinned")?.push(session);
      } else {
        const group = getDateGroup(session.created_at_ms);
        groups.get(group)?.push(session);
      }
    }

    // Sort each group by most recent first
    for (const entries of groups.values()) {
      entries.sort((a, b) => b.created_at_ms - a.created_at_ms);
    }

    return groups;
  }, [filteredSessions, pinnedIds]);

  // Summary stats
  const summary = useMemo(() => {
    let totalCost = 0;
    let totalTurns = 0;
    for (const s of sessions) {
      totalCost += s.cost_usd ?? 0;
      totalTurns += s.turn_count;
    }
    return { totalCost, totalTurns, sessionCount: sessions.length };
  }, [sessions]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-[--z-overlay] flex h-full w-[min(14rem,calc(100vw-2rem))] flex-col",
        "border-r border-vsc-border glass-panel",
        "transition-transform duration-slow ease-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
      data-testid="session-sidebar"
      aria-label="Session sidebar"
      aria-hidden={!isOpen}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-vsc-border px-3 py-2">
        <Text size="xs" className="font-semibold text-vsc-fg">
          Sessions
        </Text>
        <Tooltip content="New session">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewTab}
            className="text-vsc-text-ghost hover:text-vsc-fg transition-colors duration-fast"
            aria-label="New session"
            icon="plus"
          />
        </Tooltip>
      </div>

      {/* Search */}
      <div className="px-2 py-1.5">
        <div
          className={cn(
            "flex items-center gap-1.5 rounded border border-vsc-border px-2 py-1",
            "bg-vsc-input focus-within:border-vsc-focus",
          )}
        >
          <Icon name="search" tokenSize="xs" className="shrink-0 text-vsc-text-ghost" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sessions..."
            className={cn(
              "w-full bg-transparent text-xs text-vsc-fg",
              "placeholder:text-vsc-text-ghost outline-none focus-ring",
            )}
            aria-label="Search sessions"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearch("")}
              className="shrink-0 text-vsc-text-ghost hover:text-vsc-fg transition-colors duration-fast p-0"
              aria-label="Clear search"
              icon="x"
            />
          )}
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-1 pb-1 scroll-shadow" role="listbox" aria-label="Session list" data-scroll-contain>
        {DATE_GROUP_ORDER.map((group) => {
          const entries = grouped.get(group);
          if (!entries || entries.length === 0) return null;

          return (
            <GroupSection key={group} label={group}>
              {entries.map((entry) => (
                <SessionRow
                  key={entry.session_id}
                  entry={entry}
                  isActive={activeTabId === entry.session_id}
                  isPinned={pinnedIds.has(entry.session_id)}
                  onSelect={handleSelect}
                  onTogglePin={handleTogglePin}
                />
              ))}
            </GroupSection>
          );
        })}

        {filteredSessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Icon name="inbox" tokenSize="base" className="mb-2 text-vsc-text-ghost" />
            <Text size="xs" className="text-vsc-text-ghost">
              {search ? "No matching sessions" : "No sessions yet"}
            </Text>
          </div>
        )}
      </div>

      {/* Summary Bar */}
      <SummaryBar
        totalCost={summary.totalCost}
        totalTurns={summary.totalTurns}
        sessionCount={summary.sessionCount}
      />
    </aside>
  );
});
