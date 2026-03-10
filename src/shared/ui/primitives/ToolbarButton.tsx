import React from "react";

import { cn } from "../variants";

export type ToolbarButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export const ToolbarButton = React.memo(
  React.forwardRef<HTMLButtonElement, ToolbarButtonProps>(function ToolbarButton(
    { active, className, children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "px-1.5 py-0.5 rounded text-2xs cursor-pointer transition-colors duration-fast focus-ring",
          active
            ? "bg-vsc-surface-2 text-vsc-fg font-medium"
            : "text-vsc-text-ghost hover:text-vsc-text-secondary",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  }),
);
