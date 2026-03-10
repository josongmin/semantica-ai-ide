import { render, screen } from "@testing-library/react";

import { Text } from "../Text";

describe("Text", () => {
  it("renders children in a span by default", () => {
    render(<Text>Hello world</Text>);
    const el = screen.getByText("Hello world");
    expect(el.tagName).toBe("SPAN");
  });

  it('renders as a different element with the "as" prop', () => {
    render(<Text as="p">Paragraph text</Text>);
    const el = screen.getByText("Paragraph text");
    expect(el.tagName).toBe("P");
  });

  it("renders as h1 when as='h1'", () => {
    render(<Text as="h1">Heading</Text>);
    const el = screen.getByText("Heading");
    expect(el.tagName).toBe("H1");
  });

  it("renders as div when as='div'", () => {
    render(<Text as="div">Block</Text>);
    const el = screen.getByText("Block");
    expect(el.tagName).toBe("DIV");
  });

  describe("size variants", () => {
    it("applies text-2xs class for size='2xs'", () => {
      render(<Text size="2xs">Tiny</Text>);
      expect(screen.getByText("Tiny")).toHaveClass("text-2xs");
    });

    it("applies text-xs class for size='xs'", () => {
      render(<Text size="xs">Extra small</Text>);
      expect(screen.getByText("Extra small")).toHaveClass("text-xs");
    });

    it("applies text-sm class for size='sm'", () => {
      render(<Text size="sm">Small</Text>);
      expect(screen.getByText("Small")).toHaveClass("text-sm");
    });

    it("applies text-base class for size='base' (default)", () => {
      render(<Text>Base text</Text>);
      expect(screen.getByText("Base text")).toHaveClass("text-base");
    });

    it("applies text-lg class for size='lg'", () => {
      render(<Text size="lg">Large</Text>);
      expect(screen.getByText("Large")).toHaveClass("text-lg");
    });
  });

  describe("tone variants", () => {
    it("applies text-vsc-text-primary for tone='primary' (default)", () => {
      render(<Text>Primary</Text>);
      expect(screen.getByText("Primary")).toHaveClass("text-vsc-text-primary");
    });

    it("applies text-vsc-text-ghost for tone='ghost'", () => {
      render(<Text tone="ghost">Ghost</Text>);
      expect(screen.getByText("Ghost")).toHaveClass("text-vsc-text-ghost");
    });

    it("applies text-vsc-success for tone='success'", () => {
      render(<Text tone="success">Success</Text>);
      expect(screen.getByText("Success")).toHaveClass("text-vsc-success");
    });

    it("applies text-vsc-error for tone='error'", () => {
      render(<Text tone="error">Error</Text>);
      expect(screen.getByText("Error")).toHaveClass("text-vsc-error");
    });

    it("applies text-vsc-warning for tone='warning'", () => {
      render(<Text tone="warning">Warning</Text>);
      expect(screen.getByText("Warning")).toHaveClass("text-vsc-warning");
    });

    it("applies text-vsc-text-secondary for tone='secondary'", () => {
      render(<Text tone="secondary">Secondary</Text>);
      expect(screen.getByText("Secondary")).toHaveClass("text-vsc-text-secondary");
    });
  });

  describe("weight variants", () => {
    it("applies font-bold for weight='bold'", () => {
      render(<Text weight="bold">Bold text</Text>);
      expect(screen.getByText("Bold text")).toHaveClass("font-bold");
    });

    it("applies font-medium for weight='medium'", () => {
      render(<Text weight="medium">Medium text</Text>);
      expect(screen.getByText("Medium text")).toHaveClass("font-medium");
    });

    it("applies font-semibold for weight='semibold'", () => {
      render(<Text weight="semibold">Semibold text</Text>);
      expect(screen.getByText("Semibold text")).toHaveClass("font-semibold");
    });

    it("applies font-normal for weight='normal' (default)", () => {
      render(<Text>Normal weight</Text>);
      expect(screen.getByText("Normal weight")).toHaveClass("font-normal");
    });
  });

  it("applies truncate class when truncate prop is set", () => {
    render(<Text truncate>Truncated text</Text>);
    expect(screen.getByText("Truncated text")).toHaveClass("truncate");
  });

  it("applies tabular-nums class when mono prop is set", () => {
    render(<Text mono>12345</Text>);
    expect(screen.getByText("12345")).toHaveClass("tabular-nums");
  });

  it("merges external className", () => {
    render(<Text className="custom-class">Styled</Text>);
    const el = screen.getByText("Styled");
    expect(el).toHaveClass("custom-class");
    // Should still have default variant classes
    expect(el).toHaveClass("text-base");
  });

  it("passes through title prop", () => {
    render(<Text title="tooltip text">Titled</Text>);
    expect(screen.getByText("Titled")).toHaveAttribute("title", "tooltip text");
  });
});
