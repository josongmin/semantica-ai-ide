import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Collapsible } from "../Collapsible";

describe("Collapsible", () => {
  const defaultProps = {
    title: "Section Title",
    children: <div>Section content</div>,
  };

  describe("default behavior", () => {
    it("content is hidden by default (defaultCollapsed=true)", () => {
      render(<Collapsible {...defaultProps} />);
      const button = screen.getByRole("button", { name: /Section Title/i });
      // defaultCollapsed is true by default, so aria-expanded should be false
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("content is visible when defaultCollapsed={false}", () => {
      render(<Collapsible {...defaultProps} defaultCollapsed={false} />);
      const button = screen.getByRole("button", { name: /Section Title/i });
      expect(button).toHaveAttribute("aria-expanded", "true");
    });
  });

  describe("toggle behavior", () => {
    it("click header toggles content visibility", async () => {
      const user = userEvent.setup();
      render(<Collapsible {...defaultProps} defaultCollapsed={true} />);

      const button = screen.getByRole("button", { name: /Section Title/i });
      expect(button).toHaveAttribute("aria-expanded", "false");

      await user.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");

      await user.click(button);
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("aria-expanded toggles on click", async () => {
      const user = userEvent.setup();
      render(<Collapsible {...defaultProps} defaultCollapsed={false} />);

      const button = screen.getByRole("button", { name: /Section Title/i });
      expect(button).toHaveAttribute("aria-expanded", "true");

      await user.click(button);
      expect(button).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("aria-controls", () => {
    it("aria-controls on button matches content region id", () => {
      render(<Collapsible {...defaultProps} defaultCollapsed={false} />);

      const button = screen.getByRole("button", { name: /Section Title/i });
      const controlsId = button.getAttribute("aria-controls");
      expect(controlsId).toEqual(expect.any(String));

      const region = screen.getByRole("region");
      expect(region).toHaveAttribute("id", controlsId);
    });
  });

  describe("controlled collapsed prop", () => {
    it("uses controlled collapsed prop when provided", () => {
      const { rerender } = render(<Collapsible {...defaultProps} collapsed={false} />);
      const button = screen.getByRole("button", { name: /Section Title/i });
      expect(button).toHaveAttribute("aria-expanded", "true");

      rerender(<Collapsible {...defaultProps} collapsed={true} />);
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("controlled prop overrides internal state", async () => {
      const user = userEvent.setup();
      render(<Collapsible {...defaultProps} collapsed={true} />);

      const button = screen.getByRole("button", { name: /Section Title/i });
      // Even after clicking, controlled prop keeps it collapsed
      // (internal state changes but controlled prop wins)
      expect(button).toHaveAttribute("aria-expanded", "false");

      await user.click(button);
      // Still false because controlled prop is true (collapsed)
      expect(button).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("onToggle callback", () => {
    it("fires when header is clicked", async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();

      render(<Collapsible {...defaultProps} defaultCollapsed={true} onToggle={onToggle} />);

      await user.click(screen.getByRole("button", { name: /Section Title/i }));
      expect(onToggle).toHaveBeenCalledTimes(1);
      // Collapsed was true, toggled to false, so onToggle receives false (next collapsed state)
      expect(onToggle).toHaveBeenCalledWith(false);
    });

    it("fires with correct value on subsequent toggles", async () => {
      const user = userEvent.setup();
      const onToggle = vi.fn();

      render(<Collapsible {...defaultProps} defaultCollapsed={true} onToggle={onToggle} />);

      const button = screen.getByRole("button", { name: /Section Title/i });

      await user.click(button); // collapsed -> expanded
      expect(onToggle).toHaveBeenLastCalledWith(false);

      await user.click(button); // expanded -> collapsed
      expect(onToggle).toHaveBeenLastCalledWith(true);
    });
  });

  describe("keyboard interaction", () => {
    it("Enter key toggles content", async () => {
      const user = userEvent.setup();
      render(<Collapsible {...defaultProps} defaultCollapsed={true} />);

      const button = screen.getByRole("button", { name: /Section Title/i });
      button.focus();
      await user.keyboard("{Enter}");
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("Space key toggles content", async () => {
      const user = userEvent.setup();
      render(<Collapsible {...defaultProps} defaultCollapsed={true} />);

      const button = screen.getByRole("button", { name: /Section Title/i });
      button.focus();
      await user.keyboard(" ");
      expect(button).toHaveAttribute("aria-expanded", "true");
    });
  });

  it("renders title text", () => {
    render(<Collapsible {...defaultProps} />);
    expect(screen.getByText("Section Title")).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(<Collapsible {...defaultProps} defaultCollapsed={false} />);
    expect(screen.getByText("Section content")).toBeInTheDocument();
  });

  it("renders summary text when provided", () => {
    render(<Collapsible {...defaultProps} summary="3 items" />);
    expect(screen.getByText("3 items")).toBeInTheDocument();
  });

  it("renders badge when provided", () => {
    render(<Collapsible {...defaultProps} badge={5} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders headerRight content", () => {
    render(<Collapsible {...defaultProps} headerRight={<button type="button">Action</button>} />);
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
  });
});
