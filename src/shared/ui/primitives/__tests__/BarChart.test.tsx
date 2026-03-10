import { render } from "@testing-library/react";

import { BarChart } from "../BarChart";

describe("BarChart", () => {
  it("renders bars for insertions and deletions", () => {
    const { container } = render(<BarChart insertions={10} deletions={5} />);
    const wrapper = container.querySelector('[role="img"]');
    expect(wrapper).toBeInTheDocument();
    // Two colored bar segments inside the bar track
    const bars = container.querySelectorAll(".bg-vsc-success, .bg-vsc-error");
    expect(bars.length).toBe(2);
  });

  it("bar widths are proportional to values", () => {
    const { container } = render(<BarChart insertions={80} deletions={20} maxWidth={100} />);
    const insertBar = container.querySelector(".bg-vsc-success")!;
    const deleteBar = container.querySelector(".bg-vsc-error")!;
    // 80 / 100 * 100 = 80, 20 / 100 * 100 = 20
    expect((insertBar as HTMLElement).style.width).toBe("80px");
    expect((deleteBar as HTMLElement).style.width).toBe("20px");
  });

  it("displays insertion and deletion labels", () => {
    const { container } = render(<BarChart insertions={42} deletions={13} />);
    expect(container.textContent).toContain("+42");
    expect(container.textContent).toContain("-13");
  });

  it("returns null when total is zero (no bars)", () => {
    const { container } = render(<BarChart insertions={0} deletions={0} />);
    expect(container.innerHTML).toBe("");
  });

  it("includes an aria-label describing insertions and deletions", () => {
    const { container } = render(<BarChart insertions={3} deletions={7} />);
    const wrapper = container.querySelector('[role="img"]');
    expect(wrapper).toHaveAttribute("aria-label", "3 insertions, 7 deletions");
  });

  it("forwards className to the root element", () => {
    const { container } = render(
      <BarChart insertions={1} deletions={1} className="custom-class" />,
    );
    const wrapper = container.querySelector('[role="img"]');
    expect(wrapper).toHaveClass("custom-class");
  });

  it("renders only insertion bar when deletions is 0", () => {
    const { container } = render(<BarChart insertions={5} deletions={0} />);
    expect(container.querySelector(".bg-vsc-success")).toBeInTheDocument();
    expect(container.querySelector(".bg-vsc-error")).not.toBeInTheDocument();
  });

  it("renders only deletion bar when insertions is 0", () => {
    const { container } = render(<BarChart insertions={0} deletions={5} />);
    expect(container.querySelector(".bg-vsc-success")).not.toBeInTheDocument();
    expect(container.querySelector(".bg-vsc-error")).toBeInTheDocument();
  });
});
