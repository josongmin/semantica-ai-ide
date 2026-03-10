import React, { useCallback } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { turnOrderSortedAtom } from "~entities/message/turns";

import { clearFocusedTurnAtom, focusedTurnIdAtom, turnTocOpenAtom } from "../../shared/lib";
import type { TurnId } from "../../shared/protocol";
import { cn, Icon, OverlayPortal, Text } from "../../shared/ui";
import { TocCard } from "./TocCard";
import { useTocKeyboardNav } from "./useTocKeyboardNav";

// ─── TurnTableOfContents (center modal) ────────────────────

export const TurnTableOfContents = React.memo(function TurnTableOfContents() {
  const [tocOpen, setTocOpen] = useAtom(turnTocOpenAtom);
  const turnIds = useAtomValue(turnOrderSortedAtom);
  const setFocusedTurnId = useSetAtom(focusedTurnIdAtom);
  const clearFocused = useSetAtom(clearFocusedTurnAtom);

  const handleNavigate = useCallback(
    (turnId: TurnId) => {
      setFocusedTurnId(turnId);
      clearFocused();
      window.dispatchEvent(new CustomEvent("scroll-to-turn", { detail: { turnId } }));
    },
    [setFocusedTurnId, clearFocused],
  );

  const handleClose = useCallback(() => {
    setTocOpen(false);
  }, [setTocOpen]);

  const { setCardRef } = useTocKeyboardNav({
    tocOpen,
    turnIds,
    onNavigate: handleNavigate,
    onClose: handleClose,
  });

  if (!tocOpen) return null;

  return (
    <OverlayPortal>
      <div
        className="fixed inset-0 z-[--z-modal] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Turn list"
        data-testid="turn-toc"
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-vsc-fg/50 backdrop-blur-md animate-[fade-in_180ms_ease-out]"
          aria-hidden
          onClick={handleClose}
        />

        {/* Modal card */}
        <div
          className={cn(
            "relative w-full max-w-xl max-h-[--panel-max-h-xl]",
            "flex flex-col rounded-2xl overflow-hidden",
            "bg-vsc-surface-1/95 border border-vsc-border/60 shadow-modal",
            "backdrop-blur-xl",
            "animate-[scale-in_var(--duration-glacial)_cubic-bezier(0.16,1,0.3,1)]",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-vsc-border/50 shrink-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-vsc-focus/20 to-vsc-info/10 shadow-inner">
              <Icon name="history" tokenSize="sm" className="text-vsc-focus" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-vsc-fg tracking-tight">Turns</h2>
              <p className="text-2xs text-vsc-text-tertiary mt-0.5">
                {turnIds.length} conversation{turnIds.length !== 1 ? "s" : ""} · ↑↓ navigate · Enter
                select
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close (Esc)"
              className="flex items-center justify-center w-9 h-9 rounded-xl
                       text-vsc-text-tertiary hover:text-vsc-fg hover:bg-vsc-toolbar
                       transition-colors duration-fast focus-ring"
            >
              <Icon name="close" tokenSize="sm" />
            </button>
          </div>

          {/* Turn list */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-none scroll-shadow"
            data-scroll-contain
          >
            {turnIds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-vsc-surface-2 flex items-center justify-center mb-4">
                  <Icon name="list-ordered" tokenSize="lg" className="text-vsc-text-ghost" />
                </div>
                <Text size="sm" weight="medium" tone="primary" className="mb-1">
                  No turns yet
                </Text>
                <Text size="xs" tone="ghost">
                  Start a conversation to see your turns here
                </Text>
              </div>
            ) : (
              turnIds.map((turnId, i) => (
                <TocCard
                  key={turnId}
                  turnId={turnId}
                  index={i}
                  onNavigate={handleNavigate}
                  onClose={handleClose}
                  cardRef={setCardRef(i)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </OverlayPortal>
  );
});
