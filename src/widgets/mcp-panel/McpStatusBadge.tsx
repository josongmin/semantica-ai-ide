import React from "react";
import { useAtomValue } from "jotai";

import { connectedServerCountAtom } from "~entities/mcp";

import { StatusDot, Text } from "../../shared/ui";

export const McpStatusBadge = React.memo(function McpStatusBadge() {
  const count = useAtomValue(connectedServerCountAtom);

  const dotStatus = count > 0 ? "success" : "idle";

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-vsc-surface-2 border border-vsc-border"
      data-testid="mcp-status-badge"
      aria-label={`${count} MCP server${count !== 1 ? "s" : ""} connected`}
    >
      <StatusDot status={dotStatus} size="sm" />
      <Text size="2xs" tone="secondary" mono>
        {count} MCP
      </Text>
    </span>
  );
});
