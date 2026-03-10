import React from "react";

import { cn } from "../variants";

export interface StreamingCursorProps {
  className?: string;
}

export const StreamingCursor = React.memo(function StreamingCursor({
  className,
}: StreamingCursorProps) {
  return (
    <span
      className={cn(
        "inline-block w-[2px] h-[1em] bg-vsc-fg align-text-bottom ml-px animate-[blink_1.2s_ease-in-out_infinite]",
        className,
      )}
      aria-hidden
    />
  );
});
