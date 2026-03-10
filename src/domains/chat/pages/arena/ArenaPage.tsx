import React from "react";

import { ArenaView } from "~widgets/arena-view";
import { ErrorBoundary } from "~shared/ui";

export const ArenaPage = React.memo(function ArenaPage() {
  return (
    <div className="flex flex-col h-full" role="region" aria-label="Arena mode">
      <ErrorBoundary fallback={<div className="p-4 text-vsc-error">Arena failed to load</div>}>
        <ArenaView />
      </ErrorBoundary>
    </div>
  );
});
