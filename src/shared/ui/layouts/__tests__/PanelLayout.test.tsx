import { render, screen } from "@testing-library/react";

import { PanelLayout } from "../PanelLayout";

describe("PanelLayout", () => {
  it("renders children in the main area", () => {
    render(<PanelLayout>Main content</PanelLayout>);
    expect(screen.getByRole("main")).toHaveTextContent("Main content");
  });

  it("renders header slot", () => {
    render(<PanelLayout header={<div data-testid="header">Header</div>}>body</PanelLayout>);
    expect(screen.getByTestId("header")).toHaveTextContent("Header");
  });

  it("renders footer slot", () => {
    render(<PanelLayout footer={<div data-testid="footer">Footer</div>}>body</PanelLayout>);
    expect(screen.getByTestId("footer")).toHaveTextContent("Footer");
  });

  it("renders subheader and subfooter when provided", () => {
    render(
      <PanelLayout
        subheader={<div data-testid="subheader">Sub-H</div>}
        subfooter={<div data-testid="subfooter">Sub-F</div>}
      >
        body
      </PanelLayout>,
    );
    expect(screen.getByTestId("subheader")).toBeInTheDocument();
    expect(screen.getByTestId("subfooter")).toBeInTheDocument();
  });

  it("merges custom className", () => {
    const { container } = render(<PanelLayout className="custom-class">body</PanelLayout>);
    const root = container.firstElementChild!;
    expect(root).toHaveClass("custom-class");
    expect(root).toHaveClass("flex", "flex-col");
  });

  it("has h-screen and flex-col on the root", () => {
    const { container } = render(<PanelLayout>body</PanelLayout>);
    const root = container.firstElementChild!;
    expect(root).toHaveClass("h-full");
    expect(root).toHaveClass("flex-col");
  });

  it("main area has flex-1 and min-h-0", () => {
    render(<PanelLayout>body</PanelLayout>);
    const main = screen.getByRole("main");
    expect(main).toHaveClass("flex-1");
    expect(main).toHaveClass("min-h-0");
  });
});
