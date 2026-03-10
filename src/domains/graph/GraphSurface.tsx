import { GraphCanvas } from "./GraphCanvas";
import { GraphToolbar } from "./GraphToolbar";
import { NodeDetail } from "./NodeDetail";

export function GraphSurface() {
  return (
    <div className="flex flex-col h-full bg-vsc-surface-0">
      {/* Toolbar */}
      <GraphToolbar />

      {/* Graph Canvas */}
      <GraphCanvas />

      {/* Node Detail */}
      <NodeDetail />
    </div>
  );
}
