import React from "react";

import { cn, Icon } from "~shared/ui";

import type { DriftItem, DriftSeverity } from "../model/docDriftAtoms";

export interface DriftItemCardProps {
  item: DriftItem;
  onFixDoc?: () => void;
  onFixCode?: () => void;
  onDismiss?: () => void;
}

const SEV_ICON: Record<DriftSeverity, string> = {
  mismatch: "warning",
  outdated: "history",
  "missing-link": "link",
};

const SEV_LABEL: Record<DriftSeverity, string> = {
  mismatch: "Mismatch",
  outdated: "Outdated",
  "missing-link": "Missing link",
};

export const DriftItemCard = React.memo(function DriftItemCard({
  item,
  onFixDoc,
  onFixCode,
  onDismiss,
}: DriftItemCardProps) {
  const fileName = item.docPath.split("/").pop() ?? item.docPath;
  const codeFileName = item.codePath.split("/").pop() ?? item.codePath;

  return (
    <div className="bg-vsc-surface-1/80 border border-vsc-border/15 rounded-md p-2.5 space-y-2">
      {/* Header: severity + doc location */}
      <div className="flex items-center gap-1.5">
        <Icon
          name={SEV_ICON[item.severity]}
          tokenSize="2xs"
          className={cn(
            "shrink-0",
            item.severity === "mismatch" && "text-vsc-warning",
            item.severity === "outdated" && "text-vsc-info",
            item.severity === "missing-link" && "text-vsc-text-ghost",
          )}
        />
        <span className="text-2xs font-medium text-vsc-text-secondary">
          Line {item.docLine}: {SEV_LABEL[item.severity]}
        </span>
        <span className="ml-auto text-2xs text-vsc-text-ghost tabular-nums">
          {Math.round(item.confidence * 100)}%
        </span>
      </div>

      {/* Doc assertion vs code value */}
      <div className="grid grid-cols-2 gap-1.5 overflow-hidden">
        {/* Doc side */}
        <div className="rounded-sm px-2 py-1.5 bg-vsc-warning/5 border border-vsc-warning/10">
          <div className="text-2xs text-vsc-text-ghost mb-0.5">Doc</div>
          <div className="text-xs text-vsc-warning font-mono leading-relaxed break-words line-clamp-3">
            &quot;{item.docAssertion}&quot;
          </div>
          <div className="text-2xs text-vsc-text-ghost mt-1 truncate" title={item.docPath}>
            {fileName}:{item.docLine}
          </div>
        </div>

        {/* Code side */}
        <div className="rounded-sm px-2 py-1.5 bg-vsc-info/5 border border-vsc-info/10">
          <div className="text-2xs text-vsc-text-ghost mb-0.5">Code</div>
          <div className="text-xs text-vsc-info font-mono leading-relaxed break-words line-clamp-3">
            {item.codeValue}
          </div>
          <div className="text-2xs text-vsc-text-ghost mt-1 truncate" title={item.codePath}>
            {codeFileName}:{item.codeLine}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {item.autoFixable && onFixDoc && (
          <button
            type="button"
            onClick={onFixDoc}
            className="px-2 py-0.5 text-2xs rounded-sm cursor-pointer
                       bg-transparent border border-vsc-border/20
                       text-vsc-text-secondary hover:bg-vsc-surface-3
                       transition-colors duration-fast focus-ring"
          >
            Fix Doc
          </button>
        )}
        {item.autoFixable && onFixCode && (
          <button
            type="button"
            onClick={onFixCode}
            className="px-2 py-0.5 text-2xs rounded-sm cursor-pointer
                       bg-transparent border border-vsc-border/20
                       text-vsc-text-secondary hover:bg-vsc-surface-3
                       transition-colors duration-fast focus-ring"
          >
            Fix Code
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="px-2 py-0.5 text-2xs rounded-sm cursor-pointer
                       bg-transparent border border-vsc-border/20
                       text-vsc-text-ghost hover:bg-vsc-surface-3 hover:text-vsc-text-secondary
                       transition-colors duration-fast focus-ring"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
});
