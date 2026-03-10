import React from "react";

import { cn } from "../variants";

interface PanelLayoutProps {
  /** Fixed top header (e.g. HeaderBar) */
  header?: React.ReactNode;
  /** Secondary header below header (e.g. CheckpointTimeline) */
  subheader?: React.ReactNode;
  /** Scrollable main content area */
  children: React.ReactNode;
  /** Collapsible section above footer (e.g. ActivityFeed) */
  subfooter?: React.ReactNode;
  /** Fixed bottom footer (e.g. PromptBox) */
  footer?: React.ReactNode;
  /** Bottom sheet overlay (above footer, e.g. VoiceInputOverlay) */
  bottomOverlay?: React.ReactNode;
  className?: string;
}

/**
 * 5-slot panel layout for VS Code webview pages.
 * header / subheader / main (flex-1 scrollable) / subfooter / footer
 */
export const PanelLayout = React.memo(function PanelLayout({
  header,
  subheader,
  children,
  subfooter,
  footer,
  bottomOverlay,
  className,
}: PanelLayoutProps) {
  return (
    <div className={cn("relative flex flex-col h-full overflow-hidden bg-vsc-bg", className)}>
      {header}
      {subheader}
      <main className="flex flex-col flex-1 min-h-0 overflow-hidden relative border-t border-vsc-border/60">
        {children}
      </main>
      {subfooter}
      {footer}
      {bottomOverlay !== undefined && bottomOverlay !== null && (
        <div className="absolute bottom-0 left-0 right-0 z-[--z-modal] pointer-events-none">
          <div className="pointer-events-auto">{bottomOverlay}</div>
        </div>
      )}
    </div>
  );
});
