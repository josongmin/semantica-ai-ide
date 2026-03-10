import { render, screen } from "@testing-library/react";

import type { MermaidRenderState } from "~shared/bootstrap/theme-settings";

let mockState: MermaidRenderState = { status: "loading" };

vi.mock("~shared/bootstrap/theme-settings", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("~shared/bootstrap/theme-settings");
  return {
    ...actual,
    useMermaidRenderer: () => mockState,
  };
});

import { MermaidDiagram } from "../MermaidDiagram";

describe("MermaidDiagram", () => {
  beforeEach(() => {
    mockState = { status: "loading" };
  });

  it("shows spinner while loading", () => {
    mockState = { status: "loading" };
    render(<MermaidDiagram source="graph TD; A-->B" />);
    expect(screen.getByText("Rendering diagram...")).toBeInTheDocument();
  });

  it("renders SVG on success", () => {
    mockState = { status: "success", svgHtml: '<svg data-testid="svg-result">ok</svg>' };
    const { container } = render(<MermaidDiagram source="graph TD; A-->B" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText("mermaid")).toBeInTheDocument();
  });

  it("shows raw source on error", () => {
    mockState = { status: "error", error: "Parse error" };
    render(<MermaidDiagram source="invalid syntax" />);
    expect(screen.getByText("mermaid (render error)")).toBeInTheDocument();
    expect(screen.getByText("invalid syntax")).toBeInTheDocument();
  });

  it("shows toggle buttons for success state", () => {
    mockState = { status: "success", svgHtml: "<svg>test</svg>" };
    render(<MermaidDiagram source="graph TD; A-->B" />);
    // Success state shows Diagram/Code toggle (CodeBlockActions only in code view)
    expect(screen.getByText("Diagram")).toBeInTheDocument();
    expect(screen.getByText("Code")).toBeInTheDocument();
  });

  it("shows CodeBlockActions for error state", () => {
    mockState = { status: "error", error: "fail" };
    const { container } = render(<MermaidDiagram source="bad" />);
    const wrapper = container.querySelector(".group\\/code");
    expect(wrapper).toBeInTheDocument();
  });

  it("applies custom className", () => {
    mockState = { status: "loading" };
    const { container } = render(
      <MermaidDiagram source="graph TD; A-->B" className="custom-cls" />,
    );
    expect(container.querySelector(".custom-cls")).toBeInTheDocument();
  });
});
