import React from "react";

import { cn } from "../variants";

interface StickyHeaderProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Sticky header wrapper — pins content to top of scroll container.
 * Uses z-sticky token and surface-1 bg to prevent content bleed-through.
 */
export const StickyHeader = React.memo(function StickyHeader({
  children,
  className,
}: StickyHeaderProps) {
  return (
    <div
      className={cn(
        "sticky top-0 bg-vsc-bg/80 backdrop-blur-sm z-[--z-sticky] border-b border-vsc-border shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
});
