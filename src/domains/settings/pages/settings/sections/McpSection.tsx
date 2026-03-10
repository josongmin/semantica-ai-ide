import React, { useCallback, useState } from "react";

import { McpServerRow } from "~widgets/mcp-panel/McpServerRow";
import { useMcpManager } from "~features/mcp-manager";
import { Button, EmptyState, Icon, Input, Text } from "~shared/ui";

export const McpSection = React.memo(function McpSection() {
  const { serverIds, addServer, removeServer, toggleServer } = useMcpManager();

  const [serverUrl, setServerUrl] = useState("");
  const [serverName, setServerName] = useState("");

  const canAdd = serverUrl.trim().length > 0 && serverName.trim().length > 0;

  const handleAddServer = useCallback(() => {
    const trimmedUrl = serverUrl.trim();
    const trimmedName = serverName.trim();
    if (!trimmedUrl || !trimmedName) return;
    addServer(trimmedUrl, trimmedName);
    setServerUrl("");
    setServerName("");
  }, [serverUrl, serverName, addServer]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && canAdd) {
        e.preventDefault();
        handleAddServer();
      }
    },
    [canAdd, handleAddServer],
  );

  return (
    <div className="px-6 py-6 space-y-4">
      {/* ── Server List ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Text as="div" size="2xs" weight="medium" tone="ghost" className="tracking-wider">
            Servers
          </Text>
          {serverIds.length > 0 && (
            <Text size="2xs" tone="ghost">({serverIds.length})</Text>
          )}
        </div>

        <div className="rounded-xl border border-vsc-border overflow-hidden">
          {serverIds.length === 0 ? (
            <EmptyState icon="plug" title="No MCP servers configured" />
          ) : (
            serverIds.map((id) => (
              <McpServerRow key={id} id={id} onRemove={removeServer} onToggle={toggleServer} />
            ))
          )}
        </div>
      </div>

      {/* ── Add Server ── */}
      <div className="space-y-3">
        <Text as="div" size="2xs" weight="medium" tone="ghost" className="tracking-wider mb-2">
          Add server
        </Text>

        <div className="rounded-xl bg-vsc-surface-1 border border-vsc-border p-3 space-y-4">
          {/* Name field */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5">
              <Icon name="tag" tokenSize="2xs" className="text-vsc-text-ghost" />
              <Text size="2xs" weight="medium" tone="tertiary">Name</Text>
            </label>
            <Input
              type="text"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="My MCP Server"
              aria-label="MCP server name"
            />
          </div>

          {/* URL field */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5">
              <Icon name="link" tokenSize="2xs" className="text-vsc-text-ghost" />
              <Text size="2xs" weight="medium" tone="tertiary">URL</Text>
            </label>
            <Input
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="wss://example.com/mcp"
              aria-label="MCP server URL"
            />
          </div>

          {/* Add button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddServer}
            disabled={!canAdd}
            icon="add"
            className="w-full"
            aria-label="Add MCP server"
          >
            Add Server
          </Button>
        </div>
      </div>
    </div>
  );
});
