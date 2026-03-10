import React, { useCallback, useRef } from "react";
import { atom, useAtom } from "jotai";

import { useOverlayBehavior } from "~shared/lib";
import { cn } from "~shared/ui";

// ─── State ──────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export const shortcutOverlayVisibleAtom = atom(false);

// ─── Shortcut Data ──────────────────────────────────────

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: "⌘K 1-7", description: "Switch surface (Chat→Fleet)" },
      { keys: "⌘B", description: "Toggle sidebar" },
      { keys: "⌘J", description: "Toggle bottom panel" },
      { keys: "⌘K ⌘K", description: "Toggle agent panel" },
      { keys: "⌘\\", description: "Focus / Zen mode" },
    ],
  },
  {
    title: "Panels",
    shortcuts: [
      { keys: "⌘`", description: "Open terminal" },
      { keys: "⌘⇧M", description: "Problems panel" },
      { keys: "⌘⇧U", description: "Output panel" },
      { keys: "⌘⇧L", description: "Event log" },
    ],
  },
  {
    title: "Chord (⌘K → ...)",
    shortcuts: [
      { keys: "S", description: "Toggle sidebar" },
      { keys: "B", description: "Toggle bottom" },
      { keys: "A", description: "Toggle agent" },
      { keys: "Z", description: "Zen mode" },
      { keys: "\\", description: "Split vertical" },
      { keys: "-", description: "Split horizontal" },
      { keys: "T / L / O / P", description: "Terminal / Log / Output / Problems" },
    ],
  },
  {
    title: "General",
    shortcuts: [
      { keys: "?", description: "Show this overlay" },
      { keys: "Esc", description: "Close overlay / exit focus" },
    ],
  },
];

// ─── Component ──────────────────────────────────────────

export const KeyboardShortcutOverlay = React.memo(function KeyboardShortcutOverlay() {
  const [visible, setVisible] = useAtom(shortcutOverlayVisibleAtom);
  const dialogRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setVisible(false), [setVisible]);

  const { mounted, exiting, handleTabKeyDown } = useOverlayBehavior({
    id: "keyboard-shortcut-overlay",
    type: "dialog",
    open: visible,
    onClose: close,
    containerRef: dialogRef,
    bodyLock: true,
    focusTrap: true,
    exitDurationMs: 180,
  });

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[--z-modal] flex items-center justify-center",
        exiting ? "animate-[fade-out_180ms_ease]" : "glass-backdrop",
      )}
      style={!exiting ? { animation: "overlay-backdrop-in 200ms ease both" } : undefined}
      onClick={close}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-labelledby="shortcut-overlay-title"
        aria-modal="true"
        tabIndex={-1}
        onKeyDown={(e) => {
          // Also close on "?" key
          if (e.key === "?") {
            e.preventDefault();
            close();
            return;
          }
          handleTabKeyDown(e);
        }}
        className={cn(
          "glass-panel rounded-xl shadow-modal max-w-[560px] w-full mx-4 overflow-hidden outline-none",
          exiting
            ? "animate-[scale-out_180ms_ease]"
            : "animate-[shortcut-card-in_250ms_var(--ease-spring)_both]",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-vsc-border/20">
          <h2 id="shortcut-overlay-title" className="text-sm font-semibold text-vsc-fg">
            Keyboard Shortcuts
          </h2>
          <button
            type="button"
            onClick={close}
            className={cn(
              "inline-flex items-center justify-center w-6 h-6 rounded-md",
              "cursor-pointer bg-transparent border-none text-vsc-text-ghost",
              "hover:text-vsc-fg hover:bg-vsc-surface-2/50 transition-colors duration-fast",
              "focus-ring",
            )}
            aria-label="Close"
          >
            <span className="text-sm">×</span>
          </button>
        </div>

        {/* Body — groups in a grid */}
        <div className="grid grid-cols-2 gap-4 p-5 stagger-children">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-2xs font-semibold uppercase tracking-wider text-vsc-accent/70 mb-2">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.shortcuts.map((s) => (
                  <li
                    key={s.keys}
                    className="flex items-center justify-between gap-2 text-2xs py-0.5"
                  >
                    <span className="text-vsc-text-secondary">{s.description}</span>
                    <kbd
                      className={cn(
                        "inline-flex items-center px-1.5 py-0.5 rounded",
                        "bg-vsc-surface-2/60 text-vsc-text-primary font-mono text-2xs",
                        "border border-vsc-border/20 whitespace-nowrap",
                      )}
                    >
                      {s.keys}
                    </kbd>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-2 border-t border-vsc-border/10 text-2xs text-vsc-text-ghost text-center">
          Press{" "}
          <kbd className="px-1 py-0.5 rounded bg-vsc-surface-2/50 border border-vsc-border/15 font-mono text-2xs">
            ?
          </kbd>{" "}
          or{" "}
          <kbd className="px-1 py-0.5 rounded bg-vsc-surface-2/50 border border-vsc-border/15 font-mono text-2xs">
            Esc
          </kbd>{" "}
          to close
        </div>
      </div>
    </div>
  );
});
