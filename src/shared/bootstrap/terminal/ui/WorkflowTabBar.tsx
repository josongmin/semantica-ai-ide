import { memo } from "react";

import { Icon } from "~shared/ui/primitives/Icon";
import { cn } from "~shared/ui/variants";

import { type PanelTab, TAB_ITEMS } from "./workflowConstants";

export interface WorkflowTabBarProps {
  activeTab: PanelTab;
  onTabChange: (tab: PanelTab) => void;
  /** Number of running workflows (shows pulse dot on Running tab) */
  hasRunning: boolean;
  /** Number of history entries (shows count badge on History tab) */
  historyCount: number;
}

export const WorkflowTabBar = memo(function WorkflowTabBar({
  activeTab,
  onTabChange,
  hasRunning,
  historyCount,
}: WorkflowTabBarProps) {
  return (
    <div className="flex items-center gap-0 border-b border-vsc-border shrink-0">
      {TAB_ITEMS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 text-2xs font-medium",
            "transition-colors duration-normal",
            "border-b-2 -mb-px",
            activeTab === tab.id
              ? "border-vsc-accent text-vsc-fg"
              : "border-transparent text-vsc-text-ghost hover:text-vsc-text-secondary",
          )}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          <Icon name={tab.icon} size={13} />
          {tab.label}
          {tab.id === "running" && hasRunning && (
            <span className="ml-0.5 w-1.5 h-1.5 rounded-full bg-vsc-success animate-pulse" />
          )}
          {tab.id === "history" && historyCount > 0 && (
            <span className="ml-0.5 text-3xs text-vsc-text-ghost tabular-nums">{historyCount}</span>
          )}
        </button>
      ))}
    </div>
  );
});
