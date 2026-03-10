import { render } from "@testing-library/react";

import { IconLabel } from "../IconLabel";

describe("IconLabel", () => {
  it("renders icon and label text", () => {
    const { container } = render(<IconLabel icon="file" text="main.ts" />);
    // Icon element with codicon class
    const icon = container.querySelector("i.codicon");
    expect(icon).toBeInTheDocument();
    // Label text visible
    expect(container.textContent).toContain("main.ts");
  });

  it("applies the correct codicon class for the icon name", () => {
    const { container } = render(<IconLabel icon="git-branch" text="branch" />);
    const icon = container.querySelector("i")!;
    expect(icon).toHaveClass("codicon-git-branch");
  });

  it("renders the root as a span with inline-flex", () => {
    const { container } = render(<IconLabel icon="check" text="Done" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe("SPAN");
    expect(root).toHaveClass("inline-flex");
    expect(root).toHaveClass("items-center");
  });

  it("merges external className on the root element", () => {
    const { container } = render(<IconLabel icon="check" text="OK" className="ml-2" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("ml-2");
    expect(root).toHaveClass("inline-flex");
  });

  it("passes iconClassName to the Icon component", () => {
    const { container } = render(
      <IconLabel icon="warning" text="Warn" iconClassName="text-yellow" />,
    );
    const icon = container.querySelector("i")!;
    expect(icon).toHaveClass("text-yellow");
    expect(icon).toHaveClass("shrink-0");
  });
});
