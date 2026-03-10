import { render, screen } from "@testing-library/react";

import { DiffSkeleton, MessageSkeleton, SessionCardSkeleton, Skeleton } from "../Skeleton";

describe("Skeleton", () => {
  it("renders with skeleton shimmer class", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveClass("skeleton");
  });

  it("renders with default text variant (rounded)", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveClass("rounded");
  });

  it("defaults height to 12px for text variant", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.height).toBe("12px");
  });

  it("applies width and height props as inline styles", () => {
    const { container } = render(<Skeleton width="200px" height="20px" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.width).toBe("200px");
    expect(el.style.height).toBe("20px");
  });

  it("merges external className", () => {
    const { container } = render(<Skeleton className="my-custom" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveClass("skeleton");
    expect(el).toHaveClass("my-custom");
  });

  it("has aria-hidden attribute", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute("aria-hidden", "true");
  });

  it("renders avatar variant with rounded-full and correct defaults", () => {
    const { container } = render(<Skeleton variant="avatar" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveClass("rounded-full");
    expect(el.style.width).toBe("32px");
    expect(el.style.height).toBe("32px");
  });

  it("renders card variant with rounded-md", () => {
    const { container } = render(<Skeleton variant="card" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveClass("rounded-md");
    expect(el.style.width).toBe("100%");
    expect(el.style.height).toBe("80px");
  });

  it("renders list-item variant with correct defaults", () => {
    const { container } = render(<Skeleton variant="list-item" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.width).toBe("100%");
    expect(el.style.height).toBe("40px");
  });

  it("renders diff-line variant with rounded-sm", () => {
    const { container } = render(<Skeleton variant="diff-line" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveClass("rounded-sm");
    expect(el.style.width).toBe("100%");
    expect(el.style.height).toBe("16px");
  });

  it("allows overriding variant defaults", () => {
    const { container } = render(<Skeleton variant="avatar" width="48px" height="48px" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.width).toBe("48px");
    expect(el.style.height).toBe("48px");
  });
});

describe("MessageSkeleton", () => {
  it("renders with role=status and aria-label", () => {
    render(<MessageSkeleton />);
    const el = screen.getByRole("status");
    expect(el).toBeTruthy();
    expect(el).toHaveAttribute("aria-label", "Loading message");
  });

  it("renders multiple skeleton elements", () => {
    const { container } = render(<MessageSkeleton />);
    const skeletons = container.querySelectorAll("[aria-hidden]");
    expect(skeletons.length).toBeGreaterThanOrEqual(5);
  });
});

describe("DiffSkeleton", () => {
  it("renders with role=status and aria-label", () => {
    render(<DiffSkeleton />);
    const el = screen.getByRole("status");
    expect(el).toBeTruthy();
    expect(el).toHaveAttribute("aria-label", "Loading diff");
  });

  it("renders header and diff lines", () => {
    const { container } = render(<DiffSkeleton />);
    const skeletons = container.querySelectorAll("[aria-hidden]");
    // 3 header + 8 lines * 2 = 19
    expect(skeletons.length).toBeGreaterThanOrEqual(16);
  });

  it("respects custom lineCount prop", () => {
    const { container: small } = render(<DiffSkeleton lineCount={2} />);
    const { container: large } = render(<DiffSkeleton lineCount={10} />);

    const smallCount = small.querySelectorAll("[aria-hidden]").length;
    const largeCount = large.querySelectorAll("[aria-hidden]").length;
    expect(largeCount).toBeGreaterThan(smallCount);
  });
});

describe("SessionCardSkeleton", () => {
  it("renders with role=status and aria-label", () => {
    render(<SessionCardSkeleton />);
    const el = screen.getByRole("status");
    expect(el).toBeTruthy();
    expect(el).toHaveAttribute("aria-label", "Loading session");
  });

  it("renders multiple skeleton elements", () => {
    const { container } = render(<SessionCardSkeleton />);
    const skeletons = container.querySelectorAll("[aria-hidden]");
    expect(skeletons.length).toBeGreaterThanOrEqual(5);
  });
});
