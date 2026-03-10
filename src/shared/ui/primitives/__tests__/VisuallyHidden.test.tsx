import { render } from "@testing-library/react";

import { VisuallyHidden } from "../VisuallyHidden";

describe("VisuallyHidden", () => {
  it("renders children content", () => {
    const { container } = render(<VisuallyHidden>Hidden label</VisuallyHidden>);
    expect(container.textContent).toBe("Hidden label");
  });

  it("applies sr-only class for screen-reader-only pattern", () => {
    const { container } = render(<VisuallyHidden>Description</VisuallyHidden>);
    const el = container.querySelector("span")!;
    expect(el).toHaveClass("sr-only");
  });

  it("renders a span element", () => {
    const { container } = render(<VisuallyHidden>Text</VisuallyHidden>);
    const el = container.firstElementChild;
    expect(el?.tagName).toBe("SPAN");
  });

  it("children are accessible to screen readers", () => {
    const { getByText } = render(<VisuallyHidden>Accessible text</VisuallyHidden>);
    expect(getByText("Accessible text")).toBeInTheDocument();
  });
});
