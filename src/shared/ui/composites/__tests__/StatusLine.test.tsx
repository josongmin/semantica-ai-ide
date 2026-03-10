import { render, screen } from "@testing-library/react";

import { StatusLine } from "../StatusLine";

describe("StatusLine", () => {
  it("renders label text", () => {
    render(<StatusLine status="idle" label="Waiting" />);
    expect(screen.getByText("Waiting")).toBeInTheDocument();
  });

  it("badge is shown when provided", () => {
    render(<StatusLine status="running" label="Processing" badge="3" />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("timestamp is shown when provided", () => {
    render(<StatusLine status="success" label="Done" timestamp="12:34:56" />);
    expect(screen.getByText("12:34:56")).toBeInTheDocument();
  });

  it("badge is hidden when omitted", () => {
    const { container } = render(<StatusLine status="idle" label="Waiting" />);
    // Badge component renders a <span> with specific badge classes
    const badgeElements = container.querySelectorAll("span.bg-vsc-badge-bg");
    expect(badgeElements).toHaveLength(0);
  });
});
