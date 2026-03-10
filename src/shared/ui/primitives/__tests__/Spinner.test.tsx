import { render } from "@testing-library/react";

import { Spinner } from "../Spinner";

describe("Spinner", () => {
  it("has animate-spin class", () => {
    const { container } = render(<Spinner />);
    const el = container.querySelector("i")!;
    expect(el).toHaveClass("animate-spin");
  });

  it("renders as an Icon with the 'loading' codicon", () => {
    const { container } = render(<Spinner />);
    const el = container.querySelector("i")!;
    expect(el).toHaveClass("codicon");
    expect(el).toHaveClass("codicon-loading");
  });

  it('has role="img" since it has a title/label', () => {
    const { container } = render(<Spinner />);
    const el = container.querySelector("i")!;
    expect(el).toHaveAttribute("role", "img");
  });

  describe("size variants", () => {
    it("applies text-xs for size='sm' (default)", () => {
      const { container } = render(<Spinner />);
      const el = container.querySelector("i")!;
      expect(el).toHaveClass("text-xs");
    });

    it("applies text-sm for size='md'", () => {
      const { container } = render(<Spinner size="md" />);
      const el = container.querySelector("i")!;
      expect(el).toHaveClass("text-sm");
    });
  });

  describe("label prop", () => {
    it('defaults to "Loading" as the title', () => {
      const { container } = render(<Spinner />);
      const el = container.querySelector("i")!;
      expect(el).toHaveAttribute("title", "Loading");
    });

    it("sets custom title via label prop", () => {
      const { container } = render(<Spinner label="Processing" />);
      const el = container.querySelector("i")!;
      expect(el).toHaveAttribute("title", "Processing");
    });
  });

  it("merges external className", () => {
    const { container } = render(<Spinner className="my-spinner" />);
    const el = container.querySelector("i")!;
    expect(el).toHaveClass("my-spinner");
    expect(el).toHaveClass("animate-spin");
  });
});
