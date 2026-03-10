import React from "react";

import { HeaderBar } from "~widgets/header-bar";
import { MessageList } from "~widgets/message-list";
import { VoiceInputOverlay } from "~widgets/voice-input";
import { ErrorBoundary, InlineBanner, PanelLayout } from "~shared/ui";

import { ChatDialogs } from "./ChatDialogs";
import { ChatFooter } from "./ChatFooter";
import { ChatSubfooter } from "./ChatSubfooter";
import { ChatSubheader } from "./ChatSubheader";
import { FeatureSheetHost } from "./FeatureSheetHost";

/**
 * Main chat page — assembles all widgets into the full agent UX.
 * Uses PanelLayout: header / subheader / main / subfooter / footer.
 * Each slot delegates to a dedicated sub-component for maintainability.
 */
export const ChatPage = React.memo(function ChatPage() {
  return (
    <PanelLayout
      header={
        <ErrorBoundary
          fallback={
            <InlineBanner variant="error">HeaderBar failed to render. Try refreshing.</InlineBanner>
          }
        >
          <HeaderBar />
        </ErrorBoundary>
      }
      subheader={<ChatSubheader />}
      subfooter={<ChatSubfooter />}
      footer={<ChatFooter />}
      bottomOverlay={<VoiceInputOverlay />}
    >
      <ErrorBoundary
        fallback={(err) => (
          <InlineBanner variant="error">
            MessageList failed: {err?.message ?? "unknown error"}
          </InlineBanner>
        )}
      >
        <MessageList />
      </ErrorBoundary>
      <ChatDialogs />
      <FeatureSheetHost />
    </PanelLayout>
  );
});
