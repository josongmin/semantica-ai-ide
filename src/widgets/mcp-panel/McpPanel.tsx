import React, { useCallback, useState } from "react";

import { useMcpManager } from "../../features/mcp-manager";
import { Button, EmptyState, Input, Text } from "../../shared/ui";
import { McpServerRow } from "./McpServerRow";

export const McpPanel = React.memo(function McpPanel() {
  const { panelVisible, serverIds, addServer, removeServer, toggleServer } = useMcpManager();

  const [serverUrl, setServerUrl] = useState("");
  const [serverName, setServerName] = useState("");

  const handleAddServer = useCallback(() => {
    const trimmedUrl = serverUrl.trim();
    const trimmedName = serverName.trim();
    if (!trimmedUrl || !trimmedName) return;

    addServer(trimmedUrl, trimmedName);
    setServerUrl("");
    setServerName("");
  }, [serverUrl, serverName, addServer]);

  if (!panelVisible) return null;

  return (
    <div
      className="flex flex-col border-t border-vsc-border bg-vsc-surface-1"
      role="region"
      aria-label="MCP servers"
      data-testid="mcp-panel"
    >
      {/* Header */}
      <div className="px-3 py-1 border-b border-vsc-border sticky top-0 bg-vsc-surface-1 z-[--z-sticky]">
        <Text size="3xs" weight="medium" tone="tertiary" className="tracking-wide">
          MCP Servers ({serverIds.length})
        </Text>
      </div>

      {/* Server list */}
      <div role="list" className="overflow-y-auto scroll-shadow max-h-[--panel-max-h-sm] stagger-children">
        {serverIds.length === 0 ? (
          <EmptyState icon="plug" title="No MCP servers configured" />
        ) : (
          serverIds.map((id) => (
            <McpServerRow key={id} id={id} onRemove={removeServer} onToggle={toggleServer} />
          ))
        )}
      </div>

      {/* Add server form */}
      <div
        className="px-3 py-2 border-t border-vsc-border flex flex-col gap-1.5"
        data-testid="add-server-form"
      >
        <Text size="3xs" weight="medium" tone="tertiary" className="tracking-wide">
          Add Server
        </Text>
        <Input
          type="text"
          size="sm"
          value={serverName}
          onChange={(e) => setServerName(e.target.value)}
          placeholder="Server name"
          aria-label="MCP server name"
          data-testid="server-name-input"
        />
        <div className="flex gap-1.5">
          <Input
            type="url"
            size="sm"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="wss://example.com/mcp"
            className="flex-1"
            aria-label="MCP server URL"
            data-testid="server-url-input"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddServer}
            disabled={!serverUrl.trim() || !serverName.trim()}
            aria-label="Add MCP server"
            data-testid="add-server-button"
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
});
