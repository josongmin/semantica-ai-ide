import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Button } from "../Button";

describe("Button", () => {
  it("renders as a button element with children", () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn.tagName).toBe("BUTTON");
    expect(btn).toHaveTextContent("Click me");
  });

  it('has type="button" by default', () => {
    render(<Button>Default type</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  describe("variant classes", () => {
    it("applies primary variant classes by default", () => {
      render(<Button>Primary</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("bg-vsc-button");
      expect(btn).toHaveClass("text-vsc-button-fg");
    });

    it("applies ghost variant classes", () => {
      render(<Button variant="ghost">Ghost</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("bg-transparent");
      expect(btn).toHaveClass("text-vsc-fg");
    });

    it("applies danger variant classes", () => {
      render(<Button variant="danger">Danger</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("text-vsc-error");
    });

    it("applies secondary variant classes", () => {
      render(<Button variant="secondary">Secondary</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("bg-vsc-button-secondary");
      expect(btn).toHaveClass("text-vsc-button-secondary-fg");
    });
  });

  describe("size classes", () => {
    it("applies sm size classes", () => {
      render(<Button size="sm">Small</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("px-2.5");
      expect(btn).toHaveClass("py-1.5");
      expect(btn).toHaveClass("text-xs");
    });

    it("applies md size classes (default)", () => {
      render(<Button>Medium</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("px-3");
      expect(btn).toHaveClass("text-sm");
    });

    it("applies icon size classes", () => {
      render(<Button size="icon">Icon</Button>);
      const btn = screen.getByRole("button");
      expect(btn).toHaveClass("p-1.5");
    });
  });

  it("renders icon prop via Icon component", () => {
    render(<Button icon="check">With Icon</Button>);
    const btn = screen.getByRole("button");
    const iconEl = btn.querySelector(".codicon.codicon-check");
    expect(iconEl).toBeInTheDocument();
  });

  describe("disabled state", () => {
    it("has disabled attribute when disabled prop is set", () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("has disabled styling classes in the variant base", () => {
      render(<Button disabled>Disabled</Button>);
      const btn = screen.getByRole("button");
      expect(btn.className).toContain("disabled:opacity-50");
    });
  });

  it("calls onClick handler when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Clickable</Button>);
    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onClick when disabled", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>,
    );
    await user.click(screen.getByRole("button"));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("merges external className", () => {
    render(<Button className="extra-class">Styled</Button>);
    expect(screen.getByRole("button")).toHaveClass("extra-class");
  });

  it("has common base classes (focus-ring, cursor-pointer)", () => {
    render(<Button>Base</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("focus-ring");
    expect(btn).toHaveClass("cursor-pointer");
    expect(btn.className).toContain("transition-");
  });
});
