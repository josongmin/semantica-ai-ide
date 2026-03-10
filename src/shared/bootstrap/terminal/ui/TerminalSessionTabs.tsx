/**
 * TerminalSessionTabs — Multi-session tab bar
 *
 * Displays terminal sessions as tabs with status indicators.
 * Supports: create new, close, switch, provenance badges.
 */

import { memo, useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import type { TerminalSessionId } from "~shared/protocol/types/core";
import type { TerminalSession } from "~shared/protocol/types/terminal";
import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import {
  activeTerminalSessionIdAtom,
  removeTerminalSessionAtom,
  terminalSessionListAtom,
} from "../model/atoms";
import type { SessionProvenance, SessionStatus, TerminalSessionMeta } from "../model/types";

// ─── Helpers ───────────────────────────────────────────────

function getStatusColor(status: SessionStatus): string {
  switch (status) {
    case "running":
      return "bg-vsc-success";
    case "starting":
      return "bg-vsc-info";
    case "exited":
      return "bg-vsc-text-tertiary";
    case "failed":
      return "bg-vsc-error";
  }
}

function getProvenanceIconName(provenance: SessionProvenance): string | null {
  switch (provenance.source) {
    case "agent":
      return "hubot";
    case "task":
      return "tasklist";
    case "system":
      return "gear";
    case "user":
      return null;
  }
}

/** Extract the last directory name from a cwd path */
function shortCwd(cwd: string): string {
  if (!cwd) return "";
  const parts = cwd.replace(/\/+$/, "").split("/");
  return parts[parts.length - 1] ?? cwd;
}

/** Compact status label */
function statusLabel(status: SessionStatus, exitCode?: number): string {
  switch (status) {
    case "running":
      return "";
    case "starting":
      return "starting…";
    case "exited":
      return exitCode !== undefined ? `exit ${exitCode}` : "exited";
    case "failed":
      return "failed";
  }
}

// ─── Tab Item ──────────────────────────────────────────────

interface TabItemProps {
  session: TerminalSessionMeta | TerminalSession;
  isActive: boolean;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
}

const TabItem = memo(function TabItem({ session, isActive, onSelect, onClose }: TabItemProps) {
  const provenanceIcon = getProvenanceIconName(session.provenance as SessionProvenance);
  const status = statusLabel(session.status as SessionStatus, session.exitCode);

  return (
    <div
      role="tab"
      tabIndex={isActive ? 0 : -1}
      aria-selected={isActive}
      className={cn(
        "group flex items-center gap-1.5 px-2 py-1.5 text-2xs cursor-pointer",
        "border-r-2 transition-colors duration-fast",
        "hover:bg-vsc-surface-1",
        isActive
          ? "border-vsc-accent text-vsc-text-primary bg-vsc-surface-1"
          : "border-transparent text-vsc-text-secondary",
      )}
      onClick={() => onSelect(session.sessionId)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(session.sessionId); }}
      title={`${session.cwd} (${session.shellType} · pid ${session.pid})`}
    >
      {/* Status dot */}
      <span className={cn("mt-0.5 inline-block h-1.5 w-1.5 rounded-full shrink-0 self-start", getStatusColor(session.status as SessionStatus))} />

      {/* Two-line info */}
      <div className="flex-1 min-w-0">
        {/* Line 1: shell + provenance + status */}
        <div className="flex items-center gap-1">
          {provenanceIcon && (
            <Icon name={provenanceIcon} size={10} className="text-vsc-text-tertiary shrink-0" />
          )}
          <span className="truncate font-medium">{session.shellType}</span>
          {status && (
            <span className="text-vsc-text-tertiary shrink-0">· {status}</span>
          )}
        </div>
        {/* Line 2: cwd */}
        <div className="truncate text-3xs text-vsc-text-tertiary leading-tight">
          {shortCwd(session.cwd)}
        </div>
      </div>

      {/* Close button */}
      <button
        type="button"
        className={cn(
          "rounded p-0.5 shrink-0 self-start",
          "opacity-0 group-hover:opacity-100",
          "hover:bg-vsc-error/20 hover:text-vsc-error",
          "transition-opacity duration-fast",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onClose(session.sessionId);
        }}
        title="Close session"
      >
        <Icon name="close" size={10} />
      </button>
    </div>
  );
});

// ─── Tab Bar ───────────────────────────────────────────────

export interface TerminalSessionTabsProps {
  onCreateSession?: () => void;
  className?: string;
}

export const TerminalSessionTabs = memo(function TerminalSessionTabs({
  onCreateSession,
  className,
}: TerminalSessionTabsProps) {
  const sessions = useAtomValue(terminalSessionListAtom);
  const activeId = useAtomValue(activeTerminalSessionIdAtom);
  const setActiveId = useSetAtom(activeTerminalSessionIdAtom);
  const removeSession = useSetAtom(removeTerminalSessionAtom);

  const handleSelect = useCallback(
    (id: string) => setActiveId(id as TerminalSessionId),
    [setActiveId],
  );

  const handleClose = useCallback(
    (id: string) => removeSession(id as TerminalSessionId),
    [removeSession],
  );

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-vsc-surface-0",
        "overflow-y-auto scrollbar-none",
        className,
      )}
      role="tablist"
      aria-orientation="vertical"
      aria-label="Terminal sessions"
    >
      {sessions.map((session) => (
        <TabItem
          key={session.sessionId}
          session={session}
          isActive={session.sessionId === activeId}
          onSelect={handleSelect}
          onClose={handleClose}
        />
      ))}

      {/* New session button */}
      {onCreateSession && (
        <button
          type="button"
          className={cn(
            "flex items-center gap-1 px-2 py-1 text-2xs",
            "text-vsc-text-tertiary hover:text-vsc-text-secondary",
            "hover:bg-vsc-surface-1 transition-colors duration-fast",
          )}
          onClick={onCreateSession}
          title="New terminal session"
        >
          <Icon name="add" size={12} />
          <span>New</span>
        </button>
      )}
    </div>
  );
});
