import React from "react";

import { Button, Icon } from "~shared/ui";

export const ExecutionControls = React.memo(function ExecutionControls() {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-vsc-border bg-vsc-surface-1">
      <div className="flex items-center gap-2 text-xs text-vsc-text-tertiary">
        <Icon name="robot" tokenSize="sm" />
        <span>No agent selected</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Button size="sm" icon="debug-pause" variant="warning">
          Pause
        </Button>
        <Button size="sm" icon="play" variant="success">
          Resume
        </Button>
        <Button size="sm" icon="debug-stop" variant="danger">
          Cancel
        </Button>
        <Button size="sm" icon="check" variant="info">
          Approve
        </Button>
      </div>
    </div>
  );
});
