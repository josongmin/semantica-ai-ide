import React, { type RefObject, useEffect, useRef } from "react";

import { useFloatingPosition, useOverlayBehavior } from "../../lib";
import { HighlightedText } from "../primitives/HighlightedText";
import { Icon } from "../primitives/Icon";
import { Kbd } from "../primitives/Kbd";
import { OverlayPortal } from "../primitives/OverlayPortal";
import { cn } from "../variants";

// ─── Types ──────────────────────────────────────────────────

export interface CommandPaletteItem {
  readonly command: {
    readonly id: string;
    readonly name: string;
    readonly label: string;
    readonly description: string;
    readonly icon: string;
    readonly shortcutHint?: string;
  };
  readonly score: number;
  readonly matchIndices: readonly number[];
}

export interface CommandPaletteGroup {
  readonly category: string;
  readonly label: string;
  readonly items: readonly CommandPaletteItem[];
}

export interface CommandArgHint {
  readonly placeholder: string;
  readonly suggestions: readonly { readonly value: string; readonly label: string }[];
}

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  groups: readonly CommandPaletteGroup[];
  selectedIndex: number;
  onSelect: (id: string) => void;
  onHover: (index: number) => void;
  query: string;
  anchorRef: RefObject<HTMLElement | null>;
  /** Argument completion hint for the currently selected command */
  argHint?: CommandArgHint | null;
  className?: string;
}

// ─── Sub-components ─────────────────────────────────────────

const CategoryHeader = React.memo(function CategoryHeader({ label }: { label: string }) {
  return (
    <div className="px-3 py-1 text-2xs font-medium text-vsc-text-ghost tracking-wide select-none">
      {label}
    </div>
  );
});

const CommandItem = React.memo(function CommandItem({
  id,
  name,
  description,
  icon,
  shortcutHint,
  matchIndices,
  selected,
  disabled,
  onSelect,
  onMouseEnter,
}: {
  id: string;
  name: string;
  description: string;
  icon: string;
  shortcutHint?: string;
  matchIndices?: readonly number[];
  selected: boolean;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onMouseEnter: () => void;
}) {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected && itemRef.current) {
      itemRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [selected]);

  return (
    <div
      ref={itemRef}
      id={`slash-cmd-${id}`}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) onSelect(id);
      }}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault();
          onSelect(id);
        }
      }}
      onMouseEnter={onMouseEnter}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer",
        "transition-colors duration-fast",
        selected ? "bg-vsc-list-active text-vsc-fg" : "text-vsc-fg hover:bg-vsc-list-hover",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <Icon name={icon} tokenSize="base" className="text-vsc-text-secondary shrink-0" />
      <div className="flex-1 min-w-0 flex items-baseline gap-2">
        <span className="font-medium whitespace-nowrap">
          <HighlightedText
            text={name}
            indices={matchIndices?.map((i) => i + 1)} // +1 to offset the "/" prefix
          />
        </span>
        <span className="text-vsc-text-tertiary text-xs truncate" title={description}>
          {description}
        </span>
      </div>
      {shortcutHint && <Kbd className="shrink-0 ml-auto">{shortcutHint}</Kbd>}
    </div>
  );
});

// ─── Main Component ─────────────────────────────────────────

const OVERLAY_ID = "slash-command-palette";

/**
 * Floating command palette positioned above an anchor element.
 * SOTA+++ features:
 * - Auto-repositioning on scroll/resize via shared engine (previously missing)
 * - Stack-aware overlay integration
 * - Animated presence for smooth UX
 */
export const CommandPalette = React.memo(function CommandPalette({
  open,
  onClose,
  groups,
  selectedIndex,
  onSelect,
  onHover,
  query,
  anchorRef,
  argHint,
  className,
}: CommandPaletteProps) {
  const paletteRef = useRef<HTMLDivElement>(null);

  // Overlay integration
  const { mounted, exiting } = useOverlayBehavior({
    id: OVERLAY_ID,
    type: "command-palette",
    open,
    onClose,
    containerRef: paletteRef,
    clickOutside: true,
    exitDurationMs: 100,
  });

  // Shared positioning engine — places above anchor
  const { position, positioned: ready } = useFloatingPosition({
    anchorRef,
    floatingRef: paletteRef,
    placement: "top",
    align: "start",
    gap: 4,
    open,
    mounted,
  });
  const { top, left } = position;

  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);
  const isEmpty = totalItems === 0 && query.length > 0;

  if (!mounted) return null;

  let globalIndex = 0;

  return (
    <OverlayPortal>
      <div
        ref={paletteRef}
        role="listbox"
        aria-label="Slash commands"
        data-testid="command-palette"
        className={cn(
          "z-[--z-overlay] max-h-[280px]",
          exiting
            ? "overflow-hidden pointer-events-none"
            : "overflow-y-auto [scrollbar-gutter:stable] scroll-shadow",
          "glass-panel border border-vsc-border/40 rounded-lg shadow-lg py-1 will-change-transform",
          // eslint-disable-next-line no-nested-ternary -- animation state is a 3-way condition
          exiting
            ? "animate-[slide-up-out_var(--duration-fast)_ease-out]"
            : ready
              ? "animate-[slide-up-in_var(--duration-normal)_var(--ease-spring)]"
              : "opacity-0",
          className,
        )}
        style={{
          position: "fixed",
          top,
          left,
          width: Math.max(anchorRef.current?.getBoundingClientRect().width ?? 320, 320),
        }}
      >
        {isEmpty && (
          <div className="px-3 py-3 text-sm text-vsc-text-ghost text-center animate-[fade-in_var(--duration-normal)_ease-out]">
            No commands found
          </div>
        )}

        {groups.map((group) => (
          <div key={group.category}>
            <CategoryHeader label={group.label} />
            {group.items.map((item) => {
              const currentGlobalIndex = globalIndex++;
              return (
                <CommandItem
                  key={item.command.id}
                  id={item.command.id}
                  name={item.command.name}
                  description={item.command.description}
                  icon={item.command.icon}
                  shortcutHint={item.command.shortcutHint}
                  matchIndices={item.matchIndices.length > 0 ? item.matchIndices : undefined}
                  selected={currentGlobalIndex === selectedIndex}
                  onSelect={onSelect}
                  onMouseEnter={() => onHover(currentGlobalIndex)}
                />
              );
            })}
          </div>
        ))}

        {/* Argument completion hint */}
        {argHint && (
          <div className="border-t border-vsc-border px-3 py-1.5" data-testid="arg-hint">
            {argHint.suggestions.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {argHint.suggestions.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => onSelect(s.value)}
                    className="px-1.5 py-0.5 text-2xs rounded bg-vsc-code-bg text-vsc-text-secondary
                             hover:bg-vsc-list-hover transition-colors duration-fast cursor-pointer"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-2xs text-vsc-text-ghost italic">{argHint.placeholder}</span>
            )}
          </div>
        )}
      </div>
    </OverlayPortal>
  );
});
