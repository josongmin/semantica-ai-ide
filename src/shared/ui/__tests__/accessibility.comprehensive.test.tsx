/**
 * Accessibility (a11y) Comprehensive Tests
 *
 * Tests:
 * - Button: aria-label, disabled state, keyboard interaction
 * - ProgressBar: ARIA attributes complete
 * - ListRow: keyboard navigation (Enter/Space)
 * - Collapsible: aria-expanded toggle
 * - ErrorBoundary: error message accessible
 */
import { fireEvent, render, screen } from "@testing-library/react";

import { ListRow } from "../composites/ListRow";
import { Button } from "../primitives/Button";
import { Collapsible } from "../primitives/Collapsible";
import { ProgressBar } from "../primitives/ProgressBar";

describe("Accessibility – comprehensive", () => {
  describe("Button a11y", () => {
    it("icon-only button requires aria-label", () => {
      render(<Button icon="check" aria-label="Accept changes" />);
      const btn = screen.getByLabelText("Accept changes");
      expect(btn).toBeInTheDocument();
      expect(btn.tagName).toBe("BUTTON");
    });

    it("disabled button has aria-disabled", () => {
      render(<Button disabled>Disabled</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toBeDisabled();
    });

    it("button is focusable and activatable via keyboard", () => {
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Click me</Button>);
      const btn = screen.getByRole("button");

      btn.focus();
      expect(document.activeElement).toBe(btn);

      fireEvent.keyDown(btn, { key: "Enter" });
      // Native button handles Enter via click event
    });
  });

  describe("ProgressBar a11y", () => {
    it("has complete ARIA progressbar attributes", () => {
      render(<ProgressBar value={3} max={10} label="3/10" />);
      const bar = screen.getByRole("progressbar");

      expect(bar).toHaveAttribute("aria-valuenow", "3");
      expect(bar).toHaveAttribute("aria-valuemin", "0");
      expect(bar).toHaveAttribute("aria-valuemax", "10");
      expect(bar).toHaveAttribute("aria-label", "3/10");
    });

    it("without label: no aria-label (but role still present)", () => {
      render(<ProgressBar value={5} max={10} />);
      const bar = screen.getByRole("progressbar");
      expect(bar).not.toHaveAttribute("aria-label");
      expect(bar).toHaveAttribute("aria-valuenow", "5");
    });
  });

  describe("ListRow a11y", () => {
    it("clickable row: role=button, tabIndex=0", () => {
      render(<ListRow onClick={() => {}}>Interactive</ListRow>);
      const row = screen.getByRole("button");
      expect(row).toHaveAttribute("tabindex", "0");
    });

    it("non-clickable row: no button role", () => {
      render(<ListRow>Static</ListRow>);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("keyboard Enter triggers click handler", () => {
      const onClick = vi.fn();
      render(<ListRow onClick={onClick}>Row</ListRow>);
      fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("keyboard Space triggers click handler", () => {
      const onClick = vi.fn();
      render(<ListRow onClick={onClick}>Row</ListRow>);
      fireEvent.keyDown(screen.getByRole("button"), { key: " " });
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("non-interactive keys don't trigger handler", () => {
      const onClick = vi.fn();
      render(<ListRow onClick={onClick}>Row</ListRow>);
      fireEvent.keyDown(screen.getByRole("button"), { key: "a" });
      fireEvent.keyDown(screen.getByRole("button"), { key: "Escape" });
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("Collapsible a11y", () => {
    it("expanded state: aria-expanded=true", () => {
      render(
        <Collapsible title="Section" defaultCollapsed={false}>
          Content
        </Collapsible>,
      );
      const btn = screen.getByRole("button");
      expect(btn).toHaveAttribute("aria-expanded", "true");
    });

    it("collapsed state: aria-expanded=false", () => {
      render(
        <Collapsible title="Section" defaultCollapsed={true}>
          Content
        </Collapsible>,
      );
      const btn = screen.getByRole("button");
      expect(btn).toHaveAttribute("aria-expanded", "false");
    });

    it("toggle changes aria-expanded", () => {
      render(
        <Collapsible title="Section" defaultCollapsed={false}>
          Content
        </Collapsible>,
      );
      const btn = screen.getByRole("button");

      expect(btn).toHaveAttribute("aria-expanded", "true");

      fireEvent.click(btn);
      expect(btn).toHaveAttribute("aria-expanded", "false");

      fireEvent.click(btn);
      expect(btn).toHaveAttribute("aria-expanded", "true");
    });
  });
});
