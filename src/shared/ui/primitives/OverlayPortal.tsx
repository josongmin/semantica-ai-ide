import React from "react";
import { createPortal } from "react-dom";

import { usePortalContainer } from "../../lib";
import { ErrorBoundary } from "./ErrorBoundary";

export interface OverlayPortalProps {
  children: React.ReactNode;
  /** Fallback UI on render error. Defaults to null (silently hide broken overlay). */
  fallback?: React.ReactNode | ((error: Error) => React.ReactNode);
}

/**
 * Portal wrapper for all overlay components.
 * Combines two commercial-grade requirements:
 *
 * 1. **Customizable portal container** — reads from `PortalContainerProvider` context,
 *    defaults to `document.body`. Enables Shadow DOM, iframe, and multi-root support.
 *
 * 2. **Error isolation** — wraps portal contents in `ErrorBoundary` so render errors
 *    in overlay children don't corrupt the main DOM tree or leave stale backdrops.
 *
 * @example
 * ```tsx
 * // Inside any overlay component (Dialog, Popover, etc.):
 * if (!mounted) return null;
 *
 * return (
 *   <OverlayPortal>
 *     <div className="fixed inset-0 ...">
 *       {children}
 *     </div>
 *   </OverlayPortal>
 * );
 * ```
 */
export const OverlayPortal = React.memo(function OverlayPortal({
  children,
  fallback = null,
}: OverlayPortalProps) {
  const container = usePortalContainer();

  return createPortal(<ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>, container);
});
