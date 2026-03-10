import React from "react";

import { cn } from "../variants";
import { Icon } from "./Icon";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

export interface BreadcrumbsProps {
  items: readonly BreadcrumbItem[];
  /** Codicon name for the separator icon. Defaults to "chevron-right". */
  separator?: string;
  className?: string;
}

export const Breadcrumbs = React.memo(
  React.forwardRef<HTMLElement, BreadcrumbsProps>(function Breadcrumbs(
    { items, separator = "chevron-right", className },
    ref,
  ) {
    return (
      <nav ref={ref} aria-label="Breadcrumb" className={cn("flex items-center text-xs", className)}>
        <ol className="flex items-center gap-1">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <li key={item.href ?? item.label} className="flex items-center gap-1">
                {index > 0 && (
                  <Icon
                    name={separator}
                    tokenSize="2xs"
                    className="text-vsc-text-tertiary"
                    aria-hidden
                  />
                )}
                {(() => {
                  if (isLast) {
                    return (
                      <span
                        aria-current="page"
                        className="inline-flex items-center gap-1 text-vsc-fg font-medium"
                      >
                        {item.icon && <Icon name={item.icon} tokenSize="2xs" />}
                        {item.label}
                      </span>
                    );
                  }
                  if (item.href) {
                    return (
                      <a
                        href={item.href}
                        className="inline-flex items-center gap-1 text-vsc-text-tertiary hover:text-vsc-fg transition-colors duration-fast"
                      >
                        {item.icon && <Icon name={item.icon} tokenSize="2xs" />}
                        {item.label}
                      </a>
                    );
                  }
                  return (
                    <span className="inline-flex items-center gap-1 text-vsc-text-tertiary">
                      {item.icon && <Icon name={item.icon} tokenSize="2xs" />}
                      {item.label}
                    </span>
                  );
                })()}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }),
);
