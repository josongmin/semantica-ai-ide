import React, { useCallback, useId, useRef } from "react";

import { cn } from "../variants";
import { Icon } from "./Icon";

export interface TabItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly disabled?: boolean;
}

export interface TabsProps {
  tabs: readonly TabItem[];
  activeId: string;
  onTabChange: (id: string) => void;
  /** Accessible label for the tablist (e.g. "Navigation tabs"). */
  "aria-label"?: string;
  className?: string;
}

/**
 * Accessible tab bar with keyboard arrow navigation.
 * Uses role="tablist" + role="tab" with proper aria attributes.
 * Consumers render tab panels externally using the activeId.
 */
export const Tabs = React.memo(
  React.forwardRef<HTMLDivElement, TabsProps>(function Tabs(
    { tabs, activeId, onTabChange, "aria-label": ariaLabel, className },
    ref,
  ) {
    const baseId = useId();
    const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    const setTabRef = useCallback(
      (id: string) => (el: HTMLButtonElement | null) => {
        if (el) {
          tabRefs.current.set(id, el);
        } else {
          tabRefs.current.delete(id);
        }
      },
      [],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        const enabledTabs = tabs.filter((t) => !t.disabled);
        const currentIndex = enabledTabs.findIndex((t) => t.id === activeId);
        if (currentIndex === -1) return;

        let nextIndex: number | null = null;

        switch (e.key) {
          case "ArrowRight":
          case "ArrowDown":
            e.preventDefault();
            nextIndex = (currentIndex + 1) % enabledTabs.length;
            break;
          case "ArrowLeft":
          case "ArrowUp":
            e.preventDefault();
            nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
            break;
          case "Home":
            e.preventDefault();
            nextIndex = 0;
            break;
          case "End":
            e.preventDefault();
            nextIndex = enabledTabs.length - 1;
            break;
        }

        if (nextIndex !== null) {
          const nextTab = enabledTabs[nextIndex] as { id: string } | undefined;
          if (nextTab === undefined) return;
          onTabChange(nextTab.id);
          tabRefs.current.get(nextTab.id)?.focus();
        }
      },
      [tabs, activeId, onTabChange],
    );

    return (
      <div
        ref={ref}
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
        className={cn("flex flex-nowrap border-b border-vsc-border/50", className)}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              ref={setTabRef(tab.id)}
              role="tab"
              type="button"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors duration-fast",
                "border-b-2 -mb-px bg-transparent focus-ring rounded-t",
                isActive
                  ? "border-vsc-button text-vsc-fg animate-[tab-underline-in_180ms_ease-out]"
                  : "border-transparent text-vsc-text-tertiary hover:text-vsc-text-secondary hover:border-vsc-text-ghost/30",
                tab.disabled && "opacity-50 cursor-not-allowed",
              )}
            >
              {tab.icon && <Icon name={tab.icon} tokenSize="2xs" className="shrink-0" />}
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  }),
);
