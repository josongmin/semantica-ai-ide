import React, { useCallback, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAtomValue } from "jotai";

import { turnOrderSortedAtom } from "~entities/message/turns";
import { sessionMetaAtom } from "~entities/session/state";
import { useKeyboardNavigation } from "~shared/bootstrap/keyboard-navigation/model/useKeyboardNavigation";

import type { TurnId } from "../../shared/protocol";
import { EmptyState, ErrorBoundary, InlineBanner } from "../../shared/ui";
import { TurnContainer } from "../turn-container";
import { useAutoScroll } from "./hooks/useAutoScroll";
import { useTurnAnimation } from "./hooks/useTurnAnimation";
import { ScrollToBottomButton } from "./ScrollToBottomButton";

/** Default estimated height per turn row (px) — refined by measureElement */
const ESTIMATE_SIZE = 200;

/**
 * Turn-level message list with @tanstack/react-virtual virtualization.
 * Auto-scrolls during streaming via rAF + threshold-based bottom detection.
 * Shows "scroll to bottom" button when scrolled up.
 *
 * Key UX: user scrolls away -> auto-scroll pauses -> user returns to bottom -> auto-scroll resumes.
 */
export const MessageList = React.memo(function MessageList() {
  const turnIds = useAtomValue(turnOrderSortedAtom);
  const meta = useAtomValue(sessionMetaAtom);
  const isRunning = meta.status === "running";
  const parentRef = useRef<HTMLDivElement>(null);
  const turnElementsRef = useRef<Map<number, HTMLElement>>(new Map());

  // --- Virtualizer ---
  const virtualizer = useVirtualizer({
    count: turnIds.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATE_SIZE,
    overscan: 3,
    measureElement: (el: Element) => {
      // Use getBoundingClientRect for sub-pixel accuracy
      return el.getBoundingClientRect().height;
    },
  });

  // --- Extracted hooks ---
  const { isAtBottom, handleScroll, scrollToBottom } = useAutoScroll({
    parentRef,
    virtualizer,
    turnCount: turnIds.length,
    isRunning,
  });

  const animationMap = useTurnAnimation(turnIds);

  // --- Keyboard navigation ---
  const scrollToIndex = useCallback((index: number) => {
    virtualizer.scrollToIndex(index, { align: "center", behavior: "smooth" });
  }, [virtualizer]);

  const { focusedIndex } = useKeyboardNavigation({ scrollToIndex });

  // Listen for scroll-to-turn custom events (from turn navigation feature)
  // Use a ref to avoid resubscribing the listener when turnIds array changes
  const turnIdsRef = useRef(turnIds);
  turnIdsRef.current = turnIds;

  useEffect(() => {
    const handler = (e: CustomEvent<{ turnId: TurnId }>) => {
      const index = turnIdsRef.current.indexOf(e.detail.turnId);
      if (index >= 0) {
        virtualizer.scrollToIndex(index, { align: "center", behavior: "smooth" });
      }
    };
    window.addEventListener("scroll-to-turn", handler as EventListener);
    return () => window.removeEventListener("scroll-to-turn", handler as EventListener);
  }, [virtualizer]);

  const setTurnRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      turnElementsRef.current.set(index, el);
    } else {
      turnElementsRef.current.delete(index);
    }
  }, []);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div className="flex-1 min-h-0 relative flex flex-col" data-testid="message-list">
      {/* Scroll container */}
      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto [scrollbar-gutter:stable]"
      >
        {turnIds.length === 0 ? (
          <div className="absolute inset-0">
            <EmptyState
              icon="comment-discussion"
              title="Start a conversation..."
              className="h-full"
            />
          </div>
        ) : (
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: "100%",
              position: "relative",
            }}
          >
            {virtualItems.map((virtualRow) => {
              const turnId = turnIds[virtualRow.index];
              if (turnId === undefined) return null;
              return (
                <div
                  key={turnId}
                  ref={(el) => {
                    // Let the virtualizer measure the element
                    if (el) {
                      virtualizer.measureElement(el);
                    }
                    // Keep turnElementsRef in sync for external access
                    setTurnRef(virtualRow.index, el);
                  }}
                  data-index={virtualRow.index}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <ErrorBoundary
                    fallback={(err) => (
                      <InlineBanner variant="error">
                        Turn failed to render: {err.message}
                      </InlineBanner>
                    )}
                  >
                    <TurnContainer
                      turnId={turnId}
                      focused={virtualRow.index === focusedIndex}
                      isLast={virtualRow.index === turnIds.length - 1}
                      animationStyle={animationMap.get(turnId)}
                    />
                  </ErrorBoundary>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating scroll-to-bottom button */}
      {turnIds.length > 0 && (
        <ScrollToBottomButton
          isAtBottom={isAtBottom}
          isRunning={isRunning}
          onClick={scrollToBottom}
        />
      )}
    </div>
  );
});
