import { render, screen } from "@testing-library/react";

import { ThinkingIndicator } from "../ThinkingIndicator";

describe("ThinkingIndicator", () => {
  it("renders with default label", () => {
    render(<ThinkingIndicator />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Thinking...");
    expect(screen.getByText("Thinking")).toBeInTheDocument();
  });

  it("renders with custom label", () => {
    render(<ThinkingIndicator label="Analyzing" />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Analyzing...");
    expect(screen.getByText("Analyzing")).toBeInTheDocument();
  });

  it("renders 3 bouncing dots", () => {
    const { container } = render(<ThinkingIndicator />);
    const dots = container.querySelectorAll("[aria-hidden] > span");
    expect(dots).toHaveLength(3);
  });

  it("dots have staggered animation delays", () => {
    const { container } = render(<ThinkingIndicator />);
    const dots = container.querySelectorAll("[aria-hidden] > span");
    expect(dots[0]).toHaveStyle({ animationDelay: "0s" });
    expect(dots[1]).toHaveStyle({ animationDelay: "0.15s" });
    expect(dots[2]).toHaveStyle({ animationDelay: "0.3s" });
  });

  it("renders hubot icon", () => {
    const { container } = render(<ThinkingIndicator />);
    expect(container.querySelector(".codicon-hubot")).toBeInTheDocument();
  });

  it("merges className", () => {
    const { container } = render(<ThinkingIndicator className="mt-4" />);
    expect(container.firstElementChild).toHaveClass("mt-4");
  });
});
