import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../variants";

const inputVariants = cva(
  [
    "w-full bg-vsc-input-bg text-vsc-input-fg border border-vsc-input-border rounded-md",
    "placeholder:text-vsc-text-ghost",
    "focus:outline-none focus:ring-1 focus:ring-vsc-focus focus:border-vsc-focus",
    "transition-colors duration-fast focus-ring",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
  {
    variants: {
      size: {
        xs: "h-5 px-1.5 text-2xs",
        sm: "px-2.5 py-1.5 text-xs",
        md: "px-3 py-2 text-xs",
        lg: "h-9 px-3 text-sm",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> &
  VariantProps<typeof inputVariants>;

export const Input = React.memo(
  React.forwardRef<HTMLInputElement, InputProps>(function Input(
    { size, className, ...props },
    ref,
  ) {
    return <input ref={ref} className={cn(inputVariants({ size }), className)} {...props} />;
  }),
);
