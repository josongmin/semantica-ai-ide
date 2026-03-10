import React, { useCallback, useEffect, useRef, useState } from "react";

import type { ToastData, ToastVariant } from "../../lib/atoms/toastAtoms";
import { cn } from "../variants";
import { Icon } from "./Icon";
import { OverlayPortal } from "./OverlayPortal";

export type { ToastData, ToastVariant };

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const DEFAULT_DURATION = 4000;
const MAX_TOASTS = 5;

const variantStyles: Record<ToastVariant, string> = {
  info: "border-vsc-info/30 text-vsc-info bg-vsc-info/[0.06]",
  success: "border-vsc-success/30 text-vsc-success bg-vsc-success/[0.06]",
  error: "border-vsc-error/30 text-vsc-error bg-vsc-error/[0.06]",
  warning: "border-vsc-warning/30 text-vsc-warning bg-vsc-warning/[0.06]",
};

const variantIcons: Record<ToastVariant, string> = {
  info: "info",
  success: "check",
  error: "error",
  warning: "warning",
};

const EXIT_DURATION = 150;

const ToastItem = React.memo(function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const exitTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [exiting, setExiting] = useState(false);
  const variant = toast.variant ?? "info";

  const startExit = useCallback(() => {
    setExiting(true);
    exitTimerRef.current = setTimeout(() => onDismiss(toast.id), EXIT_DURATION);
  }, [onDismiss, toast.id]);

  useEffect(() => {
    const ms = toast.duration ?? DEFAULT_DURATION;
    timerRef.current = setTimeout(startExit, ms);
    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(exitTimerRef.current);
    };
  }, [toast.id, toast.duration, startExit]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-2 px-3 py-2 rounded-md border",
        "bg-vsc-surface-2/90 backdrop-blur-md shadow-lg text-sm",
        exiting
          ? "animate-[slide-out-right_150ms_ease-in_forwards] pointer-events-none"
          : "animate-[slide-in-right_200ms_ease]",
        variantStyles[variant],
      )}
    >
      <Icon name={variantIcons[variant]} tokenSize="sm" className="shrink-0 mt-0.5" />
      <span className="flex-1 text-vsc-fg">{toast.message}</span>
      <button
        type="button"
        onClick={startExit}
        className="shrink-0 p-1 min-w-[24px] min-h-[24px] inline-flex items-center justify-center text-vsc-text-tertiary hover:text-vsc-fg transition-colors duration-fast cursor-pointer rounded focus-ring"
        aria-label="Dismiss"
      >
        <Icon name="close" tokenSize="xs" />
      </button>
    </div>
  );
});

export interface ToastContainerProps {
  toasts: readonly ToastData[];
  onDismiss: (id: string) => void;
}

/**
 * Fixed-position toast stack (top-right). Renders at most MAX_TOASTS items.
 * Each toast auto-dismisses after its configured duration.
 */
export const ToastContainer = React.memo(function ToastContainer({
  toasts,
  onDismiss,
}: ToastContainerProps) {
  const handleDismiss = useCallback(
    (id: string) => {
      onDismiss(id);
    },
    [onDismiss],
  );

  const visible = toasts.slice(0, MAX_TOASTS);

  if (visible.length === 0) return null;

  return (
    <OverlayPortal>
      <div
        aria-label="Notifications"
        className="fixed top-3 right-3 z-[--z-toast] flex flex-col gap-2 w-80 max-w-[calc(100vw-24px)] pointer-events-auto stagger-children"
      >
        {visible.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={handleDismiss} />
        ))}
      </div>
    </OverlayPortal>
  );
});
