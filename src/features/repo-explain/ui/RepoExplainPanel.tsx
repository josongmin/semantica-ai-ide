/**
 * RepoExplainPanel — thin orchestrator that renders tabbed sections
 * for architecture, modules, data flows, and risks.
 */
import { memo, useState } from "react";

import { type ArchitectureInfo,ArchitectureSection } from "./ArchitectureSection";
import { type DataFlow,FlowsSection } from "./FlowsSection";
import { type ModuleInfo,ModulesSection } from "./ModulesSection";
import { type RiskItem,RisksSection } from "./RisksSection";

// ─── Types ─────────────────────────────────────────────────

export type RepoExplainTab = "architecture" | "modules" | "flows" | "risks";

export interface RepoExplainData {
  readonly architecture: ArchitectureInfo;
  readonly modules: readonly ModuleInfo[];
  readonly flows: readonly DataFlow[];
  readonly risks: readonly RiskItem[];
}

export interface RepoExplainPanelProps {
  readonly data: RepoExplainData;
  readonly defaultTab?: RepoExplainTab;
  readonly className?: string;
}

// ─── Tab Config ────────────────────────────────────────────

const TABS: readonly { id: RepoExplainTab; label: string }[] = [
  { id: "architecture", label: "Architecture" },
  { id: "modules", label: "Modules" },
  { id: "flows", label: "Flows" },
  { id: "risks", label: "Risks" },
];

// ─── Component ─────────────────────────────────────────────

export const RepoExplainPanel = memo(function RepoExplainPanel({
  data,
  defaultTab = "architecture",
  className,
}: RepoExplainPanelProps) {
  const [activeTab, setActiveTab] = useState<RepoExplainTab>(defaultTab);

  return (
    <div className={`flex h-full flex-col ${className ?? ""}`}>
      {/* Tab bar */}
      <div
        className="flex border-b border-[var(--color-zinc-700,#3f3f46)]"
        role="tablist"
        aria-label="Repo explain sections"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              className={`px-4 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "border-b-2 border-[var(--color-blue-400,#60a5fa)] text-[var(--color-blue-400,#60a5fa)]"
                  : "text-[var(--color-zinc-400,#a1a1aa)] hover:text-[var(--color-zinc-200,#e4e4e7)]"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.id === "risks" && data.risks.length > 0 && (
                <span className="ml-1.5 rounded-full bg-[var(--color-red-500,#ef4444)]/20 px-1.5 py-0.5 text-[10px] text-[var(--color-red-400,#f87171)]">
                  {data.risks.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "architecture" && (
          <div id="panel-architecture" role="tabpanel">
            <ArchitectureSection data={data.architecture} />
          </div>
        )}
        {activeTab === "modules" && (
          <div id="panel-modules" role="tabpanel">
            <ModulesSection modules={data.modules} />
          </div>
        )}
        {activeTab === "flows" && (
          <div id="panel-flows" role="tabpanel">
            <FlowsSection flows={data.flows} />
          </div>
        )}
        {activeTab === "risks" && (
          <div id="panel-risks" role="tabpanel">
            <RisksSection risks={data.risks} />
          </div>
        )}
      </div>
    </div>
  );
});
