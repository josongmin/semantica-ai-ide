import React from "react";

import { PromptBox } from "~widgets/prompt-box";
import { ErrorBoundary, InlineBanner } from "~shared/ui";

/** Footer slot: PromptBox. */
export const ChatFooter = React.memo(function ChatFooter() {
  return (
    <div className="flex flex-col gap-0 bg-white pb-1">
      <ErrorBoundary
        fallback={
          <InlineBanner variant="error">PromptBox failed to render. Try refreshing.</InlineBanner>
        }
      >
        <PromptBox />
      </ErrorBoundary>
    </div>
  );
});
