import React from "react";

import { Button, Icon } from "~shared/ui";

export const ReviewControls = React.memo(function ReviewControls() {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-vsc-border bg-vsc-surface-1">
      <div className="flex items-center gap-2 text-xs text-vsc-text-tertiary">
        <Icon name="git-pull-request" tokenSize="sm" />
        <span>No patch selected</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Button size="sm" icon="check" variant="success">
          Approve
        </Button>
        <Button size="sm" icon="x" variant="danger">
          Reject
        </Button>
        <Button size="sm" icon="comment" variant="warning">
          Request Changes
        </Button>
      </div>
    </div>
  );
});
