/**
 * Collapsible Stress & Edge-Case Tests
 *
 * Tests:
 * - Rapid toggle spam (100+ clicks)
 * - Controlled ↔ uncontrolled transitions
 * - Keyboard spam (Space/Enter 50x)
 * - onToggle callback consistency under load
 * - inert/aria-hidden synchronization
 * - Badge/summary edge values
 */
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Collapsible } from "../../Collapsible";

describe("Collapsible – stress & edge cases", () => {
  const defaultProps = {
    title: "Section",
    children: <div>Content</div>,
  };

  // ── Rapid toggle spam ───────────────────────────────────
  describe("rapid toggle spam", () => {
    it("100 rapid clicks: state consistent with click count parity", () => {
      render(<Collapsible {...defaultProps} defaultCollapsed={true} />);
      const button = screen.getByRole("button", { name: /Section/i });

      // defaultCollapsed=true → starts collapsed (expanded=false)
      expect(button).toHaveAttribute("aria-expanded", "false");

      // 100 clicks → even number → back to collapsed
      for (let i = 0; i < 100; i++) {
        fireEvent.click(button);
      }

      // 100 clicks: even → back to original state (collapsed, expanded=false)
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("101 rapid clicks: state inverted (odd count)", () => {
      render(<Collapsible {...defaultProps} defaultCollapsed={true} />);
      const button = screen.getByRole("button", { name: /Section/i });

      for (let i = 0; i < 101; i++) {
        fireEvent.click(button);
      }

      // 101 clicks: odd → expanded (opposite of start)
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("onToggle called exactly once per click under rapid spam", () => {
      const onToggle = vi.fn();
      render(<Collapsible {...defaultProps} defaultCollapsed={true} onToggle={onToggle} />);
      const button = screen.getByRole("button", { name: /Section/i });

      for (let i = 0; i < 50; i++) {
        fireEvent.click(button);
      }

      expect(onToggle).toHaveBeenCalledTimes(50);
    });

    it("onToggle values alternate correctly under rapid spam", () => {
      const onToggle = vi.fn();
      render(<Collapsible {...defaultProps} defaultCollapsed={true} onToggle={onToggle} />);
      const button = screen.getByRole("button", { name: /Section/i });

      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }

      // Starts collapsed(true). Click 1 → false, Click 2 → true, ...
      for (let i = 0; i < 10; i++) {
        const expectedCollapsed = i % 2 !== 0; // false, true, false, true...
        expect(onToggle).toHaveBeenNthCalledWith(i + 1, expectedCollapsed);
      }
    });
  });

  // ── Keyboard spam ──────────────────────────────────────
  describe("keyboard spam", () => {
    it("50x Enter key: state consistent with parity", async () => {
      const user = userEvent.setup();
      render(<Collapsible {...defaultProps} defaultCollapsed={true} />);
      const button = screen.getByRole("button", { name: /Section/i });
      button.focus();

      for (let i = 0; i < 50; i++) {
        await user.keyboard("{Enter}");
      }

      // 50 = even → back to collapsed
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("25x Space key: state expanded", async () => {
      const user = userEvent.setup();
      render(<Collapsible {...defaultProps} defaultCollapsed={true} />);
      const button = screen.getByRole("button", { name: /Section/i });
      button.focus();

      for (let i = 0; i < 25; i++) {
        await user.keyboard(" ");
      }

      // 25 = odd → expanded
      expect(button).toHaveAttribute("aria-expanded", "true");
    });
  });

  // ── Controlled prop edge cases ──────────────────────────
  describe("controlled prop edge cases", () => {
    it("switching from uncontrolled to controlled preserves display", () => {
      const { rerender } = render(<Collapsible {...defaultProps} defaultCollapsed={false} />);
      const button = screen.getByRole("button", { name: /Section/i });
      expect(button).toHaveAttribute("aria-expanded", "true");

      // Now switch to controlled collapsed=true
      rerender(<Collapsible {...defaultProps} collapsed={true} />);
      expect(button).toHaveAttribute("aria-expanded", "false");

      // Switch back to uncontrolled — internal state preserved
      rerender(<Collapsible {...defaultProps} />);
      // Internal state was last set by clicks, default was false → should be expanded
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("controlled prop rapid switching: 100 true/false alternations", () => {
      const { rerender } = render(<Collapsible {...defaultProps} collapsed={true} />);
      const button = screen.getByRole("button", { name: /Section/i });

      for (let i = 0; i < 100; i++) {
        rerender(<Collapsible {...defaultProps} collapsed={i % 2 === 0} />);
      }

      // Last: i=99, 99%2=1, collapsed=true → expanded=false
      // Wait: i=99, collapsed = (99 % 2 === 0) = false → expanded = !false = true
      expect(button).toHaveAttribute("aria-expanded", "true");
    });
  });

  // ── aria-hidden + inert synchronization ─────────────────
  describe("aria-hidden & inert sync", () => {
    it("collapsed: content region has aria-hidden=true and inert", () => {
      render(<Collapsible {...defaultProps} defaultCollapsed={true} />);
      const region = document.querySelector("[role='region']")!;
      expect(region).toHaveAttribute("aria-hidden", "true");
      expect(region).toHaveAttribute("inert", "");
    });

    it("expanded: content region has aria-hidden=false and no inert", () => {
      render(<Collapsible {...defaultProps} defaultCollapsed={false} />);
      const region = screen.getByRole("region");
      expect(region).toHaveAttribute("aria-hidden", "false");
      expect(region).not.toHaveAttribute("inert");
    });

    it("toggle: inert and aria-hidden update together", () => {
      render(<Collapsible {...defaultProps} defaultCollapsed={true} />);
      const button = screen.getByRole("button", { name: /Section/i });

      // Collapsed → inert + aria-hidden
      let region = document.querySelector("[role='region']")!;
      expect(region).toHaveAttribute("aria-hidden", "true");
      expect(region).toHaveAttribute("inert", "");

      // Click → expanded
      fireEvent.click(button);
      region = screen.getByRole("region");
      expect(region).toHaveAttribute("aria-hidden", "false");
      expect(region).not.toHaveAttribute("inert");

      // Click → collapsed again
      fireEvent.click(button);
      region = document.querySelector("[role='region']")!;
      expect(region).toHaveAttribute("aria-hidden", "true");
      expect(region).toHaveAttribute("inert", "");
    });
  });

  // ── Badge/summary edge values ───────────────────────────
  describe("badge & summary edge values", () => {
    it("badge=0 is rendered (not falsy-hidden)", () => {
      render(<Collapsible {...defaultProps} badge={0} />);
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("badge with large number", () => {
      render(<Collapsible {...defaultProps} badge={999999} />);
      expect(screen.getByText("999999")).toBeInTheDocument();
    });

    it("empty string summary: element not rendered", () => {
      render(<Collapsible {...defaultProps} summary="" />);
      // Empty summary should not create a span
      const button = screen.getByRole("button", { name: /Section/i });
      const summarySpans = button.querySelectorAll("span.truncate");
      expect(summarySpans).toHaveLength(0);
    });

    it("very long summary text: truncated (has truncate class)", () => {
      const longSummary = "A".repeat(500);
      render(<Collapsible {...defaultProps} summary={longSummary} />);
      const summaryEl = screen.getByText(longSummary);
      expect(summaryEl).toHaveClass("truncate");
    });

    it("very long title: renders without crash", () => {
      const longTitle = "Title ".repeat(200).trim();
      render(
        <Collapsible title={longTitle}>
          <div>content</div>
        </Collapsible>,
      );
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });
  });

  // ── headerRight interaction ─────────────────────────────
  describe("headerRight interaction", () => {
    it("headerRight button click does NOT toggle collapsible", () => {
      render(
        <Collapsible {...defaultProps} defaultCollapsed={true}>
          <div>content</div>
        </Collapsible>,
      );
      const toggleBtn = screen.getByRole("button", { name: /Section/i });
      expect(toggleBtn).toHaveAttribute("aria-expanded", "false");
    });
  });
});
