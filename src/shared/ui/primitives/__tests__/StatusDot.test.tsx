import { render, screen } from "@testing-library/react";

import { StatusDot } from "../StatusDot";

describe("StatusDot", () => {
  it('renders with aria-live="polite"', () => {
    render(<StatusDot status="idle" />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("renders with role='status'", () => {
    render(<StatusDot status="idle" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders with aria-label matching the status", () => {
    render(<StatusDot status="running" />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "running");
  });

  describe("status classes", () => {
    it("applies idle status class (bg-vsc-fg/30)", () => {
      render(<StatusDot status="idle" />);
      const el = screen.getByRole("status");
      expect(el).toHaveClass("bg-vsc-fg/30");
    });

    it("applies running status class (bg-vsc-success)", () => {
      render(<StatusDot status="running" />);
      const el = screen.getByRole("status");
      expect(el).toHaveClass("bg-vsc-success");
    });

    it("applies success status class (bg-vsc-success)", () => {
      render(<StatusDot status="success" />);
      const el = screen.getByRole("status");
      expect(el).toHaveClass("bg-vsc-success");
    });

    it("applies error status class (bg-vsc-error)", () => {
      render(<StatusDot status="error" />);
      const el = screen.getByRole("status");
      expect(el).toHaveClass("bg-vsc-error");
    });

    it("applies paused status class (bg-vsc-warning)", () => {
      render(<StatusDot status="paused" />);
      const el = screen.getByRole("status");
      expect(el).toHaveClass("bg-vsc-warning");
    });
  });

  describe("pulse animation", () => {
    const PULSE_CLASS = "animate-[pulse_2s_ease-in-out_infinite]";

    it("running status has pulse animation by default", () => {
      render(<StatusDot status="running" />);
      expect(screen.getByRole("status")).toHaveClass(PULSE_CLASS);
    });

    it("idle status does not have pulse animation by default", () => {
      render(<StatusDot status="idle" />);
      expect(screen.getByRole("status")).not.toHaveClass(PULSE_CLASS);
    });

    it("pulse can be explicitly disabled for running status", () => {
      render(<StatusDot status="running" pulse={false} />);
      expect(screen.getByRole("status")).not.toHaveClass(PULSE_CLASS);
    });

    it("pulse can be explicitly enabled for non-running status", () => {
      render(<StatusDot status="idle" pulse />);
      expect(screen.getByRole("status")).toHaveClass(PULSE_CLASS);
    });
  });

  it("has base styling (inline-block, rounded)", () => {
    render(<StatusDot status="idle" />);
    const el = screen.getByRole("status");
    expect(el).toHaveClass("inline-block");
  });

  it("renders title attribute matching status", () => {
    render(<StatusDot status="error" />);
    expect(screen.getByRole("status")).toHaveAttribute("title", "error");
  });
});
