import React, { useCallback } from "react";
import { useAtom, useAtomValue } from "jotai";

import {
  activeIntegrationsAtom,
  integrationPanelOpenAtom,
  integrationsListAtom,
} from "../../features/integration-status";
import { getVscodeApi } from "../../shared/lib/vscodeApi";
import type { IntegrationConnection } from "../../shared/protocol";
import { Badge, Button, cn, EmptyState, Icon, StatusDot, Text, Tooltip } from "../../shared/ui";

// ─── Platform Icons ──────────────────────────────────────────

const platformIcons: Record<IntegrationConnection["platform"], string> = {
  slack: "comment-discussion",
  teams: "organization",
  discord: "megaphone",
  custom: "plug",
};

const platformLabels: Record<IntegrationConnection["platform"], string> = {
  slack: "Slack",
  teams: "Teams",
  discord: "Discord",
  custom: "Custom",
};

const statusVariants: Record<IntegrationConnection["status"], "success" | "error" | "paused"> = {
  connected: "success",
  disconnected: "error",
  syncing: "paused",
};

// ─── Helpers ─────────────────────────────────────────────────

function formatSyncTime(ms: number | undefined): string {
  if (ms == null) return "Never synced";
  const diff = Date.now() - ms;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

// ─── Integration Row ─────────────────────────────────────────

interface IntegrationRowProps {
  connection: IntegrationConnection;
  onSendUpdate: (id: string) => void;
  onDisconnect: (id: string) => void;
}

const IntegrationRow = React.memo(function IntegrationRow({
  connection,
  onSendUpdate,
  onDisconnect,
}: IntegrationRowProps) {
  const handleSend = useCallback(() => onSendUpdate(connection.id), [connection.id, onSendUpdate]);
  const handleDisconnect = useCallback(
    () => onDisconnect(connection.id),
    [connection.id, onDisconnect],
  );

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded border border-vsc-border",
        "bg-vsc-bg-secondary hover:bg-vsc-bg-tertiary transition-colors duration-fast",
      )}
      data-testid={`integration-row-${connection.id}`}
      role="listitem"
    >
      <Icon
        name={platformIcons[connection.platform]}
        tokenSize="sm"
        className="text-vsc-text-secondary shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Text size="sm" weight="medium" className="truncate min-w-0">
            {connection.channel}
          </Text>
          <StatusDot status={statusVariants[connection.status]} />
          <Badge text={platformLabels[connection.platform]} variant="default" />
        </div>
        <Text size="2xs" tone="tertiary" className="mt-0.5">
          {formatSyncTime(connection.last_sync_ms)}
        </Text>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {connection.status === "connected" && (
          <Tooltip content="Send Update">
            <Button variant="ghost" size="sm" onClick={handleSend} aria-label="Send Update">
              <Icon name="send" tokenSize="2xs" />
            </Button>
          </Tooltip>
        )}
        {connection.status !== "disconnected" && (
          <Tooltip content="Disconnect">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              aria-label={`Disconnect ${connection.channel}`}
            >
              <Icon name="debug-disconnect" tokenSize="2xs" />
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );
});

// ─── Integration Status Panel ────────────────────────────────

/**
 * Integration Status Panel: Shows connected integrations (Slack, Teams, etc.)
 * with status dots, sync times, and manual sync controls.
 */
export const IntegrationStatusPanel = React.memo(function IntegrationStatusPanel() {
  const [panelOpen, setPanelOpen] = useAtom(integrationPanelOpenAtom);
  const integrations = useAtomValue(integrationsListAtom);
  const activeIntegrations = useAtomValue(activeIntegrationsAtom);

  const handleClose = useCallback(() => {
    setPanelOpen(false);
  }, [setPanelOpen]);

  const handleSendUpdate = useCallback((connectionId: string) => {
    getVscodeApi().postMessage({
      type: "SEND_INTEGRATION_UPDATE",
      connection_id: connectionId,
      message: "",
    });
  }, []);

  const handleDisconnect = useCallback((connectionId: string) => {
    getVscodeApi().postMessage({
      type: "DISCONNECT_INTEGRATION",
      connection_id: connectionId,
    });
  }, []);

  if (!panelOpen) return null;

  return (
    <div
      className="flex flex-col gap-2 p-3 border-b border-vsc-border bg-vsc-bg"
      data-testid="integration-status-panel"
      role="region"
      aria-label="Integration Status"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="plug" tokenSize="sm" className="text-vsc-text-secondary" />
          <Text size="sm" weight="semibold">
            Integrations
          </Text>
          {activeIntegrations.length > 0 && (
            <Badge text={`${activeIntegrations.length} active`} variant="success" />
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleClose} aria-label="Close Integrations">
          <Icon name="close" tokenSize="2xs" />
        </Button>
      </div>

      {/* Integration list */}
      {integrations.length === 0 ? (
        <EmptyState
          icon="plug"
          title="No integrations"
          description="Connect Slack, Teams, or other services to sync updates."
        />
      ) : (
        <div className="flex flex-col gap-1.5" role="list" aria-label="Integrations list">
          {integrations.map((conn) => (
            <IntegrationRow
              key={conn.id}
              connection={conn}
              onSendUpdate={handleSendUpdate}
              onDisconnect={handleDisconnect}
            />
          ))}
        </div>
      )}
    </div>
  );
});
