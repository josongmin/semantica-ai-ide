import { render, screen } from "@testing-library/react";

import { formatCost } from "../../../shared/lib/formatters";
import { SessionCostBadge } from "../SessionCostBadge";

describe("formatCost", () => {
  it("formats zero as $0.00", () => {
    expect(formatCost(0)).toBe("$0.00");
  });

  it("formats sub-dollar costs with 2 decimal places", () => {
    expect(formatCost(0.42)).toBe("$0.42");
  });

  it("formats costs >= $1 with 2 decimal places", () => {
    expect(formatCost(1.23)).toBe("$1.23");
  });

  it("truncates to 2 decimal places", () => {
    expect(formatCost(0.129)).toBe("$0.13");
  });

  it("formats whole dollar amounts", () => {
    expect(formatCost(5)).toBe("$5.00");
  });

  it("formats large costs", () => {
    expect(formatCost(123.456)).toBe("$123.46");
  });

  it("formats very small costs with 3 decimal precision", () => {
    expect(formatCost(0.001)).toBe("$0.001");
  });

  it("formats sub-cent costs with 3 decimal precision", () => {
    expect(formatCost(0.005)).toBe("$0.005");
  });
});

describe("SessionCostBadge", () => {
  it("renders nothing when costUsd is null", () => {
    const { container } = render(<SessionCostBadge costUsd={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when costUsd is undefined", () => {
    const { container } = render(<SessionCostBadge costUsd={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when costUsd is zero", () => {
    const { container } = render(<SessionCostBadge costUsd={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when costUsd is negative", () => {
    const { container } = render(<SessionCostBadge costUsd={-1} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a badge with formatted cost for valid cost", () => {
    render(<SessionCostBadge costUsd={0.42} />);

    const badge = screen.getByTestId("session-cost-badge");
    expect(badge).toBeInTheDocument();
    expect(screen.getByText("$0.42")).toBeInTheDocument();
  });

  it("displays correct aria-label for accessibility", () => {
    render(<SessionCostBadge costUsd={1.23} />);

    expect(screen.getByLabelText("Session cost: $1.23")).toBeInTheDocument();
  });

  it("renders cost >= $1 correctly", () => {
    render(<SessionCostBadge costUsd={5.67} />);

    expect(screen.getByText("$5.67")).toBeInTheDocument();
  });

  it("renders very small but positive cost", () => {
    render(<SessionCostBadge costUsd={0.01} />);

    expect(screen.getByText("$0.01")).toBeInTheDocument();
  });

  it("applies additional className when provided", () => {
    render(<SessionCostBadge costUsd={0.42} className="ml-2" />);

    const badge = screen.getByTestId("session-cost-badge");
    expect(badge.className).toContain("ml-2");
  });

  it("renders as an inline-flex pill badge", () => {
    render(<SessionCostBadge costUsd={0.42} />);

    const badge = screen.getByTestId("session-cost-badge");
    expect(badge.className).toContain("inline-flex");
    expect(badge.className).toContain("rounded-full");
  });
});
