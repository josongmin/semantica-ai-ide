import React from "react";
import { useAtomValue } from "jotai";

import { issuePipelineAtom } from "../../entities/issue-pipeline";
import { Badge, cn, StepTimeline } from "../../shared/ui";

export const IssuePipelineBanner = React.memo(function IssuePipelineBanner() {
  const pipeline = useAtomValue(issuePipelineAtom);
  if (!pipeline) return null;

  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-1.5",
      "bg-vsc-success/5 border-b border-vsc-success/20",
      "animate-[step-reveal_200ms_ease-out]",
    )}>
      <Badge text="Issue → PR" variant="success" />
      <span className="text-2xs text-vsc-text-secondary truncate max-w-[200px]">
        {pipeline.issueTitle}
      </span>
      <StepTimeline steps={pipeline.steps} direction="horizontal" className="flex-1" />
    </div>
  );
});
