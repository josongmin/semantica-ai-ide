import React, { useCallback, useId, useRef } from "react";

import { cn } from "../variants";

export interface SegmentedOption<T extends string = string> {
  readonly value: T;
  readonly label: string;
  readonly icon?: string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** Accessible name for the radio group (WCAG 4.1.2). */
  "aria-label"?: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * 3-way (or N-way) segmented toggle control.
 * Visually similar to iOS-style segmented controls.
 * Accessible via role="radiogroup" + keyboard arrow navigation.
 */
export const SegmentedControl = React.memo(function SegmentedControl<T extends string = string>({
  options,
  value,
  onValueChange,
  "aria-label": ariaLabel,
  size = "sm",
  className,
}: SegmentedControlProps<T>) {
  const baseId = useId();
  const btnRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const setRef = useCallback(
    (v: string) => (el: HTMLButtonElement | null) => {
      if (el) btnRefs.current.set(v, el);
      else btnRefs.current.delete(v);
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const idx = options.findIndex((o) => o.value === value);
      if (idx === -1) return;

      let next: number | null = null;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          next = (idx + 1) % options.length;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          next = (idx - 1 + options.length) % options.length;
          break;
        case "Home":
          e.preventDefault();
          next = 0;
          break;
        case "End":
          e.preventDefault();
          next = options.length - 1;
          break;
      }
      if (next !== null) {
        const opt = options[next] as { value: string; label: string } | undefined;
        if (opt === undefined) return;
        onValueChange(opt.value as T);
        btnRefs.current.get(opt.value)?.focus();
      }
    },
    [options, value, onValueChange],
  );

  const sizeClasses = size === "sm" ? "text-2xs px-2 py-1" : "text-xs px-2.5 py-1.5";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={cn("inline-flex rounded-md bg-vsc-code-bg p-1 gap-0.5", className)}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={setRef(opt.value)}
            role="radio"
            type="button"
            id={`${baseId}-${opt.value}`}
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onValueChange(opt.value)}
            className={cn(
              "rounded font-medium transition-[color,background-color,transform] duration-fast cursor-pointer",
              "focus-ring select-none whitespace-nowrap active:scale-95",
              sizeClasses,
              isSelected
                ? "bg-vsc-button text-vsc-button-fg shadow-sm"
                : "bg-transparent text-vsc-text-tertiary hover:text-vsc-text-secondary",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}) as <T extends string = string>(props: SegmentedControlProps<T>) => React.ReactNode;
