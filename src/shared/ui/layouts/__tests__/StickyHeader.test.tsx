import { render, screen } from "@testing-library/react";

import { StickyHeader } from "../StickyHeader";

describe("StickyHeader", () => {
  it("renders children", () => {
    render(<StickyHeader>Header text</StickyHeader>);
    expect(screen.getByText("Header text")).toBeInTheDocument();
  });

  it("has sticky and top-0 classes", () => {
    const { container } = render(<StickyHeader>content</StickyHeader>);
    const root = container.firstElementChild!;
    expect(root).toHaveClass("sticky");
    expect(root).toHaveClass("top-0");
  });

  it("merges custom className", () => {
    const { container } = render(<StickyHeader className="my-header">content</StickyHeader>);
    const root = container.firstElementChild!;
    expect(root).toHaveClass("sticky");
    expect(root).toHaveClass("my-header");
  });

  it("has a z-index class", () => {
    const { container } = render(<StickyHeader>content</StickyHeader>);
    const root = container.firstElementChild!;
    const classes = root.getAttribute("class") ?? "";
    expect(classes).toMatch(/z-\[/);
  });
});
