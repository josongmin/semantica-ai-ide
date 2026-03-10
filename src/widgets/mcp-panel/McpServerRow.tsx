import React, { useCallback, useState } from "react";
import { useAtomValue } from "jotai";

import { mcpServerAtomFamily, type McpServerStatus } from "~entities/mcp";

import {
  Badge,
  Button,
  ConfirmDialog,
  StatusDot,
  type StatusDotProps,
  Text,
} from "../../shared/ui";

interface McpServerRowProps {
  id: string;
  onRemove: (serverId: string) => void;
  onToggle: (serverId: string, enabled: boolean) => void;
}

const statusToDot: Record<McpServerStatus, StatusDotProps["status"]> = {
  connecting: "paused",
  connected: "success",
  disconnected: "idle",
  error: "error",
  disabled: "idle",
};

export const McpServerRow = React.memo(function McpServerRow({
  id,
  onRemove,
  onToggle,
}: McpServerRowProps) {
  const server = useAtomValue(mcpServerAtomFamily(id));
  const [confirmRemove, setConfirmRemove] = useState(false);

  const handleRemove = useCallback(() => {
    onRemove(id);
    setConfirmRemove(false);
  }, [id, onRemove]);

  const handleToggle = useCallback(() => {
    if (!server) return;
    onToggle(id, !server.enabled);
  }, [id, server, onToggle]);

  if (!server) return null;

  const dotStatus = statusToDot[server.status];

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 border-b border-vsc-border last:border-b-0 hover:bg-vsc-list-hover transition-colors duration-fast"
      data-testid={`mcp-server-row-${id}`}
    >
      <StatusDot status={dotStatus} size="sm" />
      <Text size="xs" weight="medium" className="flex-1 min-w-0" truncate>
        {server.name}
      </Text>
      {server.tool_count > 0 && <Badge text={`${server.tool_count} tools`} variant="default" />}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        aria-label={server.enabled ? `Disable ${server.name}` : `Enable ${server.name}`}
        data-testid={`toggle-server-${id}`}
      >
        {server.enabled ? "Disable" : "Enable"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirmRemove(true)}
        aria-label={`Remove ${server.name}`}
        data-testid={`remove-server-${id}`}
      >
        Remove
      </Button>
      <ConfirmDialog
        open={confirmRemove}
        onConfirm={handleRemove}
        onCancel={() => setConfirmRemove(false)}
        title="Remove MCP server"
        description={`Remove "${server.name}"? You can re-add it later.`}
        confirmLabel="Remove"
        confirmVariant="danger"
      />
    </div>
  );
});
