import { useCallback, useEffect, useRef, useState } from "react";

interface UseAnimatedPresenceReturn {
  /** Whether the component should be rendered in the DOM */
  mounted: boolean;
  /** Whether the component is in the "exiting" phase (apply exit animation classes) */
  exiting: boolean;
  /** Callback for onAnimationEnd — can be used instead of fixed timer */
  onAnimationEnd: () => void;
}

/**
 * Keeps a component mounted during its exit animation, then unmounts it.
 * Solves the "no exit animation" problem with conditional rendering.
 */
export function useAnimatedPresence(
  open: boolean,
  exitDurationMs = 150,
): UseAnimatedPresenceReturn {
  const [mounted, setMounted] = useState(open);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) {
      clearTimeout(timerRef.current);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- presence state machine requires synchronous transition
      setExiting(false);

      setMounted(true);
    } else {
      // Use functional updater to read current mounted state without adding it
      // to the dependency array (avoids the stale-closure / infinite-loop problem).
      setMounted((wasMounted) => {
        if (wasMounted) {
          setExiting(true);
          timerRef.current = setTimeout(() => {
            setMounted(false);
            setExiting(false);
          }, exitDurationMs);
        }
        return wasMounted;
      });
    }

    return () => clearTimeout(timerRef.current);
  }, [open, exitDurationMs]);

  const onAnimationEnd = useCallback(() => {
    if (!open) {
      clearTimeout(timerRef.current);
      setMounted(false);
      setExiting(false);
    }
  }, [open]);

  return { mounted, exiting, onAnimationEnd };
}
