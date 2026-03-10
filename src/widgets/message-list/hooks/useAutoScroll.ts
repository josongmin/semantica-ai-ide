import { useCallback, useEffect, useRef, useState } from "react";
import type { Virtualizer } from "@tanstack/react-virtual";

/** Distance from bottom (px) within which we consider "at bottom" */
const BOTTOM_THRESHOLD = 50;

export interface UseAutoScrollOptions {
  parentRef: React.RefObject<HTMLDivElement | null>;
  virtualizer: Virtualizer<HTMLDivElement, Element>;
  turnCount: number;
  isRunning: boolean;
}

export interface UseAutoScrollReturn {
  isAtBottom: boolean;
  isAtBottomRef: React.RefObject<boolean>;
  handleScroll: () => void;
  scrollToBottom: () => void;
}

/**
 * Manages auto-scroll behaviour for a virtualised message list.
 *
 * - Tracks whether the user is "at bottom" via threshold-based detection.
 * - Auto-scrolls to the latest turn when new turns arrive (if at bottom).
 * - Runs a rAF loop during streaming to keep the viewport pinned.
 * - Applies a two-frame layout correction when streaming ends to prevent jank.
 */
export function useAutoScroll({
  parentRef,
  virtualizer,
  turnCount,
  isRunning,
}: UseAutoScrollOptions): UseAutoScrollReturn {
  const prevTurnCountRef = useRef(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isAtBottomRef = useRef(true);

  // Scroll handler: compute isAtBottom from gap (no stale closure on state)
  const handleScroll = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;
    const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = gap < BOTTOM_THRESHOLD;
    isAtBottomRef.current = atBottom;
    setIsAtBottom(atBottom);
  }, [parentRef]);

  // Auto-scroll on new turns (smooth when not streaming, instant otherwise)
  useEffect(() => {
    if (
      isAtBottomRef.current &&
      turnCount > prevTurnCountRef.current &&
      turnCount > 0
    ) {
      virtualizer.scrollToIndex(turnCount - 1, { align: "end", behavior: "smooth" });
    }
    prevTurnCountRef.current = turnCount;
  }, [turnCount, virtualizer]);

  // Auto-scroll during streaming via rAF.
  useEffect(() => {
    if (!isRunning) return;
    let rafId: number | null = null;
    let active = true;
    function tick() {
      if (!active) return;
      if (isAtBottomRef.current) {
        const el = parentRef.current;
        if (el && el.scrollHeight - el.scrollTop - el.clientHeight > 1) {
          el.scrollTop = el.scrollHeight;
        }
      }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => {
      active = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isRunning, parentRef]);

  // Streaming end: layout correction to prevent jank
  const prevRunningRef = useRef(isRunning);
  useEffect(() => {
    if (prevRunningRef.current && !isRunning && isAtBottomRef.current) {
      const el = parentRef.current;
      if (el) {
        const run = () => {
          el.scrollTop = el.scrollHeight;
        };
        requestAnimationFrame(() => requestAnimationFrame(run));
      }
    }
    prevRunningRef.current = isRunning;
  }, [isRunning, parentRef]);

  const scrollToBottom = useCallback(() => {
    const el = parentRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [parentRef]);

  return { isAtBottom, isAtBottomRef, handleScroll, scrollToBottom };
}
