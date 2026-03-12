import React from "react";

import { Badge, cn } from "../../shared/ui";

/** Shared toolbar button style */
// eslint-disable-next-line react-refresh/only-export-components
export const toolbarBtnClass = (active: boolean) =>
  cn(
    "flex items-center gap-1 shrink-0 rounded-sm px-1.5 py-0.5 text-xs whitespace-nowrap",
    "transition-[color,background-color,box-shadow] duration-fast cursor-pointer focus-ring",
    active
      ? "bg-vsc-list-active text-vsc-fg shadow-sm"
      : "text-vsc-text-tertiary hover:bg-vsc-toolbar hover:text-vsc-text-primary",
  );

/** Toolbar section divider */
export const ToolbarSep = React.memo(function ToolbarSep() {
  return <span className="w-px h-4 bg-vsc-border/50 shrink-0 mx-0.5" aria-hidden />;
});

/** Numeric badge indicator -- shows count when > 0 */
export const BadgeIndicator = React.memo(function BadgeIndicator({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <Badge
      text={count}
      size="sm"
      className="tabular-nums"
      aria-label={`${count} active`}
      data-testid="feature-badge"
    />
  );
});

/** Red dot indicator (legacy -- used for boolean flags) */
export const DotIndicator = React.memo(function DotIndicator({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span
      className="size-1.5 rounded-full bg-vsc-error shrink-0"
      aria-hidden
      data-testid="feature-dot"
    />
  );
});
