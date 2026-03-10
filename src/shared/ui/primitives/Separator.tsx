import React from "react";

import { cn } from "../variants";

export interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export const Separator = React.memo(
  React.forwardRef<HTMLDivElement, SeparatorProps>(function Separator(
    { orientation = "horizontal", className },
    ref,
  ) {
    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation={orientation}
        className={cn(
          orientation === "horizontal" ? "w-full h-px bg-vsc-border" : "h-full w-px bg-vsc-border",
          className,
        )}
      />
    );
  }),
);
