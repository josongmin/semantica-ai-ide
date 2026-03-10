import { render, screen } from "@testing-library/react";

import { Badge } from "../Badge";

describe("Badge", () => {
  it("displays text prop", () => {
    render(<Badge text="new" />);
    expect(screen.getByText("new")).toBeInTheDocument();
  });

  it("renders as a span element", () => {
    render(<Badge text="tag" />);
    expect(screen.getByText("tag").tagName).toBe("SPAN");
  });

  describe("variant styling", () => {
    it("applies default variant styling", () => {
      render(<Badge text="default" />);
      const el = screen.getByText("default");
      expect(el).toHaveClass("bg-vsc-badge-bg");
      expect(el).toHaveClass("text-vsc-badge-fg");
    });

    it("applies warning variant styling", () => {
      render(<Badge text="warn" variant="warning" />);
      const el = screen.getByText("warn");
      expect(el).toHaveClass("text-vsc-warning");
    });

    it("applies success variant styling", () => {
      render(<Badge text="ok" variant="success" />);
      const el = screen.getByText("ok");
      expect(el).toHaveClass("text-vsc-success");
    });

    it("applies error variant styling", () => {
      render(<Badge text="err" variant="error" />);
      const el = screen.getByText("err");
      expect(el).toHaveClass("text-vsc-error");
    });

    it("applies info variant styling", () => {
      render(<Badge text="info" variant="info" />);
      const el = screen.getByText("info");
      expect(el).toHaveClass("text-vsc-info");
    });
  });

  it("handles numeric text", () => {
    render(<Badge text={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("has base styling classes (inline-flex, rounded-full, text-2xs)", () => {
    render(<Badge text="base" />);
    const el = screen.getByText("base");
    expect(el).toHaveClass("inline-flex");
    expect(el).toHaveClass("rounded-full");
    expect(el).toHaveClass("text-2xs");
  });

  it("merges external className", () => {
    render(<Badge text="styled" className="my-class" />);
    expect(screen.getByText("styled")).toHaveClass("my-class");
  });
});
