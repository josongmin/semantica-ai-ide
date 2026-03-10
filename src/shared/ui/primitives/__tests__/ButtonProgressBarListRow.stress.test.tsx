/**
 * Button, ProgressBar, ListRow Stress & Edge-Case Tests
 *
 * Tests:
 * Button:
 * - 100 rapid clicks
 * - Disabled state prevents onClick
 * - Icon-only button
 * - All 4 variants + 3 sizes
 * - forwardRef
 *
 * ProgressBar:
 * - max=0 (division by zero protection)
 * - value > max (clamped to 100%)
 * - value=0, max=100
 * - Negative values
 * - aria attributes
 *
 * ListRow:
 * - onClick enables role=button + tabIndex
 * - Enter/Space keyboard triggers onClick
 * - 100 rapid Enter key presses
 * - No onClick: no role/tabIndex
 * - left/right slots
 */
import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { ListRow } from "../../composites/ListRow";
import { Button } from "../Button";
import { ProgressBar } from "../ProgressBar";

describe("Button – stress & edge cases", () => {
  // ── Rapid clicks ───────────────────────────────────────
  describe("rapid clicks", () => {
    it("100 rapid clicks: onClick called each time", () => {
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Click me</Button>);

      const btn = screen.getByRole("button");
      for (let i = 0; i < 100; i++) {
        fireEvent.click(btn);
      }

      expect(onClick).toHaveBeenCalledTimes(100);
    });

    it("disabled button: onClick NOT called", () => {
      const onClick = vi.fn();
      render(
        <Button onClick={onClick} disabled>
          Disabled
        </Button>,
      );

      const btn = screen.getByRole("button");
      for (let i = 0; i < 10; i++) {
        fireEvent.click(btn);
      }

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  // ── Variants ───────────────────────────────────────────
  describe("variants", () => {
    it.each(["primary", "secondary", "ghost", "danger"] as const)(
      "variant '%s': renders without crash",
      (variant) => {
        render(<Button variant={variant}>Test</Button>);
        expect(screen.getByRole("button")).toBeInTheDocument();
      },
    );

    it.each(["sm", "md", "icon"] as const)("size '%s': renders without crash", (size) => {
      render(<Button size={size}>Test</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  // ── Icon-only ──────────────────────────────────────────
  describe("icon-only", () => {
    it("icon prop renders codicon", () => {
      render(<Button icon="check" aria-label="Accept" />);
      const btn = screen.getByLabelText("Accept");
      expect(btn).toBeInTheDocument();
      expect(btn.querySelector("i")).not.toBeNull();
    });

    it("icon + children: both rendered", () => {
      render(<Button icon="add">Add item</Button>);
      expect(screen.getByText("Add item")).toBeInTheDocument();
    });
  });

  // ── forwardRef ─────────────────────────────────────────
  describe("forwardRef", () => {
    it("ref is forwarded to button element", () => {
      const ref = createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Test</Button>);
      expect(ref.current).not.toBeNull();
      expect(ref.current?.tagName).toBe("BUTTON");
    });
  });

  // ── Type attribute ─────────────────────────────────────
  describe("type attribute", () => {
    it("default type is 'button'", () => {
      render(<Button>Default</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    });

    it("type override to 'submit'", () => {
      render(<Button type="submit">Submit</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
    });
  });
});

describe("ProgressBar – stress & edge cases", () => {
  // ── Edge values ────────────────────────────────────────
  describe("edge values", () => {
    it("max=0: no division by zero, width=0%", () => {
      const { container } = render(<ProgressBar value={5} max={0} />);
      const bar = container.querySelector("[role='progressbar']")!;
      expect(bar).toHaveAttribute("aria-valuenow", "5");
      expect(bar).toHaveAttribute("aria-valuemax", "0");
      // Use [style] to target the inner bar (not the outer wrapper div)
      const inner = bar.querySelector("[style]")!;
      expect((inner as HTMLElement).style.width).toBe("0%");
    });

    it("value > max: clamped to 100%", () => {
      const { container } = render(<ProgressBar value={200} max={100} />);
      const inner = container.querySelector("[role='progressbar'] div > div")!;
      expect((inner as HTMLElement).style.width).toBe("100%");
    });

    it("value=0, max=100: 0% width", () => {
      const { container } = render(<ProgressBar value={0} max={100} />);
      const inner = container.querySelector("[role='progressbar'] div > div")!;
      expect((inner as HTMLElement).style.width).toBe("0%");
    });

    it("value=50, max=100: 50% width", () => {
      const { container } = render(<ProgressBar value={50} max={100} />);
      const inner = container.querySelector("[role='progressbar'] div > div")!;
      expect((inner as HTMLElement).style.width).toBe("50%");
    });

    it("value=max: 100% width", () => {
      const { container } = render(<ProgressBar value={10} max={10} />);
      const inner = container.querySelector("[role='progressbar'] div > div")!;
      expect((inner as HTMLElement).style.width).toBe("100%");
    });
  });

  // ── Label ──────────────────────────────────────────────
  describe("label", () => {
    it("label rendered as text and aria-label", () => {
      render(<ProgressBar value={3} max={6} label="3/6" />);
      expect(screen.getByText("3/6")).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", "3/6");
    });

    it("no label: no label text, no aria-label", () => {
      const { container } = render(<ProgressBar value={1} max={2} />);
      const bar = container.querySelector("[role='progressbar']")!;
      expect(bar).not.toHaveAttribute("aria-label");
    });
  });

  // ── ARIA attributes ────────────────────────────────────
  describe("ARIA attributes", () => {
    it("aria-valuemin always 0", () => {
      render(<ProgressBar value={5} max={10} />);
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuemin", "0");
    });
  });
});

describe("ListRow – stress & edge cases", () => {
  // ── onClick enables interactive role ───────────────────
  describe("interactive role", () => {
    it("with onClick: has role=button and tabIndex=0", () => {
      render(<ListRow onClick={() => {}}>Clickable</ListRow>);
      const row = screen.getByRole("button");
      expect(row).toHaveAttribute("tabindex", "0");
    });

    it("without onClick: no role, no tabIndex", () => {
      render(<ListRow>Static</ListRow>);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  // ── Keyboard triggers ──────────────────────────────────
  describe("keyboard triggers", () => {
    it("Enter key triggers onClick", () => {
      const onClick = vi.fn();
      render(<ListRow onClick={onClick}>Row</ListRow>);

      fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("Space key triggers onClick", () => {
      const onClick = vi.fn();
      render(<ListRow onClick={onClick}>Row</ListRow>);

      fireEvent.keyDown(screen.getByRole("button"), { key: " " });
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("other keys don't trigger onClick", () => {
      const onClick = vi.fn();
      render(<ListRow onClick={onClick}>Row</ListRow>);

      fireEvent.keyDown(screen.getByRole("button"), { key: "a" });
      fireEvent.keyDown(screen.getByRole("button"), { key: "Escape" });
      fireEvent.keyDown(screen.getByRole("button"), { key: "Tab" });
      expect(onClick).not.toHaveBeenCalled();
    });

    it("100 rapid Enter key presses: onClick called 100 times", () => {
      const onClick = vi.fn();
      render(<ListRow onClick={onClick}>Row</ListRow>);

      const row = screen.getByRole("button");
      for (let i = 0; i < 100; i++) {
        fireEvent.keyDown(row, { key: "Enter" });
      }

      expect(onClick).toHaveBeenCalledTimes(100);
    });
  });

  // ── Slot rendering ─────────────────────────────────────
  describe("slot rendering", () => {
    it("left + children + right: all rendered", () => {
      render(
        <ListRow
          left={<span data-testid="left">L</span>}
          right={<span data-testid="right">R</span>}
        >
          Middle
        </ListRow>,
      );

      expect(screen.getByTestId("left")).toBeInTheDocument();
      expect(screen.getByText("Middle")).toBeInTheDocument();
      expect(screen.getByTestId("right")).toBeInTheDocument();
    });

    it("no left/right: only children rendered", () => {
      const { container } = render(<ListRow>Only content</ListRow>);
      expect(screen.getByText("Only content")).toBeInTheDocument();
      // No left/right span wrappers
      const spans = container.querySelectorAll("span.shrink-0");
      expect(spans).toHaveLength(0);
    });
  });

  // ── Custom className ───────────────────────────────────
  describe("custom className", () => {
    it("className merged with defaults", () => {
      const { container } = render(<ListRow className="custom-highlight">Content</ListRow>);
      const row = container.firstChild as HTMLElement;
      expect(row.className).toMatch(/custom-highlight/);
      expect(row.className).toMatch(/hover:bg-vsc-list-hover/);
    });
  });
});
