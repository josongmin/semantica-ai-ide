import React, { useCallback, useEffect, useId, useMemo, useRef } from "react";

import { useOverlayBehavior } from "../../lib";
import { Icon } from "../primitives/Icon";
import { Kbd } from "../primitives/Kbd";
import { OverlayPortal } from "../primitives/OverlayPortal";
import { cn } from "../variants";

// ─── Types ──────────────────────────────────────────────

export interface ContextMenuItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly shortcut?: string;
  readonly disabled?: boolean;
  readonly danger?: boolean;
}

export interface ContextMenuSeparator { readonly separator: true }

export type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator;

export interface ContextMenuGroup {
  readonly label?: string;
  readonly items: readonly ContextMenuEntry[];
}

export interface ContextMenuProps {
  /** Positioned at this point (e.g. from MouseEvent) */
  position: { x: number; y: number } | null;
  /** Grouped menu entries — groups are visually separated */
  groups: readonly ContextMenuGroup[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

// ─── Helpers ────────────────────────────────────────────

function isSeparator(entry: ContextMenuEntry): entry is ContextMenuSeparator {
  return "separator" in entry && entry.separator;
}

function clampToViewport(x: number, y: number, el: HTMLElement): { x: number; y: number } {
  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    x: x + rect.width > vw ? Math.max(4, vw - rect.width - 4) : x,
    y: y + rect.height > vh ? Math.max(4, vh - rect.height - 4) : y,
  };
}

// ─── Component ──────────────────────────────────────────

export const ContextMenu = React.memo(function ContextMenu({
  position,
  groups,
  onSelect,
  onClose,
}: ContextMenuProps) {
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const focusIndexRef = useRef(-1);
  const open = position !== null;

  const { mounted, exiting } = useOverlayBehavior({
    id: `context-menu-${  menuId}`,
    type: "context-menu",
    open,
    onClose,
    containerRef: menuRef,
    clickOutside: true,
    exitDurationMs: 80,
  });

  // Flatten all actionable items for keyboard nav
  const actionableItems = useMemo(() => {
    const out: ContextMenuItem[] = [];
    for (const g of groups) {
      for (const entry of g.items) {
        if (!isSeparator(entry) && !entry.disabled) out.push(entry);
      }
    }
    return out;
  }, [groups]);

  const focusItem = useCallback(
    (index: number) => {
      if (actionableItems.length === 0) return;
      const n = actionableItems.length;
      const wrapped = ((index % n) + n) % n;
      focusIndexRef.current = wrapped;
      const el = menuRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]:not([aria-disabled="true"])',
      )[wrapped];
      el?.focus();
    },
    [actionableItems],
  );

  // Auto-focus first item on mount
  useEffect(() => {
    if (open && mounted && !exiting) {
      requestAnimationFrame(() => focusItem(0));
    }
  }, [open, mounted, exiting, focusItem]);

  // Clamp position to viewport
  const [clampedPos, setClampedPos] = React.useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!position || !menuRef.current) {
      setClampedPos(null);
      return;
    }
    // Wait one frame for the menu to render so we can measure it
    const pos = position;
    requestAnimationFrame(() => {
      const menu = menuRef.current;
      if (menu !== null) {
        setClampedPos(clampToViewport(pos.x, pos.y, menu));
      }
    });
  }, [position]);

  const handleKeyDown = useCallback(
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
          focusItem(actionableItems.length - 1);
          break;
      }
    },
    [focusItem, actionableItems.length],
  );

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
      onClose();
    },
    [onSelect, onClose],
  );

  if (!mounted) return null;

  return (
    <OverlayPortal>
      <div
        ref={menuRef}
        id={menuId}
        role="menu"
        onKeyDown={handleKeyDown}
        style={
          clampedPos
            ? { position: "fixed", top: clampedPos.y, left: clampedPos.x }
            : { position: "fixed", top: position?.y, left: position?.x, visibility: "hidden" as const }
        }
        className={cn(
          "min-w-[200px] max-w-[280px] py-1 will-change-transform outline-none",
          "bg-vsc-surface-2 border border-vsc-border rounded-lg shadow-xl",
          "z-[--z-modal]",
          exiting
            ? "animate-[fade-out_80ms_ease] pointer-events-none"
            : "animate-[fade-in_80ms_ease]",
        )}
      >
        {groups.map((group, gi) => (
          <React.Fragment key={gi}>
            {/* Group separator (between groups, not before first) */}
            {gi > 0 && (
              <div role="separator" className="my-1 mx-2 border-t border-vsc-border/40" />
            )}

            {/* Group label */}
            {group.label && (
              <div className="px-3 pt-1.5 pb-0.5 text-2xs font-medium text-vsc-text-ghost/50 uppercase tracking-wider select-none">
                {group.label}
              </div>
            )}

            {group.items.map((entry, ei) =>
              isSeparator(entry) ? (
                <div key={`sep-${ei}`} role="separator" className="my-1 mx-2 border-t border-vsc-border/40" />
              ) : (
                <button
                  key={entry.id}
                  role="menuitem"
                  type="button"
                  aria-disabled={entry.disabled}
                  tabIndex={-1}
                  onClick={() => {
                    if (!entry.disabled) handleSelect(entry.id);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1 text-xs flex items-center gap-2",
                    "transition-colors duration-fast focus-ring",
                    entry.disabled && "opacity-40 cursor-not-allowed",
                    !entry.disabled && entry.danger && "text-vsc-error hover:bg-vsc-error/10 focus:bg-vsc-error/10 cursor-pointer",
                    !entry.disabled && !entry.danger && "text-vsc-fg/80 hover:bg-vsc-list-hover hover:text-vsc-fg focus:bg-vsc-list-hover focus:text-vsc-fg cursor-pointer",
                  )}
                >
                  {entry.icon && (
                    <Icon
                      name={entry.icon}
                      tokenSize="2xs"
                      className={cn(
                        "shrink-0",
                        entry.danger ? "text-vsc-error/70" : "text-vsc-text-tertiary",
                      )}
                    />
                  )}
                  <span className="flex-1 min-w-0 truncate">{entry.label}</span>
                  {entry.shortcut && (
                    <Kbd className="text-2xs opacity-40 shrink-0 ml-2">{entry.shortcut}</Kbd>
                  )}
                </button>
              ),
            )}
          </React.Fragment>
        ))}
      </div>
    </OverlayPortal>
  );
});
