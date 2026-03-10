import React from "react";

import { cn, Spinner } from "~shared/ui";

export interface SurfaceSkeletonProps {
  readonly label: string;
}

/** Shimmer bar for skeleton loading state */
function SkeletonBar({ width, className }: { width: string; className?: string }) {
  return (
    <div
      className={cn(
        "h-2.5 rounded-md bg-vsc-surface-2/60 relative overflow-hidden",
        className,
      )}
      style={{ width }}
    >
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-vsc-fg/[0.04] to-transparent"
        style={{ animation: "shimmer 1.5s ease-in-out infinite" }}
      />
    </div>
  );
}

export const SurfaceSkeleton = React.memo(function SurfaceSkeleton({
  label,
}: SurfaceSkeletonProps) {
  return (
    <div className="flex flex-col h-full surface-enter">
      {/* Fake toolbar skeleton */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-vsc-border/20">
        <SkeletonBar width="24px" className="!h-4 !w-4 !rounded" />
        <SkeletonBar width="120px" className="!h-3" />
        <div className="flex-1" />
        <SkeletonBar width="60px" className="!h-3" />
      </div>

      {/* Content skeleton lines */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        <div className="w-full max-w-md space-y-3 stagger-children">
          <SkeletonBar width="85%" />
          <SkeletonBar width="70%" />
          <SkeletonBar width="92%" />
          <SkeletonBar width="60%" />
          <SkeletonBar width="78%" />
        </div>
        <div className="flex items-center gap-2 mt-4 text-vsc-text-ghost">
          <Spinner size="sm" />
          <p className="text-xs">Loading {label}…</p>
        </div>
      </div>
    </div>
  );
});
