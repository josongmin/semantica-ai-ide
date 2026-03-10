import { render, screen } from "@testing-library/react";

import { EmptyState } from "../EmptyState";

describe("EmptyState", () => {
  it("renders icon and title", () => {
    render(<EmptyState icon="inbox" title="No messages yet" />);
    expect(screen.getByText("No messages yet")).toBeInTheDocument();
    // Icon renders as <i class="codicon codicon-inbox">
    const icon = document.querySelector("i.codicon-inbox");
    expect(icon).toBeInTheDocument();
  });

  it("description is omitted when not provided", () => {
    const { container } = render(<EmptyState icon="inbox" title="Empty" />);
    // Only the title text should be present, not a description paragraph
    const spans = container.querySelectorAll("span");
    // One span for the title text
    const textContents = Array.from(spans).map((s) => s.textContent);
    expect(textContents).toContain("Empty");
    expect(textContents).not.toContain("");
  });

  it("description is shown when provided", () => {
    render(
      <EmptyState
        icon="inbox"
        title="No messages"
        description="Start a conversation to see messages here."
      />,
    );
    expect(screen.getByText("No messages")).toBeInTheDocument();
    expect(screen.getByText("Start a conversation to see messages here.")).toBeInTheDocument();
  });

  it("className is forwarded to the container", () => {
    const { container } = render(
      <EmptyState icon="inbox" title="Empty" className="custom-class" />,
    );
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain("custom-class");
  });
});
