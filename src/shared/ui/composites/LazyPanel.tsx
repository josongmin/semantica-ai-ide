import React, { Suspense } from "react";

import { Skeleton } from "../primitives/Skeleton";
import { cn } from "../variants";

// ─── Types ──────────────────────────────────────────────────

export interface LazyPanelProps {
  /** A React.lazy component or any component to render */
  children: React.ReactNode;
  /** Custom fallback to show while loading. Defaults to a card skeleton. */
  fallback?: React.ReactNode;
  /** Additional class names for the wrapper */
  className?: string;
  /** Minimum height for the skeleton fallback (CSS value) */
  minHeight?: string;
}

// ─── Default Fallback ───────────────────────────────────────

/** Default skeleton fallback used when no custom fallback is provided */
const DefaultLazyFallback = React.memo(function DefaultLazyFallback({
  minHeight = "120px",
}: {
  minHeight?: string;
}) {
  return (
    <div
      className="flex flex-col gap-2 p-3"
      style={{ minHeight }}
      role="status"
      aria-label="Loading panel"
    >
      <div className="flex items-center gap-2">
        <Skeleton variant="avatar" width="20px" height="20px" />
        <Skeleton variant="text" width="40%" height="14px" />
      </div>
      <Skeleton variant="card" height="60px" />
      <Skeleton variant="text" width="70%" height="12px" />
      <Skeleton variant="text" width="50%" height="12px" />
    </div>
  );
});

// ─── LazyPanel ──────────────────────────────────────────────

/**
 * Wrapper for lazy-loaded panels using React.lazy + Suspense.
 *
 * Provides a skeleton fallback during load, preventing layout shift
 * and keeping the UI responsive.
 *
 * Usage:
 * ```tsx
 * const LazyDiffViewer = React.lazy(() => import("../../widgets/diff-viewer/DiffViewer"));
 *
 * <LazyPanel fallback={<DiffSkeleton />}>
 *   <LazyDiffViewer {...props} />
 * </LazyPanel>
 * ```
 */
export const LazyPanel = React.memo(function LazyPanel({
  children,
  fallback,
  className,
  minHeight,
}: LazyPanelProps) {
  const resolvedFallback = fallback ?? <DefaultLazyFallback minHeight={minHeight} />;

  return (
    <div className={cn("w-full", className)}>
      <Suspense fallback={resolvedFallback}>{children}</Suspense>
    </div>
  );
});
