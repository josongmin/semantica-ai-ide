import React from "react";

import { cn } from "../variants";

const sizeClasses = {
  "3xs": "text-3xs",
  "2xs": "text-2xs",
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
} as const;

export interface IconProps {
  name: string;
  className?: string;
  /** Token-based size. Use instead of inline fontSize. */
  tokenSize?: keyof typeof sizeClasses;
  /** Pixel size override for special cases. */
  size?: number;
  /** Visible tooltip title. Also provides accessible name when set. */
  title?: string;
  /** Accessible name for semantic (non-decorative) icons without a title. */
  "aria-label"?: string;
}

export const Icon = React.memo(
  React.forwardRef<HTMLElement, IconProps>(function Icon(
    { name, className, tokenSize, size, title, "aria-label": ariaLabel },
    ref,
  ) {
    const hasLabel =
      (title !== undefined && title !== "") || (ariaLabel !== undefined && ariaLabel !== "");
    return (
      <i
        ref={ref}
        className={cn(`codicon codicon-${name}`, tokenSize && sizeClasses[tokenSize], className)}
        style={size !== undefined && size !== 0 ? { fontSize: size } : undefined}
        title={title}
        aria-hidden={!hasLabel}
        aria-label={ariaLabel}
        role={hasLabel ? "img" : undefined}
      />
    );
  }),
);
