import React from "react";

import { cn } from "../variants";

export interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

export const Kbd = React.memo(
  React.forwardRef<HTMLElement, KbdProps>(function Kbd({ children, className }, ref) {
    return (
      <kbd
        ref={ref}
        className={cn(
          "inline-flex items-center px-1 py-0.5 rounded-sm",
          "bg-vsc-surface-2 text-vsc-text-secondary text-2xs",
          "border border-vsc-border font-[inherit]",
          className,
        )}
      >
        {children}
      </kbd>
    );
  }),
);
