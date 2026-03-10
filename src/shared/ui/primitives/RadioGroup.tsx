import React, { useCallback, useId, useRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { useControllable } from "../../lib";
import { cn } from "../variants";

const radioVariants = cva(
  [
    "inline-flex items-center justify-center shrink-0 rounded-full border",
    "transition-[color,background-color,border-color] duration-fast",
    "focus-ring cursor-pointer",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
  {
    variants: {
      size: {
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

const dotVariants = cva("rounded-full bg-current", {
  variants: {
    size: {
      sm: "h-1.5 w-1.5",
      md: "h-2 w-2",
      lg: "h-2.5 w-2.5",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface RadioOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export type RadioGroupProps = {
  options: readonly RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
  /** Visible or accessible name for the radio group (WCAG 4.1.2). */
  label?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  className?: string;
} & VariantProps<typeof radioVariants>;

/**
 * RadioGroup — accessible single-select with roving tabindex.
 *
 * - All 4 arrow keys navigate (WAI-ARIA Radio Group spec)
 * - `useControllable` for controlled/uncontrolled
 * - Native `<label htmlFor>` association for each option
 * - `data-state` on each radio for CSS-only styling
 */
export const RadioGroup = React.memo(
  React.forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
    {
      options,
      value: controlledValue,
      defaultValue = "",
      onValueChange,
      disabled = false,
      orientation = "vertical",
      label,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      size,
      className,
    },
    ref,
  ) {
    const groupId = useId();

    const [currentValue, select] = useControllable(controlledValue, onValueChange, defaultValue);

    const optionRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    const setOptionRef = useCallback(
      (val: string) => (el: HTMLButtonElement | null) => {
        if (el) optionRefs.current.set(val, el);
        else optionRefs.current.delete(val);
      },
      [],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        const enabled = options.filter((o) => !o.disabled && !disabled);
        const idx = enabled.findIndex((o) => o.value === currentValue);
        if (idx === -1) return;

        let nextIdx: number | null = null;

        // WAI-ARIA: all 4 arrow keys work regardless of orientation
        switch (e.key) {
          case "ArrowDown":
          case "ArrowRight":
            e.preventDefault();
            nextIdx = (idx + 1) % enabled.length;
            break;
          case "ArrowUp":
          case "ArrowLeft":
            e.preventDefault();
            nextIdx = (idx - 1 + enabled.length) % enabled.length;
            break;
        }

        if (nextIdx !== null) {
          const next = enabled[nextIdx] as { value: string } | undefined;
          if (next === undefined) return;
          select(next.value);
          optionRefs.current.get(next.value)?.focus();
        }
      },
      [options, disabled, currentValue, select],
    );

    // Resolve accessible name — prefer aria-labelledby > aria-label > label
    const groupAriaLabel = ariaLabelledBy ? undefined : (ariaLabel ?? label);

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label={groupAriaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-orientation={orientation}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex gap-2",
          orientation === "vertical" ? "flex-col" : "flex-row flex-wrap",
          className,
        )}
      >
        {options.map((opt) => {
          const isSelected = opt.value === currentValue;
          const isDisabled = disabled || opt.disabled;
          const optionId = `${groupId}-${opt.value}`;
          const optLabelId = `${optionId}-label`;

          return (
            <span key={opt.value} className="inline-flex items-center gap-2">
              <button
                ref={setOptionRef(opt.value)}
                type="button"
                role="radio"
                id={optionId}
                aria-checked={isSelected}
                aria-labelledby={optLabelId}
                tabIndex={isSelected ? 0 : -1}
                disabled={isDisabled}
                data-state={isSelected ? "checked" : "unchecked"}
                onClick={() => select(opt.value)}
                className={cn(
                  radioVariants({ size }),
                  isSelected
                    ? "border-vsc-button text-vsc-button"
                    : "border-vsc-input-border text-transparent hover:border-vsc-focus",
                )}
              >
                {isSelected && <span className={dotVariants({ size })} />}
              </button>
              <label
                id={optLabelId}
                htmlFor={optionId}
                className={cn(
                  "text-xs text-vsc-fg cursor-pointer select-none",
                  isDisabled && "opacity-50 cursor-not-allowed",
                )}
              >
                {opt.label}
              </label>
            </span>
          );
        })}
      </div>
    );
  }),
);
