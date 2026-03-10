import { createRef } from "react";
import { render, screen } from "@testing-library/react";

import { ScrollArea } from "../ScrollArea";

describe("ScrollArea", () => {
  it("renders children", () => {
    render(<ScrollArea>Scroll content</ScrollArea>);
    expect(screen.getByText("Scroll content")).toBeInTheDocument();
  });

  it("has overflow-y-auto", () => {
    const { container } = render(<ScrollArea>content</ScrollArea>);
    expect(container.firstElementChild).toHaveClass("overflow-y-auto");
  });

  it("merges custom className", () => {
    const { container } = render(<ScrollArea className="extra-class">content</ScrollArea>);
    const root = container.firstElementChild!;
    expect(root).toHaveClass("overflow-y-auto");
    expect(root).toHaveClass("extra-class");
  });

  it("forwards ref to the scroll container", () => {
    const ref = createRef<HTMLDivElement>();
    render(<ScrollArea ref={ref}>content</ScrollArea>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveClass("overflow-y-auto");
  });
});
