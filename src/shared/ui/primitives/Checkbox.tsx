import React, { useId } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { useControllable } from "../../lib";
import { cn } from "../variants";
import { Icon } from "./Icon";

const checkboxVariants = cva(
  [
    "inline-flex items-center justify-center shrink-0 rounded border",
    "transition-[color,background-color,border-color] duration-fast",
    "focus-ring cursor-pointer",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
  {
    variants: {
      size: {
        xs: "h-3 w-3",
        sm: "h-3.5 w-3.5",
        md: "h-4 w-4",
        lg: "h-5 w-5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export type CheckboxProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Visible label. Provides accessible name via native label association. */
  label?: string;
  /** Accessible name when no visible label is provided. */
  "aria-label"?: string;
  id?: string;
  className?: string;
} & VariantProps<typeof checkboxVariants>;

/**
 * Checkbox — accessible toggle with indeterminate state support.
 *
 * - `useControllable` for controlled/uncontrolled unification
 * - Native `<button>` handles Space/Enter — no custom keyDown needed
 * - `data-state` exposed for CSS-only styling
 * - No double screen-reader announcement (aria-label only when no visible label)
 */
export const Checkbox = React.memo(
  React.forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
    {
      checked: controlledChecked,
      defaultChecked = false,
      indeterminate = false,
      onCheckedChange,
      disabled = false,
      label,
      "aria-label": ariaLabel,
      id: externalId,
      size,
      className,
    },
    ref,
  ) {
    const autoId = useId();
    const id = externalId ?? autoId;
    const labelId = `${id}-label`;

    const [isChecked, setChecked] = useControllable(
      controlledChecked,
      onCheckedChange,
      defaultChecked,
    );

    const active = indeterminate || isChecked;
    let dataState: "indeterminate" | "checked" | "unchecked";
    if (indeterminate) {
      dataState = "indeterminate";
    } else if (isChecked) {
      dataState = "checked";
    } else {
      dataState = "unchecked";
    }

    return (
      <span className={cn("inline-flex items-center gap-2", className)}>
        <button
          ref={ref}
          type="button"
          role="checkbox"
          id={id}
          aria-checked={indeterminate ? "mixed" : isChecked}
          aria-label={label ? undefined : ariaLabel}
          aria-labelledby={label ? labelId : undefined}
          disabled={disabled}
          data-state={dataState}
          onClick={() => {
            if (!disabled) setChecked((prev) => !prev);
          }}
          className={cn(
            checkboxVariants({ size }),
            active
              ? "bg-vsc-button border-vsc-button text-vsc-button-fg"
              : "bg-vsc-input-bg border-vsc-input-border text-transparent hover:border-vsc-focus",
          )}
        >
          {(() => {
            if (indeterminate) return <Icon name="dash" tokenSize="2xs" />;
            if (isChecked) return <Icon name="check" tokenSize="2xs" />;
            return null;
          })()}
        </button>
        {label && (
          <label
            id={labelId}
            htmlFor={id}
            className={cn(
              "text-xs text-vsc-fg cursor-pointer select-none",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            {label}
          </label>
        )}
      </span>
    );
  }),
);
