/**
 * Tooltip Stress & Edge-Case Tests
 *
 * Tests:
 * - Rapid hover/unhover cycles (timer cleanup)
 * - Escape key dismissal (WCAG 1.4.13)
 * - Focus/blur triggers
 * - Timer cleanup on unmount (memory leak prevention)
 * - Empty content (no tooltip rendered)
 * - Delay=0 (immediate show)
 */
import { act, fireEvent, render, screen } from "@testing-library/react";

import { Tooltip } from "../../Tooltip";

describe("Tooltip – stress & edge cases", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderTooltip = (props: Partial<React.ComponentProps<typeof Tooltip>> = {}) => {
    return render(
      <Tooltip content="Tip text" {...props}>
        <button type="button">Target</button>
      </Tooltip>,
    );
  };

  // ── Rapid hover/unhover ─────────────────────────────────
  describe("rapid hover/unhover cycles", () => {
    it("50 rapid hover→unhover within delay: tooltip never appears", () => {
      renderTooltip({ delay: 400 });
      const wrapper = screen.getByText("Target").closest("span")!;

      for (let i = 0; i < 50; i++) {
        fireEvent.mouseEnter(wrapper);
        // Don't advance timer — immediately leave
        fireEvent.mouseLeave(wrapper);
      }

      // Advance past delay
      act(() => vi.advanceTimersByTime(500));
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("hover→unhover→hover: last hover wins after delay", () => {
      renderTooltip({ delay: 300 });
      const wrapper = screen.getByText("Target").closest("span")!;

      fireEvent.mouseEnter(wrapper);
      act(() => vi.advanceTimersByTime(100));
      fireEvent.mouseLeave(wrapper);

      // Re-enter
      fireEvent.mouseEnter(wrapper);
      act(() => vi.advanceTimersByTime(300));

      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    it("100 rapid cycles then settle on hover: tooltip appears after delay", () => {
      renderTooltip({ delay: 200 });
      const wrapper = screen.getByText("Target").closest("span")!;

      for (let i = 0; i < 100; i++) {
        fireEvent.mouseEnter(wrapper);
        fireEvent.mouseLeave(wrapper);
      }

      // Final hover — settle
      fireEvent.mouseEnter(wrapper);
      act(() => vi.advanceTimersByTime(200));

      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });
  });

  // ── Escape key dismissal ────────────────────────────────
  describe("escape key dismissal", () => {
    it("Escape hides visible tooltip", () => {
      renderTooltip({ delay: 100 });
      const wrapper = screen.getByText("Target").closest("span")!;

      fireEvent.mouseEnter(wrapper);
      act(() => vi.advanceTimersByTime(100));
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      // Press Escape — starts exit animation
      fireEvent.keyDown(document, { key: "Escape" });
      // Advance past exit animation timeout (120ms)
      act(() => vi.advanceTimersByTime(150));
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("Escape when tooltip not visible: no error", () => {
      renderTooltip();
      expect(() => {
        fireEvent.keyDown(document, { key: "Escape" });
      }).not.toThrow();
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    it("Escape removes keydown listener (no leak)", () => {
      renderTooltip({ delay: 100 });
      const wrapper = screen.getByText("Target").closest("span")!;

      // Show tooltip
      fireEvent.mouseEnter(wrapper);
      act(() => vi.advanceTimersByTime(100));
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      // Escape to hide — wait for exit animation
      fireEvent.keyDown(document, { key: "Escape" });
      act(() => vi.advanceTimersByTime(150));
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

      // Show again
      fireEvent.mouseEnter(wrapper);
      act(() => vi.advanceTimersByTime(100));
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      // Escape again — should still work
      fireEvent.keyDown(document, { key: "Escape" });
      act(() => vi.advanceTimersByTime(150));
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  // ── Focus/blur triggers ─────────────────────────────────
  describe("focus/blur triggers", () => {
    it("focus shows tooltip after delay", () => {
      renderTooltip({ delay: 200 });
      const wrapper = screen.getByText("Target").closest("span")!;

      fireEvent.focus(wrapper);
      act(() => vi.advanceTimersByTime(200));

      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    it("blur hides tooltip and cancels pending timer", () => {
      renderTooltip({ delay: 300 });
      const wrapper = screen.getByText("Target").closest("span")!;

      fireEvent.focus(wrapper);
      act(() => vi.advanceTimersByTime(100)); // Partial delay
      fireEvent.blur(wrapper);

      act(() => vi.advanceTimersByTime(300)); // Past original delay
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  // ── Timer cleanup on unmount ────────────────────────────
  describe("timer cleanup on unmount", () => {
    it("unmount during delay: no setState after unmount", () => {
      const { unmount } = renderTooltip({ delay: 500 });
      const wrapper = screen.getByText("Target").closest("span")!;

      fireEvent.mouseEnter(wrapper);
      // Unmount before delay fires
      unmount();

      // Advance — should not throw
      expect(() => act(() => vi.advanceTimersByTime(600))).not.toThrow();
    });

    it("unmount while tooltip visible: cleanup succeeds", () => {
      const { unmount } = renderTooltip({ delay: 100 });
      const wrapper = screen.getByText("Target").closest("span")!;

      fireEvent.mouseEnter(wrapper);
      act(() => vi.advanceTimersByTime(100));
      expect(screen.getByRole("tooltip")).toBeInTheDocument();

      expect(() => unmount()).not.toThrow();
    });
  });

  // ── Empty content ───────────────────────────────────────
  describe("empty content", () => {
    it("empty string content: tooltip never rendered", () => {
      renderTooltip({ content: "" });
      const wrapper = screen.getByText("Target").closest("span")!;

      fireEvent.mouseEnter(wrapper);
      act(() => vi.advanceTimersByTime(500));

      // Even after delay, no tooltip because content is empty
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  // ── Delay variations ────────────────────────────────────
  describe("delay variations", () => {
    it("delay=0: tooltip appears immediately on hover", () => {
      renderTooltip({ delay: 0 });
      const wrapper = screen.getByText("Target").closest("span")!;

      fireEvent.mouseEnter(wrapper);
      act(() => vi.advanceTimersByTime(0));

      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });

    it("very large delay (10s): tooltip only after full delay", () => {
      renderTooltip({ delay: 10000 });
      const wrapper = screen.getByText("Target").closest("span")!;

      fireEvent.mouseEnter(wrapper);
      act(() => vi.advanceTimersByTime(5000));
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

      act(() => vi.advanceTimersByTime(5000));
      expect(screen.getByRole("tooltip")).toBeInTheDocument();
    });
  });

  // ── aria-describedby lifecycle ──────────────────────────
  describe("aria-describedby lifecycle", () => {
    it("aria-describedby set when visible, removed when hidden", () => {
      renderTooltip({ delay: 100 });
      const wrapper = screen.getByText("Target").closest("span")!;

      expect(wrapper).not.toHaveAttribute("aria-describedby");

      fireEvent.mouseEnter(wrapper);
      act(() => vi.advanceTimersByTime(100));
      expect(wrapper).toHaveAttribute("aria-describedby");

      fireEvent.mouseLeave(wrapper);
      // Wait for exit animation to complete
      act(() => vi.advanceTimersByTime(150));
      expect(wrapper).not.toHaveAttribute("aria-describedby");
    });
  });
});
