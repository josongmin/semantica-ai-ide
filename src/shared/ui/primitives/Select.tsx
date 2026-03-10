import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { useControllable } from "../../lib";
import { cn } from "../variants";
import { Icon } from "./Icon";
import { OverlayPortal } from "./OverlayPortal";

const selectTriggerVariants = cva(
  [
    "inline-flex items-center justify-between gap-2 w-full rounded-md border",
    "bg-vsc-input-bg text-vsc-input-fg border-vsc-input-border",
    "transition-colors duration-fast focus-ring cursor-pointer",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
  {
    variants: {
      size: {
        xs: "h-5 px-1.5 text-2xs",
        sm: "h-7 px-2.5 text-xs",
        md: "h-8 px-3 text-xs",
        lg: "h-9 px-3 text-sm",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export type SelectProps = {
  options: readonly SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
} & VariantProps<typeof selectTriggerVariants>;

/**
 * Select — accessible dropdown with portal-based listbox.
 *
 * - Portal rendering (no overflow clipping from ancestors)
 * - Auto-focus listbox on open
 * - Escape handled locally with stopPropagation (safe inside Dialog)
 * - aria-activedescendant + option ids (WAI-ARIA Listbox pattern)
 * - Type-ahead: pressing printable chars jumps to matching option
 * - Exit animation via mounted/exiting state machine
 * - `data-state` on trigger and listbox for CSS-only styling
 * - `useControllable` for controlled/uncontrolled
 */
export const Select = React.memo(
  React.forwardRef<HTMLButtonElement, SelectProps>(function Select(
    {
      options,
      value: controlledValue,
      defaultValue = "",
      onValueChange,
      placeholder = "Select...",
      disabled = false,
      size,
      className,
    },
    ref,
  ) {
    const baseId = useId();
    const listboxId = `${baseId}-listbox`;
    const triggerId = `${baseId}-trigger`;

    const [currentValue, selectValue] = useControllable(
      controlledValue,
      onValueChange,
      defaultValue,
    );

    // Open / exit state machine
    const [open, setOpen] = useState(false);
    const [exiting, setExiting] = useState(false);
    const mounted = open || exiting;

    const [highlightIdx, setHighlightIdx] = useState(-1);
    const internalTriggerRef = useRef<HTMLButtonElement | null>(
      null,
    );
    const listboxRef = useRef<HTMLUListElement>(null);
    const [pos, setPos] = useState({ top: 0, bottom: 0, left: 0, width: 0, dropUp: false });

    // Type-ahead
    const typeaheadBuf = useRef("");
    const typeaheadTimer = useRef<ReturnType<typeof setTimeout>>();

    const selectedOption = options.find((o) => o.value === currentValue);

    // Ref forwarding — compose consumer ref + internal ref
    const setTriggerRef = useCallback(
      (node: HTMLButtonElement | null) => {
        internalTriggerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as { current: HTMLButtonElement | null }).current = node;
      },
      [ref],
    );

    // Option id generator
    const optionId = useCallback((i: number) => `${baseId}-opt-${i}`, [baseId]);
    const highlightedOptionId = highlightIdx >= 0 ? optionId(highlightIdx) : undefined;

    // Cleanup typeahead timer + buffer on unmount
    useEffect(() => {
      return () => {
        clearTimeout(typeaheadTimer.current);
        typeaheadBuf.current = "";
      };
    }, []);

    // --- Open / Close ---
    const openDropdown = useCallback(() => {
      if (disabled || options.length === 0) return;
      setOpen(true);
      setExiting(false);
      const selectedIdx = options.findIndex((o) => o.value === currentValue);
      setHighlightIdx(selectedIdx >= 0 ? selectedIdx : 0);
    }, [disabled, options, currentValue]);

    const closeDropdown = useCallback(() => {
      setOpen(false);
      setExiting(true);
      internalTriggerRef.current?.focus();
    }, []);

    const selectAndClose = useCallback(
      (val: string) => {
        selectValue(val);
        closeDropdown();
      },
      [selectValue, closeDropdown],
    );

    // --- Portal positioning (scroll/resize aware, rAF-throttled) ---
    const posRafRef = useRef<number | null>(null);
    useLayoutEffect(() => {
      if (!mounted || !internalTriggerRef.current) return;
      const computePos = () => {
        if (!internalTriggerRef.current) return;
        const rect = internalTriggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropUp = spaceBelow < 200 && rect.top > spaceBelow;
        setPos({
          top: rect.bottom + 4,
          bottom: window.innerHeight - rect.top + 4,
          left: rect.left,
          width: rect.width,
          dropUp,
        });
      };
      computePos();
      const throttledUpdate = () => {
        if (posRafRef.current !== null) return;
        posRafRef.current = requestAnimationFrame(() => {
          posRafRef.current = null;
          computePos();
        });
      };
      window.addEventListener("scroll", throttledUpdate, true);
      window.addEventListener("resize", throttledUpdate);
      return () => {
        if (posRafRef.current !== null) {
          cancelAnimationFrame(posRafRef.current);
          posRafRef.current = null;
        }
        window.removeEventListener("scroll", throttledUpdate, true);
        window.removeEventListener("resize", throttledUpdate);
      };
    }, [mounted]);

    // --- Auto-focus listbox on open ---
    useEffect(() => {
      if (open) {
        requestAnimationFrame(() => listboxRef.current?.focus());
      }
    }, [open]);

    // --- Close on outside click (portal-aware) ---
    useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
        const target = e.target as Node;
        if (internalTriggerRef.current?.contains(target) || listboxRef.current?.contains(target))
          return;
        closeDropdown();
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [open, closeDropdown]);

    // --- Exit animation end ---
    const handleAnimationEnd = useCallback(() => {
      if (exiting) setExiting(false);
    }, [exiting]);

    // --- Scroll highlighted into view ---
    useEffect(() => {
      if (open && highlightIdx >= 0) {
        document.getElementById(optionId(highlightIdx))?.scrollIntoView({ block: "nearest" });
      }
    }, [open, highlightIdx, optionId]);

    // --- Type-ahead ---
    const handleTypeahead = useCallback(
      (char: string) => {
        clearTimeout(typeaheadTimer.current);
        typeaheadBuf.current += char.toLowerCase();
        typeaheadTimer.current = setTimeout(() => {
          typeaheadBuf.current = "";
        }, 500);

        const match = options.findIndex(
          (o) => !o.disabled && o.label.toLowerCase().startsWith(typeaheadBuf.current),
        );
        if (match >= 0) setHighlightIdx(match);
      },
      [options],
    );

    // --- Trigger keyboard ---
    const handleTriggerKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (disabled) return;
        switch (e.key) {
          case "Enter":
          case " ":
          case "ArrowDown":
            e.preventDefault();
            openDropdown();
            break;
          case "ArrowUp":
            e.preventDefault();
            openDropdown();
            setHighlightIdx(options.length - 1);
            break;
        }
      },
      [disabled, openDropdown, options.length],
    );

    // --- Listbox keyboard ---
    const handleListKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        const enabled = options.map((o, i) => ({ ...o, i })).filter((o) => !o.disabled);
        const currentEnabledIdx = enabled.findIndex((o) => o.i === highlightIdx);

        switch (e.key) {
          case "ArrowDown": {
            e.preventDefault();
            const next = enabled[(currentEnabledIdx + 1) % enabled.length];
            if (next) setHighlightIdx(next.i);
            break;
          }
          case "ArrowUp": {
            e.preventDefault();
            const prev = enabled[(currentEnabledIdx - 1 + enabled.length) % enabled.length];
            if (prev) setHighlightIdx(prev.i);
            break;
          }
          case "Enter":
          case " ":
            e.preventDefault();
            if (highlightIdx >= 0) {
              const opt = options[highlightIdx];
              if (opt !== undefined && !opt.disabled) {
                selectAndClose(opt.value);
              }
            }
            break;
          case "Home":
            e.preventDefault();
            if (enabled[0] !== undefined) setHighlightIdx(enabled[0].i);
            break;
          case "End":
            e.preventDefault();
            if (enabled.length > 0) {
              const last = enabled[enabled.length - 1];
              if (last !== undefined) setHighlightIdx(last.i);
            }
            break;
          case "Escape":
            e.preventDefault();
            e.stopPropagation(); // Don't propagate to parent Dialog
            closeDropdown();
            break;
          case "Tab":
            closeDropdown();
            break;
          default:
            // Type-ahead: single printable character
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
              e.preventDefault();
              handleTypeahead(e.key);
            }
            break;
        }
      },
      [options, highlightIdx, selectAndClose, closeDropdown, handleTypeahead],
    );

    const dataState = open ? "open" : "closed";

    return (
      <>
        <div className={cn("relative", className)}>
          <button
            ref={setTriggerRef}
            type="button"
            id={triggerId}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? listboxId : undefined}
            disabled={disabled}
            data-state={dataState}
            onClick={() => {
              if (open) closeDropdown();
              else openDropdown();
            }}
            onKeyDown={handleTriggerKeyDown}
            className={selectTriggerVariants({ size })}
          >
            <span
              className={cn("truncate", !selectedOption && "text-vsc-text-ghost")}
              title={selectedOption?.label ?? placeholder}
            >
              {selectedOption?.label ?? placeholder}
            </span>
            <Icon
              name="chevron-down"
              tokenSize="2xs"
              className={cn(
                "shrink-0 text-vsc-text-tertiary transition-transform duration-fast",
                open && "rotate-180",
              )}
            />
          </button>
        </div>

        {mounted && (
          <OverlayPortal>
            <ul
              ref={listboxRef}
              id={listboxId}
              role="listbox"
              aria-labelledby={triggerId}
              aria-activedescendant={highlightedOptionId}
              tabIndex={0}
              onKeyDown={handleListKeyDown}
              onAnimationEnd={handleAnimationEnd}
              style={{
                position: "fixed",
                ...(pos.dropUp ? { bottom: pos.bottom } : { top: pos.top }),
                left: pos.left,
                width: pos.width,
              }}
              className={cn(
                "z-[--z-overlay] py-1 rounded-md border",
                "bg-vsc-surface-2 border-vsc-border/50 shadow-lg",
                "max-h-60 overflow-y-auto scrollbar-none",
                "outline-none",
                exiting ? "animate-[fade-out_100ms_ease]" : "animate-[scale-in_120ms_ease-out]",
                pos.dropUp ? "origin-bottom" : "origin-top",
              )}
              data-state={dataState}
            >
              {options.map((opt, i) => {
                const isSelected = opt.value === currentValue;
                const isHighlighted = i === highlightIdx;
                return (
                  <li
                    key={opt.value}
                    id={optionId(i)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled ?? undefined}
                    data-state={isSelected ? "checked" : "unchecked"}
                    onClick={() => {
                      if (!opt.disabled) selectAndClose(opt.value);
                    }}
                    onMouseEnter={() => setHighlightIdx(i)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer",
                      "transition-colors duration-fast",
                      isHighlighted && "bg-vsc-list-hover",
                      isSelected && "text-vsc-button font-medium",
                      opt.disabled && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <span className="w-4 shrink-0 text-center">
                      {isSelected && <Icon name="check" tokenSize="2xs" />}
                    </span>
                    <span className="truncate" title={opt.label}>
                      {opt.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </OverlayPortal>
        )}
      </>
    );
  }),
);
