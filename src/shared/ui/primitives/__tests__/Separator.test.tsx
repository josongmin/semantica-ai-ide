import { render } from "@testing-library/react";

import { Separator } from "../Separator";

describe("Separator", () => {
  it('renders a div with role="separator"', () => {
    const { container } = render(<Separator />);
    const el = container.querySelector('[role="separator"]');
    expect(el).toBeInTheDocument();
    expect(el?.tagName).toBe("DIV");
  });

  it("defaults to horizontal orientation", () => {
    const { container } = render(<Separator />);
    const el = container.querySelector('[role="separator"]')!;
    expect(el).toHaveAttribute("aria-orientation", "horizontal");
    expect(el).toHaveClass("w-full");
    expect(el).toHaveClass("h-px");
  });

  it("supports vertical orientation", () => {
    const { container } = render(<Separator orientation="vertical" />);
    const el = container.querySelector('[role="separator"]')!;
    expect(el).toHaveAttribute("aria-orientation", "vertical");
    expect(el).toHaveClass("h-full");
    expect(el).toHaveClass("w-px");
  });

  it("merges external className", () => {
    const { container } = render(<Separator className="my-4" />);
    const el = container.querySelector('[role="separator"]')!;
    expect(el).toHaveClass("my-4");
    expect(el).toHaveClass("bg-vsc-border");
  });
});
