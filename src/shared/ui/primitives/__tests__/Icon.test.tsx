import { render } from "@testing-library/react";

import { Icon } from "../Icon";

describe("Icon", () => {
  it("renders codicon classes: codicon codicon-{name}", () => {
    const { container } = render(<Icon name="check" />);
    const el = container.querySelector("i")!;
    expect(el).toHaveClass("codicon");
    expect(el).toHaveClass("codicon-check");
  });

  it("renders the correct codicon for different names", () => {
    const { container } = render(<Icon name="close" />);
    const el = container.querySelector("i")!;
    expect(el).toHaveClass("codicon-close");
  });

  it("renders as an <i> element", () => {
    const { container } = render(<Icon name="file" />);
    const el = container.querySelector("i");
    expect(el).toBeInTheDocument();
    expect(el?.tagName).toBe("I");
  });

  describe("tokenSize prop", () => {
    it("applies text-sm class for tokenSize='sm'", () => {
      const { container } = render(<Icon name="check" tokenSize="sm" />);
      const el = container.querySelector("i")!;
      expect(el).toHaveClass("text-sm");
    });

    it("applies text-xs class for tokenSize='xs'", () => {
      const { container } = render(<Icon name="check" tokenSize="xs" />);
      const el = container.querySelector("i")!;
      expect(el).toHaveClass("text-xs");
    });

    it("applies text-2xs class for tokenSize='2xs'", () => {
      const { container } = render(<Icon name="check" tokenSize="2xs" />);
      const el = container.querySelector("i")!;
      expect(el).toHaveClass("text-2xs");
    });

    it("applies text-base class for tokenSize='base'", () => {
      const { container } = render(<Icon name="check" tokenSize="base" />);
      const el = container.querySelector("i")!;
      expect(el).toHaveClass("text-base");
    });
  });

  describe("numeric size prop", () => {
    it("applies inline fontSize for numeric size", () => {
      const { container } = render(<Icon name="check" size={24} />);
      const el = container.querySelector("i")!;
      expect(el.style.fontSize).toBe("24px");
    });

    it("does not apply inline fontSize when size is not provided", () => {
      const { container } = render(<Icon name="check" />);
      const el = container.querySelector("i")!;
      expect(el.style.fontSize).toBe("");
    });
  });

  it("merges external className", () => {
    const { container } = render(<Icon name="check" className="extra-class" />);
    const el = container.querySelector("i")!;
    expect(el).toHaveClass("extra-class");
    expect(el).toHaveClass("codicon");
    expect(el).toHaveClass("codicon-check");
  });

  it("sets aria-hidden when no title is provided", () => {
    const { container } = render(<Icon name="check" />);
    const el = container.querySelector("i")!;
    expect(el).toHaveAttribute("aria-hidden", "true");
  });

  it('sets role="img" and title when title is provided', () => {
    const { container } = render(<Icon name="check" title="Checkmark" />);
    const el = container.querySelector("i")!;
    expect(el).toHaveAttribute("role", "img");
    expect(el).toHaveAttribute("title", "Checkmark");
    expect(el).not.toHaveAttribute("aria-hidden", "true");
  });
});
