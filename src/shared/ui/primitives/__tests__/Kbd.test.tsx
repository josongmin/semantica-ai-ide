import { render } from "@testing-library/react";

import { Kbd } from "../Kbd";

describe("Kbd", () => {
  it("renders a <kbd> element", () => {
    const { container } = render(<Kbd>Ctrl</Kbd>);
    const el = container.querySelector("kbd");
    expect(el).toBeInTheDocument();
    expect(el?.tagName).toBe("KBD");
  });

  it("displays children text", () => {
    const { container } = render(<Kbd>Shift+K</Kbd>);
    expect(container.textContent).toBe("Shift+K");
  });

  it("merges external className", () => {
    const { container } = render(<Kbd className="extra">A</Kbd>);
    const el = container.querySelector("kbd")!;
    expect(el).toHaveClass("extra");
    // Also retains base styling
    expect(el).toHaveClass("inline-flex");
  });

  it("has base styling classes", () => {
    const { container } = render(<Kbd>X</Kbd>);
    const el = container.querySelector("kbd")!;
    expect(el).toHaveClass("inline-flex");
    expect(el).toHaveClass("items-center");
    expect(el).toHaveClass("rounded-sm");
    expect(el).toHaveClass("border");
  });
});
