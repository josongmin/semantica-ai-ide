import React from "react";

import { FooterSettingsBar } from "~widgets/footer-settings-bar";
import { PromptBox } from "~widgets/prompt-box";
import { ErrorBoundary, InlineBanner } from "~shared/ui";

/** Footer slot: PromptBox + FooterSettingsBar (Local|Remote, permissions, git branch). */
export const ChatFooter = React.memo(function ChatFooter() {
  return (
    <div className="flex flex-col gap-0 bg-vsc-bg">
      <ErrorBoundary
        fallback={
          <InlineBanner variant="error">PromptBox failed to render. Try refreshing.</InlineBanner>
        }
      >
        <PromptBox />
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <FooterSettingsBar />
      </ErrorBoundary>
    </div>
  );
});
