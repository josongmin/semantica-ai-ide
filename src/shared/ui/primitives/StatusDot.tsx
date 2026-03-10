import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../variants";

const statusDotVariants = cva("inline-block rounded-full", {
  variants: {
    status: {
      idle: "bg-vsc-fg/30",
      running: "bg-vsc-success",
      success: "bg-vsc-success",
      info: "bg-vsc-info",
      error: "bg-vsc-error",
      paused: "bg-vsc-warning",
    },
    size: {
      sm: "w-2 h-2",
      md: "w-2.5 h-2.5",
    },
  },
  defaultVariants: {
    status: "idle",
    size: "sm",
  },
});

export type StatusDotProps = VariantProps<typeof statusDotVariants> & {
  status: "idle" | "running" | "success" | "info" | "error" | "paused";
  pulse?: boolean;
  className?: string;
};

export const StatusDot = React.memo(
  React.forwardRef<HTMLSpanElement, StatusDotProps>(function StatusDot(
    { status, pulse = status === "running", size, className },
    ref,
  ) {
    return (
      <span
        ref={ref}
        role="status"
        aria-live="polite"
        aria-label={status}
        className={cn(
          statusDotVariants({ status, size }),
          pulse && "animate-[pulse_2s_ease-in-out_infinite]",
          className,
        )}
        title={status}
      />
    );
  }),
);
