import React from "react";
import { useAtom } from "jotai";

import { cn, Icon } from "~shared/ui";

import { activeReviewTabAtom, type ReviewTab } from "./reviewAtoms";

const TABS: { id: ReviewTab; label: string; icon: string }[] = [
  { id: "impact", label: "Impact", icon: "pulse" },
  { id: "security", label: "Security", icon: "shield" },
  { id: "clone", label: "Clone", icon: "copy" },
  { id: "metrics", label: "Metrics", icon: "graph" },
  { id: "tests", label: "Tests", icon: "beaker" },
  { id: "proof", label: "Proof", icon: "verified" },
];

export const EvidenceSidebar = React.memo(function EvidenceSidebar() {
  const [activeTab, setActiveTab] = useAtom(activeReviewTabAtom);
  const currentTab = TABS.find((t) => t.id === activeTab);

  return (
    <div className="flex flex-col h-full border-l border-vsc-border glass-panel">
      {/* Tab Row */}
      <div className="flex flex-wrap border-b border-vsc-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1.5 text-xs",
              "cursor-pointer bg-transparent border-none border-b-2 transition-colors duration-fast focus-ring",
              activeTab === tab.id
                ? "border-vsc-button text-vsc-fg"
                : "border-transparent text-vsc-text-tertiary hover:text-vsc-fg",
            )}
          >
            <Icon name={tab.icon} tokenSize="2xs" className="shrink-0" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex items-center justify-center p-4 text-vsc-text-tertiary">
        <div className="text-center">
          <Icon name={currentTab?.icon ?? "pulse"} size={24} className="opacity-30 mx-auto mb-2" />
          <p className="text-xs font-medium text-vsc-text-secondary">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} evidence
          </p>
          <p className="text-2xs mt-1">No review data loaded</p>
        </div>
      </div>
    </div>
  );
});
