import { type RefObject,useCallback, useEffect } from "react";
import type { SetStateAction } from "jotai";

interface UseSearchKeyboardOptions {
  open: boolean;
  setOpen: (update: SetStateAction<boolean>) => void;
  dialogRef: RefObject<HTMLDivElement | null>;
}

/**
 * Handles keyboard interactions for the conversation search overlay:
 * - Cmd+Shift+F to toggle open/close
 * - Escape to close
 * - Tab focus trap within the dialog
 */
export function useSearchKeyboard({ open, setOpen, dialogRef }: UseSearchKeyboardOptions) {
  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  // Global shortcut: Cmd+Shift+F
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "f") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setOpen]);

  // Focus trap: Escape + Tab cycling
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'input, button, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first && last) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last && first) {
          e.preventDefault();
          first.focus();
        }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose, dialogRef]);

  return { handleClose };
}
