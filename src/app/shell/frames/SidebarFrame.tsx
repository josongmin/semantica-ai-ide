import React, { Suspense } from "react";
import { useAtomValue } from "jotai";

import { Icon, Spinner } from "~shared/ui";

import { activeSidebarViewAtom } from "../model/shellAtoms";
import { getViewsForFrame } from "../model/viewRegistry";

// ─── Types ──────────────────────────────────────────────

interface SidebarFrameProps {
  width: number;
}

// ─── Component ──────────────────────────────────────────

/**
 * Explorer content panel (RFC-017).
 * Activity bar removed — NavBar provides the icon rail.
 * This component only renders the active view content.
 */
export const SidebarFrame = React.memo(function SidebarFrame({ width }: SidebarFrameProps) {
  const activeView = useAtomValue(activeSidebarViewAtom);
  const sidebarViews = getViewsForFrame("dock-left");
  const active = sidebarViews.find((v) => v.id === activeView);
  const ViewComponent = active?.component;

  return (
    <aside
      role="complementary"
      aria-label="Explorer"
      data-keyboard-zone="sidebar"
      className="flex flex-col h-full shrink-0 overflow-hidden bg-vsc-surface-0"
      style={{ width }}
    >
      {ViewComponent ? (
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <Spinner size="sm" />
            </div>
          }
        >
          <ViewComponent />
        </Suspense>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-1 text-vsc-text-tertiary">
          <Icon name={active?.icon ?? "files"} size={20} className="opacity-40" />
          <span className="text-xs">{active?.title ?? "Explorer"}</span>
        </div>
      )}
    </aside>
  );
});
