import React, { useMemo } from "react";

import { categoryIcons, categoryLabels } from "~entities/tool-call";

import type { ToolCallGroup as ToolCallGroupType } from "../../shared/protocol";
import { Collapsible } from "../../shared/ui";
import { ToolCallRow } from "./ToolCallRow";

interface ToolCallGroupProps {
  group: ToolCallGroupType;
}

export const ToolCallGroup = React.memo(function ToolCallGroup({ group }: ToolCallGroupProps) {
  const label = categoryLabels[group.category];
  const icon = categoryIcons[group.category];
  const { runningCount, awaitingCount } = useMemo(() => {
    let running = 0;
    let awaiting = 0;
    for (const c of group.calls) {
      if (c.status === "running") running++;
      if (c.status === "awaiting_approval") awaiting++;
    }
    return { runningCount: running, awaitingCount: awaiting };
  }, [group.calls]);

  let summary: string;
  if (awaitingCount > 0) {
    summary = `${awaitingCount} awaiting approval`;
  } else if (runningCount > 0) {
    summary = `${runningCount} running...`;
  } else {
    summary = `${group.count} completed`;
  }

  return (
    <Collapsible
      title={label}
      icon={icon}
      badge={group.count}
      summary={summary}
      defaultCollapsed={true}
    >
      <div className="space-y-0.5 stagger-children">
        {group.calls.map((call) => (
          <ToolCallRow key={call.id} id={call.id} />
        ))}
      </div>
    </Collapsible>
  );
});
