import React from "react";

import { Icon } from "~shared/ui/primitives/Icon";

export const GraphCanvas = React.memo(function GraphCanvas() {
  return (
    <div className="flex-1 relative overflow-hidden bg-vsc-surface-0">
      {/* Grid background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--color-vsc-fg) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center h-full gap-3 text-vsc-text-ghost">
        <Icon name="type-hierarchy" tokenSize="lg" className="opacity-30" />
        <div className="text-sm">Workspace graph</div>
        <div className="text-xs text-vsc-text-ghost/60">Build your project to visualize dependencies</div>
      </div>
    </div>
  );
});
