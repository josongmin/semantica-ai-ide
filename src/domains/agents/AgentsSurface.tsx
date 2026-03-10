import React, { useCallback } from "react";
import { atom, useAtom } from "jotai";

import type { AgentsSubTab } from "~shared/protocol/types/ui";
import { cn, Icon } from "~shared/ui";

import { SurfaceSkeleton } from "~surfaces/SurfaceSkeleton";

// ─── Lazy-loaded sub-surfaces ────────────────────────────

const AgentSurface = React.lazy(() => import("../agent").then((m) => ({ default: m.AgentSurface })));
const OrchestratorSurface = React.lazy(() =>
  import("../orchestrator").then((m) => ({ default: m.OrchestratorSurface })),
);

// ─── State ───────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export const agentsSubTabAtom = atom<AgentsSubTab>("workspace");

const SUB_TABS: { id: AgentsSubTab; label: string; icon: string }[] = [
  { id: "workspace", label: "Workspace", icon: "hubot" },
  { id: "fleet", label: "Fleet", icon: "server-process" },
];

const SUB_SURFACE: Record<AgentsSubTab, React.LazyExoticComponent<React.ComponentType>> = {
  workspace: AgentSurface,
  fleet: OrchestratorSurface,
};

// ─── Component ───────────────────────────────────────────

export const AgentsSurface = React.memo(function AgentsSurface() {
  const [activeTab, setActiveTab] = useAtom(agentsSubTabAtom);

  const handleTab = useCallback(
    (id: AgentsSubTab) => setActiveTab(id),
    [setActiveTab],
  );

  const ActiveComp = SUB_SURFACE[activeTab];

  return (
    <div className="flex flex-col h-full bg-vsc-surface-0">
      {/* Sub-tab bar */}
      <div className="flex items-center h-8 px-2 gap-0.5 border-b border-vsc-border/15 bg-vsc-bg shrink-0">
        {SUB_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 h-6 text-xs rounded-md",
                "cursor-pointer border-none transition-colors duration-fast focus-ring",
                isActive
                  ? "bg-vsc-accent/12 text-vsc-accent font-medium"
                  : "bg-transparent text-vsc-text-ghost hover:text-vsc-text-secondary hover:bg-vsc-surface-2/40",
              )}
            >
              <Icon name={tab.icon} tokenSize="2xs" className="shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active sub-surface */}
      <div className="flex-1 min-h-0 relative">
        <React.Suspense fallback={<SurfaceSkeleton label={activeTab} />}>
          <ActiveComp />
        </React.Suspense>
      </div>
    </div>
  );
});
