import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import { useSessionTags } from "~features/session-tags";
import { useSessionLifecycle } from "~shared/bootstrap/session-lifecycle";
import { currentPageAtom, sessionListAtom } from "~shared/lib";
import { getVscodeApi } from "~shared/lib/vscodeApi";
import type { SessionListEntry } from "~shared/protocol";
import {
  Button,
  cn,
  EmptyState,
  ErrorBoundary,
  Icon,
  InlineBanner,
  SessionCardSkeleton,
  Text,
} from "~shared/ui";

import { SessionListDialogs } from "./SessionListDialogs";
import { SessionRow } from "./SessionRow";

type SortKey = "date" | "cost" | "turns";

function sortSessions(sessions: readonly SessionListEntry[], key: SortKey): SessionListEntry[] {
  const arr = [...sessions];
  switch (key) {
    case "date":
      return arr.sort((a, b) => b.created_at_ms - a.created_at_ms);
    case "cost":
      return arr.sort((a, b) => (b.cost_usd ?? 0) - (a.cost_usd ?? 0));
    case "turns":
      return arr.sort((a, b) => b.turn_count - a.turn_count);
  }
}

const sortLabels: Record<SortKey, string> = {
  date: "Date",
  cost: "Cost",
  turns: "Turns",
};

export const SessionListPage = React.memo(function SessionListPage() {
  const sessions = useAtomValue(sessionListAtom);
  const setPage = useSetAtom(currentPageAtom);
  const { createSession, resumeSession, deleteSession } = useSessionLifecycle();
  const { getTagsForSession } = useSessionTags();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [deleteTarget, setDeleteTarget] = useState<SessionListEntry | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [everHadSessions, setEverHadSessions] = useState(() => sessions.length > 0);
  if (sessions.length > 0 && !everHadSessions) setEverHadSessions(true);
  const isInitialLoad = !everHadSessions;

  useEffect(() => {
    getVscodeApi().postMessage({ type: "LOAD_SESSION_LIST" });
  }, []);

  const filtered = useMemo(() => {
    let list = sessions;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = sessions.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.last_message_preview.toLowerCase().includes(q),
      );
    }
    return sortSessions(list, sortBy);
  }, [sessions, search, sortBy]);

  const handleBack = useCallback(() => {
    setPage("chat");
  }, [setPage]);

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      deleteSession(deleteTarget.session_id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, deleteSession]);

  const cancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  return (
    <div data-testid="session-list-page" className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-vsc-border">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back to chat"
          className="p-1 rounded hover:bg-vsc-toolbar transition-colors duration-fast cursor-pointer focus-ring"
        >
          <Icon name="arrow-left" tokenSize="sm" />
        </button>
        <Text size="sm" weight="medium" tone="primary" className="flex-1">
          Sessions
        </Text>
        <Button
          variant="ghost"
          size="sm"
          icon="export"
          onClick={() => setExportOpen(true)}
          disabled={sessions.length === 0}
          data-testid="export-btn"
        >
          Export
        </Button>
        <Button variant="ghost" size="sm" icon="add" onClick={createSession}>
          New
        </Button>
      </div>

      {/* Search + Sort */}
      <div className="px-3 py-1.5 flex items-center gap-2">
        <div className="relative flex-1">
          <Icon
            name="search"
            tokenSize="sm"
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 text-vsc-text-tertiary pointer-events-none",
            )}
          />
          <input
            type="text"
            placeholder="Search sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-7 pr-2 py-1 text-sm bg-vsc-input border border-vsc-border rounded
                       focus:outline-none focus:ring-1 focus:ring-vsc-focus text-vsc-fg placeholder-vsc-text-tertiary"
            data-testid="session-search"
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {(["date", "cost", "turns"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSortBy(key)}
              className={cn(
                "px-1.5 py-0.5 text-2xs rounded transition-colors duration-fast cursor-pointer focus-ring",
                sortBy === key
                  ? "bg-vsc-button text-vsc-button-fg"
                  : "text-vsc-text-tertiary hover:bg-vsc-toolbar",
              )}
              aria-label={`Sort by ${key}`}
              data-testid={`sort-${key}`}
            >
              {sortLabels[key]}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scroll-shadow px-1">
        {isInitialLoad && sessions.length === 0 && (
          <div className="space-y-0.5 py-1" data-testid="session-list-skeleton">
            {/* Static list — index key safe */}
            {Array.from({ length: 5 }, (_, i) => (
              <SessionCardSkeleton key={i} />
            ))}
          </div>
        )}
        {!(isInitialLoad && sessions.length === 0) && filtered.length === 0 && sessions.length === 0 && (
          <EmptyState
            icon="history"
            title="No sessions yet"
            description="Start a new session to begin"
          />
        )}
        {!(isInitialLoad && sessions.length === 0) && filtered.length === 0 && sessions.length > 0 && (
          <EmptyState icon="search" title="No matching sessions" />
        )}
        {!(isInitialLoad && sessions.length === 0) && filtered.length > 0 && (
          <div className="space-y-0.5 py-1">
            {filtered.map((entry) => (
              <ErrorBoundary
                key={entry.session_id}
                fallback={<InlineBanner variant="error">Session failed to render</InlineBanner>}
              >
                <SessionRow
                  entry={entry}
                  onResume={resumeSession}
                  onDelete={setDeleteTarget}
                  tags={getTagsForSession(entry.session_id)}
                />
              </ErrorBoundary>
            ))}
          </div>
        )}
      </div>

      <SessionListDialogs
        deleteTarget={deleteTarget}
        onDeleteConfirm={confirmDelete}
        onDeleteCancel={cancelDelete}
        exportOpen={exportOpen}
        onExportClose={() => setExportOpen(false)}
      />
    </div>
  );
});
