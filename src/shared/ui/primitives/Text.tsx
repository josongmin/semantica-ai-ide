import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../variants";

const textVariants = cva("", {
  variants: {
    size: {
      "3xs": "text-3xs",
      "2xs": "text-2xs",
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      md: "text-md",
      lg: "text-lg",
    },
    tone: {
      primary: "text-vsc-text-primary",
      secondary: "text-vsc-text-secondary",
      tertiary: "text-vsc-text-tertiary",
      ghost: "text-vsc-text-ghost",
      success: "text-vsc-success",
      warning: "text-vsc-warning",
      error: "text-vsc-error",
      info: "text-vsc-info",
      inherit: "text-inherit",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    truncate: {
      true: "truncate min-w-0",
    },
    mono: {
      true: "tabular-nums",
    },
  },
  defaultVariants: {
    size: "base",
    tone: "primary",
    weight: "normal",
  },
});

export type TextProps = VariantProps<typeof textVariants> & {
  as?: "span" | "p" | "div" | "label" | "h1" | "h2" | "h3";
  children: React.ReactNode;
  className?: string;
  title?: string;
};

export const Text = React.memo(
  React.forwardRef<HTMLElement, TextProps>(function Text(
    { as: Tag = "span", size, tone, weight, truncate, mono, className, children, ...rest },
    ref,
  ) {
    return (
      <Tag
        ref={ref as React.Ref<never>}
        className={cn(textVariants({ size, tone, weight, truncate, mono }), className)}
        {...rest}
      >
        {children}
      </Tag>
    );
  }),
);
