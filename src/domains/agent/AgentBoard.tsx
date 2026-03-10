import React from "react";

import { Badge, Icon } from "~shared/ui";

interface BoardColumn {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly color: string;
}

const COLUMNS: BoardColumn[] = [
  { id: "queued", label: "Queued", icon: "circle-outline", color: "text-vsc-text-ghost" },
  { id: "running", label: "Running", icon: "sync~spin", color: "text-vsc-info" },
  { id: "done", label: "Done", icon: "check", color: "text-vsc-success" },
];

export const AgentBoard = React.memo(function AgentBoard() {
  return (
    <div className="flex-1 flex gap-3 p-3 min-h-0 overflow-x-auto">
      {COLUMNS.map((col) => (
        <div
          key={col.id}
          className="flex flex-col w-[200px] shrink-0 bg-vsc-surface-1 rounded-md overflow-hidden border border-vsc-border"
        >
          {/* Column Header */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-vsc-border bg-vsc-surface-2/50">
            <Icon name={col.icon} tokenSize="2xs" className={col.color} />
            <span className="text-xs font-medium text-vsc-fg">{col.label}</span>
            <Badge variant="default" text={0} className="ml-auto" />
          </div>

          {/* Column Body */}
          <div className="flex-1 p-2 flex items-center justify-center min-h-20">
            <p className="text-2xs text-vsc-text-ghost">No tasks</p>
          </div>
        </div>
      ))}
    </div>
  );
});
