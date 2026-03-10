import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../variants";
import { Icon } from "./Icon";
import { Slot } from "./Slot";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-1.5 rounded-md",
    "font-medium transition-[color,background-color,opacity,transform] duration-fast cursor-pointer active:scale-[0.97]",
    "disabled:opacity-50 disabled:cursor-not-allowed focus-ring",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-vsc-button text-vsc-button-fg hover:bg-vsc-button-hover",
        secondary: "bg-vsc-button-secondary text-vsc-button-secondary-fg hover:opacity-90",
        ghost: "bg-transparent text-vsc-fg hover:bg-vsc-toolbar",
        danger: "bg-vsc-error/20 text-vsc-error hover:bg-vsc-error/30",
        success: "bg-vsc-success/15 text-vsc-success hover:bg-vsc-success/25",
        warning: "bg-vsc-warning/15 text-vsc-warning hover:bg-vsc-warning/25",
        info: "bg-vsc-info/15 text-vsc-info hover:bg-vsc-info/25",
      },
      size: {
        xs: "h-5 px-1.5 text-2xs gap-0.5",
        sm: "px-2.5 py-1.5 text-xs min-h-7",
        md: "px-3 py-1.5 text-sm min-h-8",
        lg: "h-9 px-4 text-sm gap-2",
        icon: "p-1.5 min-h-7 min-w-7",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    icon?: string;
    asChild?: boolean;
  };

export const Button = React.memo(
  React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { variant, size, icon, asChild, children, className, type = "button", ...props },
    ref,
  ) {
    const mergedClassName = cn(buttonVariants({ variant, size }), className);

    if (asChild) {
      return (
        <Slot ref={ref as React.Ref<HTMLElement>} className={mergedClassName} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button ref={ref} type={type} className={mergedClassName} {...props}>
        {icon && <Icon name={icon} tokenSize="sm" />}
        {children}
      </button>
    );
  }),
);
