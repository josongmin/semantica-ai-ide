import React from "react";

import { cn } from "../variants";

// ─── Variant Presets ────────────────────────────────────────

const variantStyles: Record<SkeletonVariant, string> = {
  text: "rounded",
  avatar: "rounded-full",
  card: "rounded-md",
  "list-item": "rounded",
  "diff-line": "rounded-sm",
};

const variantDefaults: Record<SkeletonVariant, { width?: string; height: string }> = {
  text: { height: "12px" },
  avatar: { width: "32px", height: "32px" },
  card: { width: "100%", height: "80px" },
  "list-item": { width: "100%", height: "40px" },
  "diff-line": { width: "100%", height: "16px" },
};

// ─── Types ──────────────────────────────────────────────────

export type SkeletonVariant = "text" | "avatar" | "card" | "list-item" | "diff-line";

export interface SkeletonProps {
  /** Visual variant determining shape and default dimensions */
  variant?: SkeletonVariant;
  /** Override width (CSS value) */
  width?: string;
  /** Override height (CSS value) */
  height?: string;
  /** Additional class names */
  className?: string;
}

// ─── Primitive ──────────────────────────────────────────────

/** Shimmer loading placeholder with variant support. Uses animate-pulse for CSS animation. */
export const Skeleton = React.memo(function Skeleton({
  variant = "text",
  width,
  height,
  className,
}: SkeletonProps) {
  const defaults = variantDefaults[variant];
  const resolvedWidth = width ?? defaults.width;
  const resolvedHeight = height ?? defaults.height;

  return (
    <div
      className={cn("skeleton", variantStyles[variant], className)}
      style={{ width: resolvedWidth, height: resolvedHeight }}
      aria-hidden
    />
  );
});

// ─── Composite Skeletons ────────────────────────────────────

/** Multi-line message skeleton for chat loading states. */
export const MessageSkeleton = React.memo(function MessageSkeleton() {
  return (
    <div
      className="flex flex-col gap-2 py-3 px-3 animate-[fade-in_300ms_ease]"
      role="status"
      aria-label="Loading message"
    >
      <div className="flex items-center gap-1.5">
        <Skeleton variant="avatar" width="12px" height="12px" />
        <Skeleton variant="text" width="40px" height="10px" />
      </div>
      <Skeleton variant="text" width="85%" height="13px" />
      <Skeleton variant="text" width="65%" height="13px" />
      <Skeleton variant="text" width="75%" height="13px" />
    </div>
  );
});

/** Diff viewer skeleton showing header + diff lines. */
export const DiffSkeleton = React.memo(function DiffSkeleton({
  lineCount = 8,
}: {
  lineCount?: number;
}) {
  return (
    <div
      className="border border-vsc-border rounded-md overflow-hidden animate-[fade-in_300ms_ease]"
      role="status"
      aria-label="Loading diff"
    >
      {/* Header skeleton */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-vsc-surface-1 border-b border-vsc-border">
        <Skeleton variant="text" width="14px" height="14px" />
        <Skeleton variant="text" width="120px" height="12px" />
        <div className="flex-1" />
        <Skeleton variant="text" width="60px" height="12px" />
      </div>
      {/* Diff line skeletons */}
      {/* Static list — index key safe */}
      <div className="px-2 py-1 space-y-1">
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i} className="flex gap-2">
            <Skeleton variant="text" width="24px" height="14px" className="shrink-0" />
            <Skeleton variant="diff-line" width={`${50 + ((i * 17) % 45)}%`} height="14px" />
          </div>
        ))}
      </div>
    </div>
  );
});

/** Session card skeleton for session list loading states. */
export const SessionCardSkeleton = React.memo(function SessionCardSkeleton() {
  return (
    <div
      className="flex flex-col gap-1.5 px-3 py-2 rounded animate-[fade-in_300ms_ease]"
      role="status"
      aria-label="Loading session"
    >
      <div className="flex items-center gap-1.5">
        <Skeleton variant="avatar" width="8px" height="8px" />
        <Skeleton variant="text" width="60%" height="14px" />
        <div className="flex-1" />
        <Skeleton variant="text" width="40px" height="10px" />
      </div>
      <div className="flex items-center gap-2 pl-4">
        <Skeleton variant="text" width="80px" height="10px" />
        <Skeleton variant="text" width="50px" height="10px" />
      </div>
      <div className="pl-4">
        <Skeleton variant="text" width="70%" height="10px" />
      </div>
    </div>
  );
});

/** Session row skeleton matching SessionRow layout. */
export const SessionRowSkeleton = React.memo(function SessionRowSkeleton() {
  return (
    <div
      className="flex items-center gap-2 py-2.5 px-3 animate-[fade-in_300ms_ease]"
      role="status"
      aria-label="Loading session"
    >
      <Skeleton width="8px" height="8px" className="rounded-full shrink-0" />
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <Skeleton width="60%" height="12px" />
        <Skeleton width="40%" height="10px" />
      </div>
    </div>
  );
});

/** Tool call skeleton matching ToolCallRow layout. */
export const ToolCallSkeleton = React.memo(function ToolCallSkeleton() {
  return (
    <div
      className="flex items-center gap-2 py-1.5 px-3 animate-[fade-in_300ms_ease]"
      role="status"
      aria-label="Loading tool call"
    >
      <Skeleton width="14px" height="14px" className="rounded shrink-0" />
      <Skeleton width="100px" height="11px" />
      <div className="ml-auto">
        <Skeleton width="50px" height="10px" />
      </div>
    </div>
  );
});

/** File change skeleton matching FileChangeRow layout. */
export const FileChangeSkeleton = React.memo(function FileChangeSkeleton() {
  return (
    <div
      className="flex items-center gap-2 py-1.5 px-3 animate-[fade-in_300ms_ease]"
      role="status"
      aria-label="Loading file change"
    >
      <Skeleton width="14px" height="14px" className="rounded shrink-0" />
      <Skeleton width="45%" height="11px" />
      <div className="ml-auto flex items-center gap-1">
        <Skeleton width="24px" height="10px" />
        <Skeleton width="24px" height="10px" />
      </div>
    </div>
  );
});

/** Full turn container skeleton — header + message lines + tool call slots. */
export const TurnSkeleton = React.memo(function TurnSkeleton() {
  return (
    <div
      className="flex flex-col gap-2 py-3 px-3 border-b border-vsc-border animate-[fade-in_300ms_ease]"
      role="status"
      aria-label="Loading turn"
    >
      {/* Turn header: status dot + timestamp + bookmark */}
      <div className="flex items-center gap-2">
        <Skeleton width="8px" height="8px" className="rounded-full shrink-0" />
        <Skeleton width="60px" height="10px" />
        <div className="flex-1" />
        <Skeleton width="16px" height="16px" className="rounded" />
      </div>
      {/* Message body lines */}
      <div className="pl-4 flex flex-col gap-1.5">
        <Skeleton variant="text" width="90%" height="13px" />
        <Skeleton variant="text" width="70%" height="13px" />
        <Skeleton variant="text" width="80%" height="13px" />
      </div>
      {/* Tool call slot */}
      <div className="pl-4 flex items-center gap-2">
        <Skeleton width="14px" height="14px" className="rounded shrink-0" />
        <Skeleton width="100px" height="11px" />
        <div className="ml-auto">
          <Skeleton width="50px" height="10px" />
        </div>
      </div>
      {/* File change slot */}
      <div className="pl-4 flex items-center gap-2">
        <Skeleton width="14px" height="14px" className="rounded shrink-0" />
        <Skeleton width="45%" height="11px" />
        <div className="ml-auto flex items-center gap-1">
          <Skeleton width="24px" height="10px" />
          <Skeleton width="24px" height="10px" />
        </div>
      </div>
    </div>
  );
});
