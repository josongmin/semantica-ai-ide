import React from "react";

import { Button, Icon } from "~shared/ui";

export const ApprovalPane = React.memo(function ApprovalPane() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-t border-vsc-border bg-vsc-surface-1">
      <Icon name="warning" tokenSize="sm" className="text-vsc-warning" />
      <span className="text-xs text-vsc-fg flex-1">
        No pending approvals
      </span>
      <Button size="sm" icon="check" variant="success">
        Approve
      </Button>
      <Button size="sm" icon="x" variant="danger">
        Reject
      </Button>
    </div>
  );
});
