import { type RefObject, useCallback, useLayoutEffect, useRef } from "react";

import type { OverlayEntry } from "../atoms";
import { useAnimatedPresence } from "./useAnimatedPresence";
import { useBodyScrollLock } from "./useBodyScrollLock";
import { useClickOutside } from "./useClickOutside";
import { useEscapeDismiss } from "./useEscapeDismiss";
import { useFocusTrap } from "./useFocusTrap";
import { useOverlayStack } from "./useOverlayStack";

interface OverlayBehaviorConfig {
  id: string;
  type: OverlayEntry["type"];
  open: boolean;
  onClose: (() => void) | null;
  containerRef: RefObject<HTMLElement | null>;
  /** Enable Escape key dismissal. Default: true when onClose is provided */
  escape?: boolean;
  /** Enable click-outside dismissal. Default: false */
  clickOutside?: boolean;
  /** Extra ref to exclude from click-outside (e.g. portal menu) */
  excludeRef?: RefObject<HTMLElement | null>;
  /** Lock body scroll when open. Default: false */
  bodyLock?: boolean;
  /** Enable focus trap with Tab wrapping. Default: false */
  focusTrap?: boolean;
  /** Exit animation duration in ms. Default: 150 */
  exitDurationMs?: number;
}

interface OverlayBehaviorReturn {
  mounted: boolean;
  exiting: boolean;
  isTop: boolean;
  /** Attach to container's onKeyDown for focus trap Tab wrapping */
  handleTabKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Composite overlay hook that encapsulates overlay stack registration,
 * Escape dismiss, click-outside dismiss, body scroll lock, focus trap,
 * and animated presence in a single call.
 *
 * Eliminates repeated 4-5 hook calls across Dialog, Popover,
 * CommandPalette, DropdownMenu, and similar overlay components.
 */
export function useOverlayBehavior({
  id,
  type,
  open,
  onClose,
  containerRef,
  escape = onClose !== null,
  clickOutside = false,
  excludeRef,
  bodyLock = false,
  focusTrap = false,
  exitDurationMs,
}: OverlayBehaviorConfig): OverlayBehaviorReturn {
  // Stable dismiss callback — avoids event listener churn when onClose is null
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });
  const dismiss = useCallback(() => onCloseRef.current?.(), []);

  const { isTop } = useOverlayStack(id, type, open, onClose);
  useEscapeDismiss(id, escape && open, dismiss);
  useClickOutside(containerRef, dismiss, clickOutside && open, excludeRef, id);
  useBodyScrollLock(bodyLock && open);
  const { handleTabKeyDown } = useFocusTrap(containerRef, focusTrap && open);
  const { mounted, exiting } = useAnimatedPresence(open, exitDurationMs);

  return { mounted, exiting, isTop, handleTabKeyDown };
}
