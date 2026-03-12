import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../variants";

const badgeVariants = cva(
  "inline-flex items-center justify-center shrink-0 whitespace-nowrap font-medium",
  {
    variants: {
      variant: {
        default: "bg-vsc-badge-bg text-vsc-badge-fg",
        success: "bg-vsc-success/20 text-vsc-success",
        warning: "bg-vsc-warning/20 text-vsc-warning",
        error: "bg-vsc-error/20 text-vsc-error",
        info: "bg-vsc-info/20 text-vsc-info",
        muted: "bg-vsc-surface-2/80 text-vsc-text-tertiary",
        outline: "border border-vsc-border bg-transparent text-vsc-text-secondary",
      },
      size: {
        sm: "min-w-4 min-h-4 px-1 py-px rounded-full text-3xs leading-tight",
        md: "min-w-5 min-h-5 px-1.5 py-0.5 rounded-full text-2xs leading-tight",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export type BadgeProps = VariantProps<typeof badgeVariants> &
  Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> & {
    text: string | number;
  };

export const Badge = React.memo(
  React.forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
    { text, variant, size, className, ...rest },
    ref,
  ) {
    return (
      <span ref={ref} className={cn(badgeVariants({ variant, size }), className)} {...rest}>
        {text}
      </span>
    );
  }),
);
