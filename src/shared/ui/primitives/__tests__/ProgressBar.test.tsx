import { render, screen } from "@testing-library/react";

import { ProgressBar } from "../ProgressBar";

describe("ProgressBar", () => {
  it('has role="progressbar"', () => {
    render(<ProgressBar value={3} max={10} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("sets aria-valuenow correctly", () => {
    render(<ProgressBar value={3} max={10} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "3");
  });

  it("sets aria-valuemax correctly", () => {
    render(<ProgressBar value={3} max={10} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuemax", "10");
  });

  it("sets aria-valuemin to 0", () => {
    render(<ProgressBar value={3} max={10} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuemin", "0");
  });

  describe("width style reflects percentage", () => {
    it("sets width to 50% for value=5 max=10", () => {
      const { container } = render(<ProgressBar value={5} max={10} />);
      const bar = container.querySelector("[style]")!;
      expect((bar as HTMLElement).style.width).toBe("50%");
    });

    it("sets width to 100% for value=10 max=10", () => {
      const { container } = render(<ProgressBar value={10} max={10} />);
      const bar = container.querySelector("[style]")!;
      expect((bar as HTMLElement).style.width).toBe("100%");
    });

    it("sets width to 0% for value=0 max=10", () => {
      const { container } = render(<ProgressBar value={0} max={10} />);
      const bar = container.querySelector("[style]")!;
      expect((bar as HTMLElement).style.width).toBe("0%");
    });

    it("caps width at 100% when value exceeds max", () => {
      const { container } = render(<ProgressBar value={15} max={10} />);
      const bar = container.querySelector("[style]")!;
      expect((bar as HTMLElement).style.width).toBe("100%");
    });
  });

  describe("label", () => {
    it("displays label text when provided", () => {
      render(<ProgressBar value={3} max={10} label="3/10" />);
      expect(screen.getByText("3/10")).toBeInTheDocument();
    });

    it("sets aria-label when label is provided", () => {
      render(<ProgressBar value={3} max={10} label="3 of 10" />);
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", "3 of 10");
    });

    it("does not render label span when no label provided", () => {
      const { container } = render(<ProgressBar value={3} max={10} />);
      const spans = container.querySelectorAll("span");
      expect(spans).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("0/0 max results in 0% width", () => {
      const { container } = render(<ProgressBar value={0} max={0} />);
      const bar = container.querySelector("[style]")!;
      expect((bar as HTMLElement).style.width).toBe("0%");
    });

    it("value > 0 with max=0 results in 0% width", () => {
      const { container } = render(<ProgressBar value={5} max={0} />);
      const bar = container.querySelector("[style]")!;
      expect((bar as HTMLElement).style.width).toBe("0%");
    });
  });

  it("merges external className", () => {
    render(<ProgressBar value={3} max={10} className="custom-bar" />);
    expect(screen.getByRole("progressbar")).toHaveClass("custom-bar");
  });

  describe("barClassName", () => {
    it("uses custom barClassName instead of default", () => {
      const { container } = render(<ProgressBar value={5} max={10} barClassName="bg-vsc-error" />);
      const bar = container.querySelector("[style]")!;
      expect(bar).toHaveClass("bg-vsc-error");
      expect(bar).not.toHaveClass("bg-vsc-success");
    });

    it("uses bg-vsc-success by default when no barClassName", () => {
      const { container } = render(<ProgressBar value={5} max={10} />);
      const bar = container.querySelector("[style]")!;
      expect(bar).toHaveClass("bg-vsc-success");
    });
  });
});
