import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../variants";
import { Icon } from "./Icon";

const spinnerVariants = cva("animate-spin", {
  variants: {
    size: {
      sm: "text-xs",
      md: "text-sm",
    },
  },
  defaultVariants: {
    size: "sm",
  },
});

export type SpinnerProps = VariantProps<typeof spinnerVariants> & {
  className?: string;
  label?: string;
};

export const Spinner = React.memo(
  React.forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
    { size, className, label = "Loading" },
    ref,
  ) {
    return (
      <span ref={ref} role="status" aria-label={label}>
        <Icon name="loading" className={cn(spinnerVariants({ size }), className)} title={label} />
      </span>
    );
  }),
);
