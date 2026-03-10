import { render, screen } from "@testing-library/react";

import {
  DiffSkeleton,
  FileChangeSkeleton,
  MessageSkeleton,
  SessionCardSkeleton,
  SessionRowSkeleton,
  Skeleton,
  ToolCallSkeleton,
} from "../Skeleton";

describe("Skeleton", () => {
  it("renders with default text variant", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass("skeleton");
    expect(el).toHaveAttribute("aria-hidden", "true");
  });

  it("applies variant styles", () => {
    const { container } = render(<Skeleton variant="avatar" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass("rounded-full");
  });

  it("supports custom width and height", () => {
    const { container } = render(<Skeleton width="200px" height="50px" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveStyle({ width: "200px", height: "50px" });
  });

  it("applies extra className", () => {
    const { container } = render(<Skeleton className="my-custom" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass("my-custom");
  });
});

describe("MessageSkeleton", () => {
  it("renders with role=status", () => {
    render(<MessageSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading message");
  });
});

describe("DiffSkeleton", () => {
  it("renders with role=status", () => {
    render(<DiffSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading diff");
  });

  it("renders configurable number of lines", () => {
    const { container } = render(<DiffSkeleton lineCount={3} />);
    // Header row + 3 diff lines
    const diffLines = container.querySelectorAll(".flex.gap-2");
    expect(diffLines.length).toBe(3);
  });
});

describe("SessionCardSkeleton", () => {
  it("renders with role=status", () => {
    render(<SessionCardSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading session");
  });
});

describe("SessionRowSkeleton", () => {
  it("renders with role=status", () => {
    render(<SessionRowSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading session");
  });
});

describe("ToolCallSkeleton", () => {
  it("renders with role=status", () => {
    render(<ToolCallSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading tool call");
  });
});

describe("FileChangeSkeleton", () => {
  it("renders with role=status", () => {
    render(<FileChangeSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading file change");
  });
});
