import React from "react";

import { Icon } from "~shared/ui";

export const StateInspector = React.memo(function StateInspector() {
  return (
    <div className="border-t border-vsc-border glass-panel px-4 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon name="inspect" tokenSize="sm" className="text-vsc-text-tertiary" />
        <h3 className="text-xs font-semibold text-vsc-fg">
          State Inspector
        </h3>
      </div>
      <p className="text-xs text-vsc-text-tertiary leading-relaxed">
        Select an event from the timeline to inspect its state snapshot.
      </p>
    </div>
  );
});
