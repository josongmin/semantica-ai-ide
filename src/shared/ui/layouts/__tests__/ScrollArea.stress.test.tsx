/**
 * ScrollArea Stress & Edge-Case Tests
 *
 * Tests:
 * - onAtBottomChange callback invocation on scroll position changes
 * - Threshold edge cases (exactly at, just below, just above)
 * - Rapid scroll events (100+ in burst)
 * - Scroll event listener cleanup on unmount
 * - forwardRef merging with callback refs
 * - data-at-bottom attribute correctness
 */
import { createRef } from "react";
import { fireEvent, render } from "@testing-library/react";

import { ScrollArea } from "../ScrollArea";

/**
 * Helper: create a ScrollArea with scrollable content and mock scroll geometry.
 * happy-dom doesn't support real scroll, so we override properties manually.
 */
function setupScrollable(props: {
  onAtBottomChange?: (atBottom: boolean) => void;
  threshold?: number;
}) {
  const result = render(
    <ScrollArea onAtBottomChange={props.onAtBottomChange} threshold={props.threshold}>
      <div style={{ height: "2000px" }}>Tall content</div>
    </ScrollArea>,
  );

  const scrollContainer = result.container.firstElementChild as HTMLDivElement;

  // Simulate scroll geometry
  function setScrollPosition(scrollTop: number, scrollHeight: number, clientHeight: number) {
    Object.defineProperty(scrollContainer, "scrollTop", { value: scrollTop, configurable: true });
    Object.defineProperty(scrollContainer, "scrollHeight", {
      value: scrollHeight,
      configurable: true,
    });
    Object.defineProperty(scrollContainer, "clientHeight", {
      value: clientHeight,
      configurable: true,
    });
    fireEvent.scroll(scrollContainer);
  }

  return { ...result, scrollContainer, setScrollPosition };
}

describe("ScrollArea – stress & edge cases", () => {
  // ── onAtBottomChange callback ───────────────────────────
  describe("onAtBottomChange callback", () => {
    it("fires when scrolling away from bottom (atBottom → notAtBottom)", () => {
      const onAtBottomChange = vi.fn();
      const { setScrollPosition } = setupScrollable({ onAtBottomChange, threshold: 50 });

      // Start at bottom: distance = 2000 - 1950 - 50 = 0 < 50 → atBottom=true (no change from default)
      setScrollPosition(1950, 2000, 50);
      // State starts as true (default), scrolling to bottom doesn't change it
      expect(onAtBottomChange).not.toHaveBeenCalled();

      // Scroll far up: distance = 2000 - 0 - 50 = 1950 > 50 → atBottom=false
      setScrollPosition(0, 2000, 50);
      expect(onAtBottomChange).toHaveBeenCalledWith(false);
    });

    it("fires when scrolling back to bottom (notAtBottom → atBottom)", () => {
      const onAtBottomChange = vi.fn();
      const { setScrollPosition } = setupScrollable({ onAtBottomChange, threshold: 50 });

      // Scroll to top first
      setScrollPosition(0, 2000, 50);
      expect(onAtBottomChange).toHaveBeenCalledWith(false);

      // Scroll back to bottom
      setScrollPosition(1950, 2000, 50);
      expect(onAtBottomChange).toHaveBeenCalledWith(true);
    });

    it("does NOT fire when scroll stays in same zone (within bottom)", () => {
      const onAtBottomChange = vi.fn();
      const { setScrollPosition } = setupScrollable({ onAtBottomChange, threshold: 50 });

      // Multiple scrolls, all at bottom (distance < 50)
      setScrollPosition(1960, 2000, 50);
      setScrollPosition(1970, 2000, 50);
      setScrollPosition(1950, 2000, 50);

      // No transition happened, all within "at bottom"
      expect(onAtBottomChange).not.toHaveBeenCalled();
    });

    it("does NOT fire when scroll stays in same zone (away from bottom)", () => {
      const onAtBottomChange = vi.fn();
      const { setScrollPosition } = setupScrollable({ onAtBottomChange, threshold: 50 });

      // First: go away from bottom
      setScrollPosition(0, 2000, 50);
      expect(onAtBottomChange).toHaveBeenCalledTimes(1);
      onAtBottomChange.mockClear();

      // Multiple scrolls, all away from bottom
      setScrollPosition(100, 2000, 50);
      setScrollPosition(500, 2000, 50);
      setScrollPosition(200, 2000, 50);

      expect(onAtBottomChange).not.toHaveBeenCalled();
    });
  });

  // ── Threshold edge cases ────────────────────────────────
  describe("threshold edge cases", () => {
    it("exactly at threshold boundary: distance === threshold → NOT at bottom", () => {
      const onAtBottomChange = vi.fn();
      const { setScrollPosition } = setupScrollable({ onAtBottomChange, threshold: 50 });

      // distance = scrollHeight - scrollTop - clientHeight = 2000 - 1900 - 50 = 50
      // 50 < 50 is false → atBottom=false
      setScrollPosition(1900, 2000, 50);
      expect(onAtBottomChange).toHaveBeenCalledWith(false);
    });

    it("one pixel inside threshold: distance === threshold-1 → at bottom", () => {
      const onAtBottomChange = vi.fn();
      const { setScrollPosition } = setupScrollable({ onAtBottomChange, threshold: 50 });

      // First go away
      setScrollPosition(0, 2000, 50);
      onAtBottomChange.mockClear();

      // distance = 2000 - 1901 - 50 = 49 < 50 → atBottom=true
      setScrollPosition(1901, 2000, 50);
      expect(onAtBottomChange).toHaveBeenCalledWith(true);
    });

    it("threshold=0: only exact bottom triggers atBottom", () => {
      const onAtBottomChange = vi.fn();
      const { setScrollPosition } = setupScrollable({ onAtBottomChange, threshold: 0 });

      // Not quite at bottom: distance = 2000 - 1949 - 50 = 1
      setScrollPosition(1949, 2000, 50);
      expect(onAtBottomChange).toHaveBeenCalledWith(false);
    });

    it("very large threshold: always at bottom unless very far", () => {
      const onAtBottomChange = vi.fn();
      const { setScrollPosition } = setupScrollable({ onAtBottomChange, threshold: 5000 });

      // distance = 2000 - 0 - 50 = 1950 < 5000 → atBottom=true (no change)
      setScrollPosition(0, 2000, 50);
      expect(onAtBottomChange).not.toHaveBeenCalled();
    });
  });

  // ── Rapid scroll event burst ────────────────────────────
  describe("rapid scroll events", () => {
    it("100 rapid scroll events: callback fires only on transitions", () => {
      const onAtBottomChange = vi.fn();
      const { scrollContainer } = setupScrollable({ onAtBottomChange, threshold: 50 });

      // 100 rapid events, all at top
      for (let i = 0; i < 100; i++) {
        Object.defineProperty(scrollContainer, "scrollTop", { value: i, configurable: true });
        Object.defineProperty(scrollContainer, "scrollHeight", {
          value: 2000,
          configurable: true,
        });
        Object.defineProperty(scrollContainer, "clientHeight", {
          value: 50,
          configurable: true,
        });
        fireEvent.scroll(scrollContainer);
      }

      // Only one transition: initial true → false (on first scroll away from bottom)
      expect(onAtBottomChange).toHaveBeenCalledTimes(1);
      expect(onAtBottomChange).toHaveBeenCalledWith(false);
    });

    it("100 oscillating scrolls (top↔bottom): correct transition count", () => {
      const onAtBottomChange = vi.fn();
      const { setScrollPosition } = setupScrollable({ onAtBottomChange, threshold: 50 });

      for (let i = 0; i < 100; i++) {
        if (i % 2 === 0) {
          setScrollPosition(0, 2000, 50); // away from bottom
        } else {
          setScrollPosition(1960, 2000, 50); // at bottom
        }
      }

      // Each oscillation triggers a transition
      // Start=atBottom(true), even=false, odd=true: 100 transitions
      expect(onAtBottomChange).toHaveBeenCalledTimes(100);
    });
  });

  // ── data-at-bottom attribute ────────────────────────────
  describe("data-at-bottom attribute", () => {
    it("starts with data-at-bottom=true (default)", () => {
      const { scrollContainer } = setupScrollable({});
      expect(scrollContainer).toHaveAttribute("data-at-bottom", "true");
    });

    it("updates to false when scrolled away from bottom", () => {
      const { scrollContainer, setScrollPosition } = setupScrollable({});
      setScrollPosition(0, 2000, 50);
      expect(scrollContainer).toHaveAttribute("data-at-bottom", "false");
    });

    it("returns to true when scrolled back to bottom", () => {
      const { scrollContainer, setScrollPosition } = setupScrollable({});
      setScrollPosition(0, 2000, 50);
      setScrollPosition(1960, 2000, 50);
      expect(scrollContainer).toHaveAttribute("data-at-bottom", "true");
    });
  });

  // ── Cleanup on unmount ──────────────────────────────────
  describe("cleanup on unmount", () => {
    it("removes scroll listener on unmount: no callback after unmount", () => {
      const onAtBottomChange = vi.fn();
      const { scrollContainer, unmount } = setupScrollable({ onAtBottomChange });

      unmount();

      // Scroll events after unmount should not fire callback
      // (element still exists in memory but listener removed)
      Object.defineProperty(scrollContainer, "scrollTop", { value: 0, configurable: true });
      Object.defineProperty(scrollContainer, "scrollHeight", {
        value: 2000,
        configurable: true,
      });
      Object.defineProperty(scrollContainer, "clientHeight", { value: 50, configurable: true });
      fireEvent.scroll(scrollContainer);

      expect(onAtBottomChange).not.toHaveBeenCalled();
    });
  });

  // ── forwardRef merging ──────────────────────────────────
  describe("forwardRef merging", () => {
    it("object ref receives the scroll container element", () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <ScrollArea ref={ref}>
          <div>content</div>
        </ScrollArea>,
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveClass("overflow-y-auto");
    });

    it("callback ref receives the scroll container element", () => {
      let refNode: HTMLDivElement | null = null;
      render(
        <ScrollArea ref={(node) => (refNode = node)}>
          <div>content</div>
        </ScrollArea>,
      );
      expect(refNode).toBeInstanceOf(HTMLDivElement);
      expect(refNode).toHaveClass("overflow-y-auto");
    });

    it("ref and onAtBottomChange work together", () => {
      const ref = createRef<HTMLDivElement>();
      const onAtBottomChange = vi.fn();

      render(
        <ScrollArea ref={ref} onAtBottomChange={onAtBottomChange} threshold={50}>
          <div style={{ height: "2000px" }}>content</div>
        </ScrollArea>,
      );

      const el = ref.current!;
      Object.defineProperty(el, "scrollTop", { value: 0, configurable: true });
      Object.defineProperty(el, "scrollHeight", { value: 2000, configurable: true });
      Object.defineProperty(el, "clientHeight", { value: 50, configurable: true });
      fireEvent.scroll(el);

      expect(onAtBottomChange).toHaveBeenCalledWith(false);
    });
  });

  // ── No callback provided ────────────────────────────────
  describe("no callback provided", () => {
    it("works without onAtBottomChange (no crash)", () => {
      const { scrollContainer } = setupScrollable({});

      // Scroll without callback — should not throw
      Object.defineProperty(scrollContainer, "scrollTop", { value: 0, configurable: true });
      Object.defineProperty(scrollContainer, "scrollHeight", {
        value: 2000,
        configurable: true,
      });
      Object.defineProperty(scrollContainer, "clientHeight", { value: 50, configurable: true });

      expect(() => fireEvent.scroll(scrollContainer)).not.toThrow();
    });
  });
});
