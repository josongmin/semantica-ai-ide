import React from "react";
import { useAtomValue } from "jotai";

import { mcpAppsAtomFamily, type McpAppType } from "~entities/mcp-app";

import { Badge, cn, Collapsible } from "../../shared/ui";

interface McpInteractiveAppProps { turnId: string }

const TYPE_ICONS: Record<McpAppType, string> = {
  chart: "graph",
  diagram: "type-hierarchy",
  whiteboard: "whitespace",
  form: "symbol-interface",
  table: "table",
};

const TYPE_LABELS: Record<McpAppType, string> = {
  chart: "Chart",
  diagram: "Diagram",
  whiteboard: "Whiteboard",
  form: "Form",
  table: "Table",
};

/** Renders MCP interactive app outputs (charts, diagrams, whiteboards) inline in turns. */
export const McpInteractiveApp = React.memo(function McpInteractiveApp({
  turnId,
}: McpInteractiveAppProps) {
  const apps = useAtomValue(mcpAppsAtomFamily(turnId));
  if (apps.length === 0) return null;

  return (
    <Collapsible
      title="Interactive Apps"
      icon="extensions"
      badge={`${apps.length}`}
      defaultCollapsed={false}
    >
      <div className="px-2 py-1.5 flex flex-col gap-2">
        {apps.map((app) => (
          <div
            key={app.id}
            className={cn(
              "rounded-md border border-vsc-border/30 bg-vsc-surface-2 overflow-hidden",
            )}
          >
            {/* App header */}
            <div className="flex items-center gap-1.5 px-2 py-1 border-b border-vsc-border/20">
              <span className={cn("codicon", `codicon-${TYPE_ICONS[app.type]}`, "text-vsc-info text-xs")} />
              <span className="text-2xs font-medium text-vsc-text-primary truncate min-w-0">
                {app.title}
              </span>
              <Badge text={TYPE_LABELS[app.type]} variant="info" className="ml-auto" />
              {app.serverName && (
                <span className="text-2xs text-vsc-text-ghost">{app.serverName}</span>
              )}
            </div>

            {/* App content — renders serialized data as preformatted text;
                real implementation would dispatch to chart/diagram renderers */}
            <div className="p-2 max-h-[--panel-max-h-xs] overflow-auto">
              <pre className="text-2xs text-vsc-text-secondary whitespace-pre-wrap break-words">
                {app.data}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </Collapsible>
  );
});
