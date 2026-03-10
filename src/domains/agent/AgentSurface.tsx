import { useAtom } from "jotai";

import { cn, Icon } from "~shared/ui";

import { type AgentViewMode,agentViewModeAtom } from "./agentAtoms";
import { AgentBoard } from "./AgentBoard";
import { ContextInspector } from "./ContextInspector";
import { ExecutionControls } from "./ExecutionControls";

const VIEW_MODES: { id: AgentViewMode; label: string; icon: string }[] = [
  { id: "board", label: "Board", icon: "layout" },
  { id: "dag", label: "DAG", icon: "type-hierarchy" },
  { id: "detail", label: "Detail", icon: "list-flat" },
];

export function AgentSurface() {
  const [viewMode, setViewMode] = useAtom(agentViewModeAtom);

  return (
    <div className="flex flex-col h-full bg-vsc-surface-0">
      {/* View Mode Selector */}
      <div className="flex items-center gap-0.5 px-4 h-9 border-b border-vsc-border bg-vsc-surface-1 shrink-0">
        <span className="text-2xs text-vsc-text-tertiary uppercase tracking-wider font-medium mr-2">View</span>
        {VIEW_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => setViewMode(mode.id)}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-sm",
              "cursor-pointer bg-transparent border-none transition-colors duration-fast focus-ring",
              viewMode === mode.id
                ? "bg-vsc-button text-vsc-button-fg font-medium"
                : "text-vsc-text-tertiary hover:text-vsc-fg hover:bg-vsc-list-hover",
            )}
          >
            <Icon name={mode.icon} tokenSize="2xs" className="shrink-0" />
            {mode.label}
          </button>
        ))}
      </div>

      {/* Main Content: Board + Inspector */}
      <div className="flex flex-1 min-h-0">
        <AgentBoard />
        <ContextInspector />
      </div>

      {/* Execution Controls */}
      <ExecutionControls />
    </div>
  );
}
