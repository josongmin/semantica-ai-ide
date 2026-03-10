import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ToolbarButton } from "../primitives/ToolbarButton";

describe("ToolbarButton", () => {
  it("renders children text", () => {
    render(<ToolbarButton>Click me</ToolbarButton>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("renders as a button element", () => {
    render(<ToolbarButton>Button</ToolbarButton>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("has type='button' by default", () => {
    render(<ToolbarButton>Button</ToolbarButton>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("applies default inactive styles (text-vsc-text-ghost)", () => {
    render(<ToolbarButton>Inactive</ToolbarButton>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("text-vsc-text-ghost");
    expect(btn.className).not.toContain("bg-vsc-surface-2");
  });

  it("applies active styles when active={true}", () => {
    render(<ToolbarButton active>Active</ToolbarButton>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-vsc-surface-2");
    expect(btn.className).toContain("text-vsc-fg");
    expect(btn.className).toContain("font-medium");
  });

  it("passes through className prop", () => {
    render(<ToolbarButton className="custom-class">Styled</ToolbarButton>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("custom-class");
  });

  it("passes through onClick handler", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ToolbarButton onClick={onClick}>Clickable</ToolbarButton>);

    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
