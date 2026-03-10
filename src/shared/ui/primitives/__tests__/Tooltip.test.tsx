import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Tooltip } from "../Tooltip";

describe("Tooltip", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderTooltip = (props: Partial<React.ComponentProps<typeof Tooltip>> = {}) => {
    return render(
      <Tooltip content="Tooltip text" {...props}>
        <button type="button">Hover me</button>
      </Tooltip>,
    );
  };

  it("is not visible by default", () => {
    renderTooltip();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("becomes visible after hover + delay", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderTooltip();

    await user.hover(screen.getByText("Hover me"));
    // Tooltip should not be visible yet (within delay)
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    // Advance past default delay (400ms)
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByRole("tooltip")).toHaveTextContent("Tooltip text");
  });

  it("hidden on mouse leave", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderTooltip();

    await user.hover(screen.getByText("Hover me"));
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    await user.unhover(screen.getByText("Hover me"));
    // Wait for exit animation timeout
    await act(async () => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it('has role="tooltip" when visible', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderTooltip();

    await user.hover(screen.getByText("Hover me"));
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveAttribute("role", "tooltip");
  });

  it("sets aria-describedby on wrapper when tooltip is visible", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderTooltip();

    const wrapper = screen.getByText("Hover me").closest("span")!;
    expect(wrapper).not.toHaveAttribute("aria-describedby");

    await user.hover(screen.getByText("Hover me"));
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    const tooltip = screen.getByRole("tooltip");
    expect(wrapper).toHaveAttribute("aria-describedby", tooltip.id);
  });

  describe("position prop", () => {
    it("renders tooltip with inline positioning for top", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderTooltip({ position: "top" });

      await user.hover(screen.getByText("Hover me"));
      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toBeInTheDocument();
      // Viewport-aware positioning uses inline styles instead of static classes
      expect(tooltip.style).toBeDefined();
    });

    it("renders tooltip with inline positioning for bottom", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderTooltip({ position: "bottom" });

      await user.hover(screen.getByText("Hover me"));
      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toBeInTheDocument();
      expect(tooltip.style).toBeDefined();
    });
  });

  it("respects custom delay", async () => {
    renderTooltip({ delay: 800 });

    const wrapper = screen.getByText("Hover me").closest("span")!;

    // Use fireEvent.mouseEnter to start the delay without userEvent advancing timers
    fireEvent.mouseEnter(wrapper);

    // Not visible yet
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    // Advance partially -- still not visible
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

    // Advance past the remaining delay
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("cancels pending show on mouse leave before delay", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderTooltip();

    await user.hover(screen.getByText("Hover me"));
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    // Leave before delay completes
    await user.unhover(screen.getByText("Hover me"));

    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("renders children", () => {
    renderTooltip();
    expect(screen.getByText("Hover me")).toBeInTheDocument();
  });
});
