import React, { useMemo } from "react";
import { useAtomValue } from "jotai";

import { planChecklistProgressAtomFamily } from "../../entities/plan-checklist";
import type { TurnId } from "../../shared/protocol";
import { Collapsible, ProgressBar } from "../../shared/ui";
import { PlanChecklistItemRow } from "./PlanChecklistItemRow";

interface PlanChecklistWidgetProps {
  turnId: TurnId;
}

export const PlanChecklistWidget = React.memo(function PlanChecklistWidget({
  turnId,
}: PlanChecklistWidgetProps) {
  const progress = useAtomValue(planChecklistProgressAtomFamily(turnId));

  const summaryText = useMemo(() => {
    if (progress.total === 0) return "";
    const parts: string[] = [];
    if (progress.completed > 0) parts.push(`${progress.completed} done`);
    if (progress.inProgress > 0) parts.push(`${progress.inProgress} active`);
    if (progress.failed > 0) parts.push(`${progress.failed} failed`);
    const pending = progress.total - progress.completed - progress.inProgress - progress.failed;
    if (pending > 0) parts.push(`${pending} pending`);
    return parts.join(", ");
  }, [progress]);

  if (progress.total === 0) return null;

  const isAllDone = progress.completed + progress.failed === progress.total;

  return (
    <Collapsible
      title="Plan"
      icon="checklist"
      badge={`${progress.completed}/${progress.total}`}
      summary={summaryText}
      defaultCollapsed={false}
      headerRight={
        <ProgressBar
          value={progress.completed}
          max={progress.total}
          label={`${Math.round((progress.completed / progress.total) * 100)}%`}
          className="w-20"
          barClassName={(() => { if (progress.failed > 0) return "bg-vsc-error"; if (isAllDone) return "bg-vsc-success"; return "bg-vsc-info"; })()}
        />
      }
    >
      <div role="list" className="space-y-0.5">
        {progress.items.map((item) => (
          <PlanChecklistItemRow key={item.id} item={item} />
        ))}
      </div>
    </Collapsible>
  );
});
