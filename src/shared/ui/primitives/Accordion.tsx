import React, { useCallback, useId, useMemo } from "react";

import { useControllable } from "../../lib";
import { cn } from "../variants";
import { Icon } from "./Icon";

export interface AccordionItem {
  readonly id: string;
  readonly title: string;
  readonly icon?: string;
  readonly disabled?: boolean;
}

export interface AccordionProps {
  items: readonly AccordionItem[];
  /** Expanded item id(s). Single string for single-expand, array for multi. */
  expanded?: string | string[];
  defaultExpanded?: string | string[];
  onExpandedChange?: (expanded: string[]) => void;
  /** Allow multiple panels open simultaneously. Default: false. */
  multiple?: boolean;
  className?: string;
  children: (item: AccordionItem, isExpanded: boolean) => React.ReactNode;
}

function toArray(val: string | string[] | undefined): string[] {
  if (val === undefined) return [];
  return Array.isArray(val) ? val : [val];
}

/**
 * Accordion — multi-panel collapsible with keyboard navigation.
 *
 * - `useControllable` for controlled/uncontrolled state
 * - WAI-ARIA: ArrowUp/Down + Home/End between headers
 * - CSS Grid height transition (no JS height measurement)
 * - `data-state` on panels for CSS-only styling
 * - `e.currentTarget` for reliable dataset access
 */
export const Accordion = React.memo(
  React.forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
    {
      items,
      expanded: controlledExpanded,
      defaultExpanded,
      onExpandedChange,
      multiple = false,
      className,
      children,
    },
    ref,
  ) {
    const baseId = useId();

    // Normalize controlled prop (string | string[] → string[])
    const normalizedControlled = useMemo(
      () => (controlledExpanded !== undefined ? toArray(controlledExpanded) : undefined),
      [controlledExpanded],
    );

    const [expandedIds, setExpandedIds] = useControllable<string[]>(
      normalizedControlled,
      onExpandedChange,
      toArray(defaultExpanded),
    );

    // Stable toggle using useControllable's stable setter
    const toggle = useCallback(
      (id: string) => {
        setExpandedIds((current) => {
          const isOpen = current.includes(id);
          if (isOpen) return current.filter((x) => x !== id);
          if (multiple) return [...current, id];
          return [id];
        });
      },
      [setExpandedIds, multiple],
    );

    // Keyboard navigation between accordion headers
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        const enabled = items.filter((i) => !i.disabled);
        // Use currentTarget (the button with data-accordion-id), not target (could be inner icon/span)
        const currentId = (e.currentTarget as HTMLElement).dataset.accordionId;
        const idx = enabled.findIndex((i) => i.id === currentId);
        if (idx === -1) return;

        let nextIdx: number | null = null;

        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            nextIdx = (idx + 1) % enabled.length;
            break;
          case "ArrowUp":
            e.preventDefault();
            nextIdx = (idx - 1 + enabled.length) % enabled.length;
            break;
          case "Home":
            e.preventDefault();
            nextIdx = 0;
            break;
          case "End":
            e.preventDefault();
            nextIdx = enabled.length - 1;
            break;
        }

        if (nextIdx !== null) {
          const nextItem = enabled[nextIdx] as AccordionItem | undefined;
          if (nextItem === undefined) return;
          const el = document.getElementById(`${baseId}-h-${nextItem.id}`);
          el?.focus();
        }
      },
      [items, baseId],
    );

    return (
      <div ref={ref} className={cn("divide-y divide-vsc-border/50", className)}>
        {items.map((item) => {
          const isExpanded = expandedIds.includes(item.id);
          const headerId = `${baseId}-h-${item.id}`;
          const panelId = `${baseId}-p-${item.id}`;

          return (
            <div key={item.id} data-state={isExpanded ? "open" : "closed"}>
              {/* Header */}
              <h3 className="m-0">
                <button
                  type="button"
                  id={headerId}
                  data-accordion-id={item.id}
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  disabled={item.disabled}
                  onClick={() => toggle(item.id)}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-2 text-left text-xs font-medium",
                    "bg-transparent border-none cursor-pointer",
                    "hover:bg-vsc-list-hover transition-colors duration-fast focus-ring",
                    item.disabled && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <Icon
                    name="chevron-right"
                    tokenSize="2xs"
                    className={cn(
                      "shrink-0 text-vsc-text-tertiary transition-transform duration-normal",
                      isExpanded && "rotate-90",
                    )}
                  />
                  {item.icon && (
                    <Icon
                      name={item.icon}
                      tokenSize="sm"
                      className="shrink-0 text-vsc-text-secondary"
                    />
                  )}
                  <span className="text-vsc-text-primary">{item.title}</span>
                </button>
              </h3>

              {/* Panel — CSS Grid transition */}
              <div
                id={panelId}
                role="region"
                aria-labelledby={headerId}
                aria-hidden={!isExpanded}
                data-state={isExpanded ? "open" : "closed"}
                // @ts-expect-error -- HTML inert attribute; React 19 types it natively
                inert={!isExpanded ? "" : undefined}
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-slow ease-in-out",
                  "will-change-[grid-template-rows,opacity]",
                  isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                )}
              >
                <div className="overflow-hidden">
                  <div className="px-3 pb-3 pt-1">{children(item, isExpanded)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }),
);
