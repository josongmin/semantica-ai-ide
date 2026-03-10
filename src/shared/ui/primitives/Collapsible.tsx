import React, { useCallback, useId } from "react";

import { useControllable } from "../../lib";
import { cn } from "../variants";
import { Icon } from "./Icon";

export interface CollapsibleProps {
  title: string;
  summary?: string;
  badge?: string | number;
  icon?: string;
  defaultCollapsed?: boolean;
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  headerRight?: React.ReactNode;
  contentClassName?: string;
  className?: string;
  children: React.ReactNode;
}

export const Collapsible = React.memo(
  React.forwardRef<HTMLDivElement, CollapsibleProps>(function Collapsible(
    {
      title,
      summary,
      badge,
      icon,
      defaultCollapsed = true,
      collapsed: controlledCollapsed,
      onToggle,
      headerRight,
      contentClassName,
      className,
      children,
    },
    ref,
  ) {
    const contentId = useId();
    const [isCollapsed, setCollapsed] = useControllable(
      controlledCollapsed,
      onToggle,
      defaultCollapsed,
    );

    const toggle = useCallback(() => setCollapsed((prev) => !prev), [setCollapsed]);

    return (
      <div ref={ref} className={cn("border-b border-vsc-border/50", className)}>
        {/* Header — toggle button + separate headerRight area to avoid nested <button> */}
        <div className="flex items-center hover:bg-vsc-list-hover transition-colors duration-fast">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!isCollapsed}
            aria-controls={contentId}
            className="flex items-center gap-1.5 flex-1 min-w-0 px-3 py-1 text-left
                     text-xs cursor-pointer bg-transparent border-none focus-ring"
          >
            <Icon
              name="chevron-right"
              className={cn(
                "transition-transform duration-normal text-vsc-text-tertiary shrink-0",
                !isCollapsed && "rotate-90",
              )}
              tokenSize="2xs"
            />

            {icon && (
              <Icon name={icon} className="text-vsc-text-secondary shrink-0" tokenSize="sm" />
            )}

            <span className="font-medium text-vsc-text-primary shrink-0">{title}</span>

            {summary && (
              <span
                className={cn(
                  "ml-1 truncate transition-opacity duration-normal",
                  isCollapsed ? "text-vsc-text-tertiary" : "opacity-0",
                )}
                title={typeof summary === "string" ? summary : undefined}
              >
                {summary}
              </span>
            )}

            {badge !== undefined && (
              <span className="ml-auto px-1.5 py-0.5 rounded-full text-2xs leading-none shrink-0 bg-vsc-badge-bg text-vsc-badge-fg">
                {badge}
              </span>
            )}
          </button>

          {headerRight !== undefined && headerRight !== null && <div className="flex items-center pr-2 shrink-0">{headerRight}</div>}
        </div>

        {/* Content area — CSS Grid transition */}
        <div
          id={contentId}
          role="region"
          aria-hidden={isCollapsed}
          // @ts-expect-error -- HTML inert attribute; React 19 types it natively
          inert={isCollapsed ? "" : undefined}
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-slow ease-in-out will-change-[grid-template-rows,opacity]",
            isCollapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
          )}
        >
          <div className="overflow-hidden">
            <div className={contentClassName ?? "px-3 pb-2"}>{children}</div>
          </div>
        </div>
      </div>
    );
  }),
);
