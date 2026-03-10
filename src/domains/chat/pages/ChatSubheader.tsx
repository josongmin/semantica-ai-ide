import React from "react";

import { ActiveAgentsPanel } from "~widgets/active-agents-panel";
import { BreadcrumbNav } from "~widgets/breadcrumb-nav";
import { ContextBanner } from "~widgets/context-banner";
import { IssuePipelineBanner } from "~widgets/issue-pipeline-banner";
import { useAutoCompact } from "~features/auto-compact";
import { useContextPressure } from "~features/context-monitor";
import { ErrorBoundary } from "~shared/ui";

/** Activates context pressure toast warnings as a side effect */
function ContextPressureActivator() {
  useContextPressure();
  return null;
}

/** Auto-triggers context compaction when usage crosses 85% */
function AutoCompactActivator() {
  useAutoCompact();
  return null;
}

/**
 * Subheader slot: data-driven inline banners + side-effect activators.
 * FeatureBar tools moved to GNB gallery (TitleBar "..." menu).
 */
export const ChatSubheader = React.memo(function ChatSubheader() {
  return (
    <>
      {/* Session-level inline banners — each self-hides when empty */}
      <ErrorBoundary fallback={null}>
        <BreadcrumbNav />
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <ContextBanner />
      </ErrorBoundary>

      <ErrorBoundary fallback={null}>
        <ActiveAgentsPanel />
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <IssuePipelineBanner />
      </ErrorBoundary>

      {/* Invisible side-effect activators */}
      <ContextPressureActivator />
      <AutoCompactActivator />
    </>
  );
});
