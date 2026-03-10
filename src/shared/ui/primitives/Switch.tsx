import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { useControllable } from "../../lib";
import { cn } from "../variants";

const switchVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-normal focus-ring",
  {
    variants: {
      size: {
        sm: "h-4 w-7",
        md: "h-5 w-9",
        lg: "h-6 w-11",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

const knobVariants = cva(
  "pointer-events-none inline-block rounded-full bg-vsc-fg shadow-sm transition-transform duration-normal",
  {
    variants: {
      size: {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-5 w-5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export type SwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Visible label text — also provides accessible name. */
  label?: string;
  /** Accessible name when no visible label is provided. */
  "aria-label"?: string;
  className?: string;
} & VariantProps<typeof switchVariants>;

/**
 * Switch — accessible toggle with controlled/uncontrolled support.
 *
 * - `useControllable` for controlled/uncontrolled unification
 * - Native `<button>` handles Space/Enter — no custom keyDown needed
 * - `data-state` exposed for CSS-only styling
 */
export const Switch = React.memo(
  React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
    {
      checked: controlledChecked,
      defaultChecked = false,
      onCheckedChange,
      disabled = false,
      label,
      "aria-label": ariaLabel,
      size,
      className,
    },
    ref,
  ) {
    const [isChecked, setChecked] = useControllable(
      controlledChecked,
      onCheckedChange,
      defaultChecked,
    );

    let translateClass: string;
    if (size === "sm") {
      translateClass = isChecked ? "translate-x-3" : "translate-x-0";
    } else if (size === "lg") {
      translateClass = isChecked ? "translate-x-5" : "translate-x-0";
    } else {
      translateClass = isChecked ? "translate-x-4" : "translate-x-0";
    }

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-label={label ?? ariaLabel}
        disabled={disabled}
        data-state={isChecked ? "checked" : "unchecked"}
        onClick={() => {
          if (!disabled) setChecked((prev) => !prev);
        }}
        className={cn(
          switchVariants({ size }),
          isChecked ? "bg-vsc-button" : "bg-vsc-surface-3",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
      >
        <span aria-hidden="true" className={cn(knobVariants({ size }), translateClass)} />
      </button>
    );
  }),
);
