import { render } from "@testing-library/react";

import { StreamingCursor } from "../StreamingCursor";

describe("StreamingCursor", () => {
  it("renders a span element", () => {
    const { container } = render(<StreamingCursor />);
    const el = container.querySelector("span");
    expect(el).toBeInTheDocument();
  });

  it("has the blink animation class", () => {
    const { container } = render(<StreamingCursor />);
    const el = container.querySelector("span")!;
    expect(el.className).toMatch(/animate-\[blink/);
  });

  it("is inline-block with cursor-like dimensions", () => {
    const { container } = render(<StreamingCursor />);
    const el = container.querySelector("span")!;
    expect(el).toHaveClass("inline-block");
    expect(el).toHaveClass("w-[2px]");
  });

  it("has aria-hidden for decorative element", () => {
    const { container } = render(<StreamingCursor />);
    const el = container.querySelector("span")!;
    expect(el).toHaveAttribute("aria-hidden", "true");
  });

  it("merges external className", () => {
    const { container } = render(<StreamingCursor className="ml-2" />);
    const el = container.querySelector("span")!;
    expect(el).toHaveClass("ml-2");
    expect(el).toHaveClass("inline-block");
  });
});
