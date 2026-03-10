import React, { useCallback, useState } from "react";
import { useAtom, useAtomValue } from "jotai";

import { linkedTicketAtom, ticketSearchDialogOpenAtom } from "../../features/ticket-link";
import { ticketLinkPanelVisibleAtom } from "../../shared/lib/atoms/sidebarPanelAtoms";
import { getVscodeApi } from "../../shared/lib/vscodeApi";
import type { LinkedTicket } from "../../shared/protocol";
import { Badge, Button, cn, Icon, Text, Tooltip } from "../../shared/ui";

// ─── Platform Config ─────────────────────────────────────────

const platformIcons: Record<LinkedTicket["platform"], string> = {
  linear: "issues",
  jira: "tasklist",
  github: "github",
};

const platformLabels: Record<LinkedTicket["platform"], string> = {
  linear: "Linear",
  jira: "Jira",
  github: "GitHub",
};

const statusVariants: Record<string, "success" | "warning" | "error" | "default"> = {
  done: "success",
  closed: "success",
  "in progress": "warning",
  "in review": "warning",
  open: "default",
  todo: "default",
  backlog: "default",
  blocked: "error",
};

function getStatusVariant(status: string): "success" | "warning" | "error" | "default" {
  return statusVariants[status.toLowerCase()] ?? "default";
}

// ─── Ticket Search Dialog ────────────────────────────────────

interface TicketSearchDialogProps {
  onLink: (key: string, platform: string) => void;
  onClose: () => void;
}

const TicketSearchDialog = React.memo(function TicketSearchDialog({
  onLink,
  onClose,
}: TicketSearchDialogProps) {
  const [searchKey, setSearchKey] = useState("");
  const [platform, setPlatform] = useState<string>("linear");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchKey.trim()) {
        onLink(searchKey.trim(), platform);
      }
    },
    [searchKey, platform, onLink],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 p-2 border border-vsc-border rounded bg-vsc-bg-secondary"
      data-testid="ticket-search-dialog"
    >
      <div className="flex items-center gap-1">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="px-2 py-1 text-sm rounded border border-vsc-border bg-vsc-bg text-vsc-text focus:outline-none focus:border-vsc-focus"
          aria-label="Ticket platform"
        >
          <option value="linear">Linear</option>
          <option value="jira">Jira</option>
          <option value="github">GitHub</option>
        </select>
        <input
          type="text"
          placeholder="Ticket key (e.g. ENG-123)"
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value)}
          className="flex-1 px-2 py-1 text-sm rounded border border-vsc-border bg-vsc-bg text-vsc-text placeholder:text-vsc-text-tertiary focus:outline-none focus:border-vsc-focus"
          aria-label="Ticket key"
          autoFocus
        />
      </div>
      <div className="flex items-center gap-1 justify-end">
        <Button variant="ghost" size="sm" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" type="submit" disabled={!searchKey.trim()}>
          Link
        </Button>
      </div>
    </form>
  );
});

// ─── Linked Ticket Display ───────────────────────────────────

interface LinkedTicketCardProps {
  ticket: LinkedTicket;
  onUnlink: () => void;
  onSync: () => void;
}

const LinkedTicketCard = React.memo(function LinkedTicketCard({
  ticket,
  onUnlink,
  onSync,
}: LinkedTicketCardProps) {
  const handleOpenUrl = useCallback(() => {
    getVscodeApi().postMessage({ type: "OPEN_FILE", file_path: ticket.url });
  }, [ticket.url]);

  return (
    <div
      className={cn(
        "flex items-start gap-2 p-2 rounded border border-vsc-border",
        "bg-vsc-bg-secondary border-l-2 border-l-vsc-focus",
      )}
      data-testid="linked-ticket-card"
    >
      <Icon
        name={platformIcons[ticket.platform]}
        tokenSize="sm"
        className="text-vsc-text-secondary shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleOpenUrl}
            className="cursor-pointer bg-transparent border-none focus-ring rounded"
          >
            <Text size="sm" weight="semibold" className="text-vsc-link">
              {ticket.key}
            </Text>
          </button>
          <Badge text={platformLabels[ticket.platform]} variant="default" />
          <Badge text={ticket.status} variant={getStatusVariant(ticket.status)} />
        </div>
        <Text size="xs" tone="secondary" className="mt-0.5 truncate min-w-0">
          {ticket.title}
        </Text>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Tooltip content="Sync status">
          <Button variant="ghost" size="sm" onClick={onSync} aria-label="Sync ticket status">
            <Icon name="sync" tokenSize="2xs" />
          </Button>
        </Tooltip>
        <Tooltip content="Unlink ticket">
          <Button variant="ghost" size="sm" onClick={onUnlink} aria-label="Unlink ticket">
            <Icon name="link-external" tokenSize="2xs" />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
});

// ─── Ticket Link Panel ───────────────────────────────────────

/**
 * Ticket Link Panel: Display and manage the linked ticket for the current session.
 * Shows ticket key, title, status with sync and unlink controls.
 */
export const TicketLinkPanel = React.memo(function TicketLinkPanel() {
  const visible = useAtomValue(ticketLinkPanelVisibleAtom);
  const ticket = useAtomValue(linkedTicketAtom);
  const [searchOpen, setSearchOpen] = useAtom(ticketSearchDialogOpenAtom);

  const handleLink = useCallback(
    (key: string, platform: string) => {
      getVscodeApi().postMessage({ type: "LINK_TICKET", ticket_key: key, platform });
      setSearchOpen(false);
    },
    [setSearchOpen],
  );

  const handleUnlink = useCallback(() => {
    if (ticket) {
      getVscodeApi().postMessage({ type: "UNLINK_TICKET", ticket_id: ticket.id });
    }
  }, [ticket]);

  const handleSync = useCallback(() => {
    if (ticket) {
      getVscodeApi().postMessage({ type: "SYNC_TICKET_STATUS", ticket_id: ticket.id });
    }
  }, [ticket]);

  if (!visible) return null;

  return (
    <div
      className="flex flex-col gap-2 p-3 border-b border-vsc-border bg-vsc-bg"
      data-testid="ticket-link-panel"
      role="region"
      aria-label="Ticket Link"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="issues" tokenSize="sm" className="text-vsc-text-secondary" />
          <Text size="sm" weight="semibold">
            Linked Ticket
          </Text>
        </div>
        {!ticket && !searchOpen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchOpen(true)}
            aria-label="Link Ticket"
          >
            <Icon name="add" tokenSize="2xs" />
            <span className="ml-1 text-xs">Link Ticket</span>
          </Button>
        )}
      </div>

      {/* Search dialog */}
      {searchOpen && (
        <TicketSearchDialog onLink={handleLink} onClose={() => setSearchOpen(false)} />
      )}

      {/* Linked ticket display */}
      {ticket ? (
        <LinkedTicketCard ticket={ticket} onUnlink={handleUnlink} onSync={handleSync} />
      ) : (
        !searchOpen && (
          <Text size="xs" tone="tertiary">
            No ticket linked to this session.
          </Text>
        )
      )}
    </div>
  );
});
