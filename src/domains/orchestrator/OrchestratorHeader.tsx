import React from "react";

import { Badge, Icon } from "~shared/ui";

export const OrchestratorHeader = React.memo(function OrchestratorHeader() {
  return (
    <div className="flex items-center gap-4 px-4 h-9 border-b border-vsc-border bg-vsc-surface-1 shrink-0">
      <div className="flex items-center gap-2">
        <Icon name="server-process" tokenSize="sm" className="text-vsc-button" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-vsc-text-secondary">Orchestrator</h2>
      </div>

      <div className="flex items-center gap-3 ml-auto text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-vsc-text-tertiary">Intent:</span>
          <span className="text-vsc-text-secondary italic">No active intent</span>
        </div>
        <Badge variant="default" text="idle" />
        <div className="flex items-center gap-1.5">
          <span className="text-vsc-text-tertiary">Agents:</span>
          <span className="text-vsc-fg tabular-nums">0</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-vsc-text-tertiary">Pending:</span>
          <span className="text-vsc-fg tabular-nums">0</span>
        </div>
      </div>
    </div>
  );
});
