import React from "react";

import { Icon } from "../../shared/ui";

interface CollapsibleContextRowProps {
  lineCount: number;
  onExpand: () => void;
}

/** Collapsed context placeholder row */
export const CollapsibleContextRow = React.memo(function CollapsibleContextRow({
  lineCount,
  onExpand,
}: CollapsibleContextRowProps) {
  return (
    <div
      className="flex items-center px-1 py-0.5 text-2xs text-vsc-text-ghost hover:bg-vsc-list-hover cursor-pointer select-none transition-colors duration-fast focus-ring"
      onClick={onExpand}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onExpand(); } }}
      role="button"
      tabIndex={0}
      aria-label={`Expand ${lineCount} hidden lines`}
      data-testid="collapsed-context"
    >
      <span className="w-8 shrink-0" />
      <Icon name="unfold" tokenSize="2xs" className="mr-1" />
      <span>{lineCount} lines hidden</span>
    </div>
  );
});
