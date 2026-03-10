import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { useFloatingPosition, useOverlayBehavior } from "../../lib";
import { OverlayPortal } from "../primitives/OverlayPortal";
import { cn } from "../variants";

export interface DropdownMenuItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly disabled?: boolean;
  readonly danger?: boolean;
  readonly separator?: boolean;
}

export interface DropdownMenuProps {
  items: readonly DropdownMenuItem[];
  onSelect: (id: string) => void;
  trigger: React.ReactElement;
  align?: "left" | "right";
  className?: string;
}

/**
 * Accessible dropdown menu with keyboard navigation.
 * SOTA+++ features:
 * - Auto-flip via shared positioning engine
 * - Auto-repositioning on scroll/resize
 * - Stack-aware click-outside dismissal
 * - role="menu" + role="menuitem" with full keyboard nav
 */
export const DropdownMenu = React.memo(function DropdownMenu({
  items,
  onSelect,
  trigger,
  align = "left",
  className,
}: DropdownMenuProps) {
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const focusIndexRef = useRef(-1);

  const close = useCallback(() => {
    setOpen(false);
    focusIndexRef.current = -1;
  }, []);

  const pendingRafRef = useRef<number | null>(null);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev) {
        if (pendingRafRef.current !== null) cancelAnimationFrame(pendingRafRef.current);
        pendingRafRef.current = requestAnimationFrame(() => {
          pendingRafRef.current = null;
          const firstItem = menuRef.current?.querySelector<HTMLElement>(
            '[role="menuitem"]:not([aria-disabled="true"])',
          );
          firstItem?.focus();
          focusIndexRef.current = 0;
        });
      }
      return !prev;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (pendingRafRef.current !== null) cancelAnimationFrame(pendingRafRef.current);
    };
  }, []);

  // --- Overlay hooks ---
  const { exiting } = useOverlayBehavior({
    id: `dropdown-${  menuId}`,
    type: "dropdown",
    open,
    onClose: close,
    containerRef,
    clickOutside: true,
    excludeRef: menuRef,
  });

  // --- Shared positioning engine ---
  const { position, positioned: ready } = useFloatingPosition({
    anchorRef: containerRef,
    floatingRef: menuRef,
    placement: "bottom",
    align: align === "right" ? "end" : "start",
    gap: 4,
    open,
    mounted: open,
  });
  const { top, left } = position;

  const enabledCount = useMemo(
    () => items.filter((i) => !i.disabled && !i.separator).length,
    [items],
  );

  const focusItem = useCallback(
    (index: number) => {
      if (enabledCount === 0) return;

      const wrappedIndex = ((index % enabledCount) + enabledCount) % enabledCount;
      focusIndexRef.current = wrappedIndex;
      const el = menuRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([aria-disabled="true"])',
      )[wrappedIndex];
      el?.focus();
    },
    [enabledCount],
  );

  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          focusItem(focusIndexRef.current + 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          focusItem(focusIndexRef.current - 1);
          break;
        case "Home":
          e.preventDefault();
          focusItem(0);
          break;
        case "End":
          e.preventDefault();
          focusItem(enabledCount - 1);
          break;
      }
    },
    [focusItem, enabledCount],
  );

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
      close();
    },
    [onSelect, close],
  );

  return (
    <div ref={containerRef} className={cn("relative inline-flex", className)}>
      { }
      {React.cloneElement(trigger, {
        onClick: toggle,
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": open ? menuId : undefined,
      })}

      {(open || exiting) && (
        <OverlayPortal>
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            onKeyDown={handleMenuKeyDown}
            style={
              ready
                ? { position: "fixed", top, left }
                : { position: "fixed", visibility: "hidden" as const }
            }
            className={cn(
              "min-w-[120px] py-0.5 will-change-transform",
              "bg-vsc-surface-2 border border-vsc-border/50 rounded-md shadow-md",
              "z-[--z-overlay]",
              exiting
                ? "animate-[fade-out_100ms_ease] pointer-events-none"
                : "animate-[fade-in_100ms_ease]",
            )}
          >
            {items.map((item) =>
              item.separator ? (
                <div
                  key={item.id}
                  role="separator"
                  className="my-1 mx-2 border-t border-vsc-border"
                />
              ) : (
                <button
                  key={item.id}
                  role="menuitem"
                  type="button"
                  aria-disabled={item.disabled}
                  tabIndex={-1}
                  onClick={() => {
                    if (!item.disabled) handleSelect(item.id);
                  }}
                  className={cn(
                    "w-full text-left px-2 py-1 text-xs flex items-center gap-1.5",
                    "transition-colors duration-fast focus-ring",
                    // eslint-disable-next-line no-nested-ternary -- 3-way style condition (disabled/danger/normal)
                    item.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : item.danger
                        ? "text-vsc-error hover:bg-vsc-error/10 cursor-pointer"
                        : "text-vsc-fg hover:bg-vsc-list-hover cursor-pointer",
                  )}
                >
                  {item.label}
                </button>
              ),
            )}
          </div>
        </OverlayPortal>
      )}
    </div>
  );
});
