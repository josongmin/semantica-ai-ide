import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";

import {
  bookmarkedTurnIdsAtom,
  bookmarkLabelsAtom,
  getVscodeApi,
  toggleBookmarkAtom,
} from "../../shared/lib";
import type { BookmarkLabel, TurnId } from "../../shared/protocol";
import { cn, Icon, Tooltip } from "../../shared/ui";

const LABELS: readonly { value: BookmarkLabel; label: string; icon: string }[] = [
  { value: "decision", label: "Decision", icon: "milestone" },
  { value: "fix", label: "Fix", icon: "wrench" },
  { value: "risk", label: "Risk", icon: "warning" },
  { value: "important", label: "Important", icon: "star-full" },
];

interface TurnBookmarkButtonProps {
  readonly turnId: TurnId;
}

export const TurnBookmarkButton = React.memo(function TurnBookmarkButton({
  turnId,
}: TurnBookmarkButtonProps) {
  const bookmarkedIds = useAtomValue(bookmarkedTurnIdsAtom);
  const labels = useAtomValue(bookmarkLabelsAtom);
  const toggleBookmark = useSetAtom(toggleBookmarkAtom);
  const isBookmarked = bookmarkedIds.has(turnId);
  const currentLabel = labels.get(turnId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [flipUp, setFlipUp] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    if (isBookmarked) {
      // Remove bookmark
      toggleBookmark({ turn_id: turnId, bookmarked: false });
      getVscodeApi().postMessage({ type: "TOGGLE_BOOKMARK", turn_id: turnId, bookmarked: false });
    } else {
      // Open label picker
      setPickerOpen((v) => !v);
    }
  }, [isBookmarked, toggleBookmark, turnId]);

  const handleSelectLabel = useCallback(
    (label: BookmarkLabel) => {
      toggleBookmark({ turn_id: turnId, bookmarked: true, bookmark_label: label });
      getVscodeApi().postMessage({
        type: "TOGGLE_BOOKMARK",
        turn_id: turnId,
        bookmarked: true,
        bookmark_label: label,
      });
      setPickerOpen(false);
    },
    [toggleBookmark, turnId],
  );

  const handleClosePicker = useCallback(() => {
    setPickerOpen(false);
  }, []);

  // Flip picker direction if it would overflow viewport bottom
  useLayoutEffect(() => {
    if (!pickerOpen) return;
    const picker = pickerRef.current;
    const btn = buttonRef.current;
    if (!picker || !btn) return;

    const btnRect = btn.getBoundingClientRect();
    const pickerRect = picker.getBoundingClientRect();
    setFlipUp(btnRect.bottom + pickerRect.height + 4 > window.innerHeight - 8);
  }, [pickerOpen]);

  return (
    <div className="relative">
      <Tooltip
        content={isBookmarked ? `Bookmarked: ${currentLabel ?? "important"}` : "Bookmark turn"}
      >
        <button
          ref={buttonRef}
          type="button"
          onClick={handleToggle}
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark turn"}
          className={cn(
            "flex items-center justify-center w-5 h-5 rounded",
            "opacity-0 group-hover/turn:opacity-100 transition-opacity duration-fast",
            "hover:bg-vsc-toolbar transition-colors duration-fast cursor-pointer focus-ring",
            isBookmarked && "opacity-100 text-vsc-warning",
          )}
        >
          <Icon
            name={isBookmarked ? "star-full" : "star-empty"}
            tokenSize="2xs"
            className={isBookmarked ? "text-vsc-warning" : "text-vsc-text-tertiary"}
          />
        </button>
      </Tooltip>

      {/* Label picker dropdown */}
      {pickerOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[--z-overlay]" onClick={handleClosePicker} role="presentation" aria-hidden />
          <div
            ref={pickerRef}
            className={cn(
              "absolute left-0 z-[--z-overlay] bg-vsc-surface-1 border border-vsc-border rounded-md shadow-md py-1 min-w-[130px]",
              "animate-[scale-in_120ms_var(--ease-spring)]",
              flipUp ? "bottom-full mb-1 origin-bottom-left" : "top-full mt-1 origin-top-left",
            )}
            role="menu"
            aria-label="Select bookmark label"
          >
            {LABELS.map((item) => (
              <button
                key={item.value}
                type="button"
                role="menuitem"
                onClick={() => handleSelectLabel(item.value)}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-xs
                           hover:bg-vsc-list-hover transition-colors duration-fast cursor-pointer text-left focus-ring"
              >
                <Icon name={item.icon} tokenSize="2xs" className="text-vsc-text-secondary" />
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
});
