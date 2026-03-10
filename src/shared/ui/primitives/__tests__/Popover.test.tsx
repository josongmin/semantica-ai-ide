import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "jotai";

import { computeFloatingPosition } from "../../../lib/hooks/useFloatingPosition";
import { Popover } from "../Popover";

function JotaiWrapper({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}

describe("Popover", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    onClose.mockClear();
  });

  /** Create a real DOM anchor for anchorRef. */
  function createAnchor(): { anchorRef: React.RefObject<HTMLElement>; cleanup: () => void } {
    const anchor = document.createElement("button");
    anchor.textContent = "Trigger";
    document.body.appendChild(anchor);
    const anchorRef = { current: anchor } as React.RefObject<HTMLElement>;
    return { anchorRef, cleanup: () => document.body.removeChild(anchor) };
  }

  const renderPopover = (
    props: Partial<React.ComponentProps<typeof Popover>> = {},
    anchorRef?: React.RefObject<HTMLElement>,
  ) => {
    const { anchorRef: defaultRef, cleanup } = createAnchor();
    const ref = anchorRef ?? defaultRef;
    const result = render(
      <Popover open anchorRef={ref} onClose={onClose} {...props}>
        <span>Popover content</span>
      </Popover>,
      { wrapper: JotaiWrapper },
    );
    return { ...result, cleanup };
  };

  it("renders nothing when open is false", () => {
    const { cleanup } = renderPopover({ open: false });
    expect(screen.queryByTestId("popover")).not.toBeInTheDocument();
    cleanup();
  });

  it("renders popover in portal when open", () => {
    const { cleanup } = renderPopover();
    expect(screen.getByTestId("popover")).toBeInTheDocument();
    cleanup();
  });

  it('has role="dialog" and aria-modal="false"', () => {
    const { cleanup } = renderPopover();
    const popover = screen.getByTestId("popover");
    expect(popover).toHaveAttribute("role", "dialog");
    expect(popover).toHaveAttribute("aria-modal", "false");
    cleanup();
  });

  it("renders children content", () => {
    const { cleanup } = renderPopover();
    expect(screen.getByText("Popover content")).toBeInTheDocument();
    cleanup();
  });

  it("calls onClose on Escape press", async () => {
    const user = userEvent.setup();
    const { cleanup } = renderPopover();

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it("calls onClose on outside click (mousedown)", () => {
    const { cleanup } = renderPopover();
    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it("does not call onClose when clicking inside popover", () => {
    const { cleanup } = renderPopover();
    const popover = screen.getByTestId("popover");
    fireEvent.mouseDown(popover);
    expect(onClose).not.toHaveBeenCalled();
    cleanup();
  });

  it("applies custom className", () => {
    const { cleanup } = renderPopover({ className: "my-custom-class" });
    const popover = screen.getByTestId("popover");
    expect(popover.className).toContain("my-custom-class");
    cleanup();
  });

  it('data-testid="popover" is present', () => {
    const { cleanup } = renderPopover();
    expect(screen.getByTestId("popover")).toBeTruthy();
    cleanup();
  });

  it("starts with opacity-0 before positioning completes", () => {
    const { cleanup } = renderPopover();
    const popover = screen.getByTestId("popover");
    // In test env, getBoundingClientRect returns zeros so positioned stays false
    expect(popover.className).toContain("opacity-0");
    cleanup();
  });

  // ─── computeFloatingPosition unit tests ─────────────────────────

  const anchor: DOMRect = {
    top: 100,
    left: 200,
    bottom: 140,
    right: 300,
    width: 100,
    height: 40,
    x: 200,
    y: 100,
    toJSON() {},
  };

  const popover: DOMRect = {
    top: 0,
    left: 0,
    bottom: 60,
    right: 80,
    width: 80,
    height: 60,
    x: 0,
    y: 0,
    toJSON() {},
  };

  // offset=8, viewportPadding=8, flip=false, shift=false to match pure math
  const compute = (p: "top" | "bottom" | "left" | "right", a: "start" | "center" | "end") =>
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- testing the deprecated function
    computeFloatingPosition(anchor, popover, { placement: p, align: a, gap: 8, padding: 8, flip: false, shift: false });

  it("computeFloatingPosition: bottom/center placement", () => {
    const pos = compute("bottom", "center");
    expect(pos.top).toBe(148);
    expect(pos.left).toBe(210);
  });

  it("computeFloatingPosition: top/start placement", () => {
    const pos = compute("top", "start");
    expect(pos.top).toBe(32);
    expect(pos.left).toBe(200);
  });

  it("computeFloatingPosition: right/end placement", () => {
    const pos = compute("right", "end");
    expect(pos.left).toBe(308);
    expect(pos.top).toBe(80);
  });

  it("computeFloatingPosition: left/center placement", () => {
    const pos = compute("left", "center");
    expect(pos.left).toBe(112);
    expect(pos.top).toBe(90);
  });
});
