import { act, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "jotai";

import { HoverCard } from "../HoverCard";

function JotaiWrapper({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}

describe("HoverCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderHoverCard = (props: Partial<React.ComponentProps<typeof HoverCard>> = {}) =>
    render(
      <HoverCard content={<span>Card content</span>} {...props}>
        <button type="button">Trigger</button>
      </HoverCard>,
      { wrapper: JotaiWrapper },
    );

  it("renders trigger children immediately", () => {
    renderHoverCard();
    expect(screen.getByText("Trigger")).toBeInTheDocument();
  });

  it("does NOT show card initially", () => {
    renderHoverCard();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows card after mouse enter + delay", () => {
    renderHoverCard();
    const trigger = screen.getByText("Trigger").closest("[aria-haspopup]")!;

    fireEvent.mouseEnter(trigger);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("hides card after mouse leave + close delay", () => {
    renderHoverCard();
    const trigger = screen.getByText("Trigger").closest("[aria-haspopup]")!;

    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.mouseLeave(trigger);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it('has aria-haspopup="true" on trigger wrapper', () => {
    renderHoverCard();
    const trigger = screen.getByText("Trigger").closest("[aria-haspopup]");
    expect(trigger).toHaveAttribute("aria-haspopup", "true");
  });

  it("aria-expanded changes from false to true when visible", () => {
    renderHoverCard();
    const trigger = screen.getByText("Trigger").closest("[aria-expanded]")!;
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("dismisses on Escape key", () => {
    renderHoverCard();
    const trigger = screen.getByText("Trigger").closest("[aria-haspopup]")!;

    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders content inside card when visible", () => {
    renderHoverCard();
    const trigger = screen.getByText("Trigger").closest("[aria-haspopup]")!;

    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it('card has role="dialog" and aria-modal="false"', () => {
    renderHoverCard();
    const trigger = screen.getByText("Trigger").closest("[aria-haspopup]")!;

    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(300);
    });

    const card = screen.getByRole("dialog");
    expect(card).toHaveAttribute("role", "dialog");
    expect(card).toHaveAttribute("aria-modal", "false");
  });

  it("applies custom className to card", () => {
    renderHoverCard({ className: "my-hover-class" });
    const trigger = screen.getByText("Trigger").closest("[aria-haspopup]")!;

    fireEvent.mouseEnter(trigger);
    act(() => {
      vi.advanceTimersByTime(300);
    });

    const card = screen.getByRole("dialog");
    expect(card.className).toContain("my-hover-class");
  });
});
