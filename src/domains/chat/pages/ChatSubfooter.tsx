import React from "react";

import { AgentTeamChat } from "~widgets/agent-team";
import { ApprovalBanner } from "~widgets/approval-banner";
import { BrowserAutomationPanel } from "~widgets/browser-automation";
import { ContextSpacePanel } from "~widgets/context-spaces";
import { FileTree } from "~widgets/file-tree";
import { IntegrationStatusPanel } from "~widgets/integration-status";
import { MemoryPanel } from "~widgets/memory-panel";
import { MultiAgentReviewPanel } from "~widgets/multi-agent-review";
import { PromptTemplateLibrary } from "~widgets/prompt-templates";
import { RemotePanel } from "~widgets/remote-panel";
import { SymbolPanel } from "~widgets/symbol-panel";
import { ThreeModelPanel } from "~widgets/three-model-panel";
import { TicketLinkPanel } from "~widgets/ticket-link";
import { UsageDashboard } from "~widgets/usage-dashboard";
import { WatchModePanel } from "~widgets/watch-mode-panel";
import { ErrorBoundary } from "~shared/ui";

/** All ErrorBoundary-wrapped widgets for the subfooter slot. */
export const ChatSubfooter = React.memo(function ChatSubfooter() {
  return (
    <>
      <ErrorBoundary fallback={null}>
        <ApprovalBanner />
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <FileTree />
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <SymbolPanel />
      </ErrorBoundary>
      {/* Review, Workspace, Activity moved to FeatureSheetHost popups */}
      <ErrorBoundary fallback={null}>
        <MemoryPanel />
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <RemotePanel />
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <AgentTeamChat />
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <ThreeModelPanel />
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <BrowserAutomationPanel />
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <ContextSpacePanel />
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <IntegrationStatusPanel />
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <TicketLinkPanel />
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <PromptTemplateLibrary />
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <UsageDashboard />
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <WatchModePanel />
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <MultiAgentReviewPanel />
      </ErrorBoundary>
    </>
  );
});
