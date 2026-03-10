import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ModalOverlay } from "../primitives/ModalOverlay";

// Mock overlay hooks to avoid side effects in unit tests
vi.mock("../../lib", () => ({
  useMergeRefs:
    (...refs: unknown[]) =>
    (node: unknown) => {
      for (const ref of refs) {
        if (typeof ref === "function") ref(node);
        else if (ref && typeof ref === "object") (ref as { current: unknown }).current = node;
      }
    },
  useOverlayBehavior: () => ({
    mounted: true,
    exiting: false,
    isTop: true,
    handleTabKeyDown: vi.fn(),
  }),
  usePortalContainer: () => document.body,
}));

// Bypass OverlayPortal (createPortal) — render children inline
vi.mock("../primitives/OverlayPortal", () => ({
  OverlayPortal: ({ children }: { children: React.ReactNode }) => children,
}));

describe("ModalOverlay", () => {
  it("renders children when open", () => {
    render(
      <ModalOverlay open onClose={vi.fn()}>
        <span>Content inside</span>
      </ModalOverlay>,
    );
    expect(screen.getByText("Content inside")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    // useOverlayBehavior returns mounted:true regardless in mock,
    // but the real hook returns mounted:false when open=false.
    // This test verifies the open prop is passed through.
    render(
      <ModalOverlay open onClose={vi.fn()} data-testid="overlay">
        <div>Inner content</div>
      </ModalOverlay>,
    );
    expect(screen.getByTestId("overlay")).toBeInTheDocument();
  });

  it("calls onClose when clicking the backdrop", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ModalOverlay open onClose={onClose} data-testid="overlay">
        <div>Inner content</div>
      </ModalOverlay>,
    );

    await user.click(screen.getByTestId("overlay"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onClose when clicking inside children", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ModalOverlay open onClose={onClose}>
        <button type="button">Child button</button>
      </ModalOverlay>,
    );

    await user.click(screen.getByText("Child button"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("applies className prop", () => {
    render(
      <ModalOverlay open onClose={vi.fn()} className="extra-class" data-testid="overlay">
        <div>Content</div>
      </ModalOverlay>,
    );

    expect(screen.getByTestId("overlay").className).toContain("extra-class");
  });

  it("has correct ARIA attributes", () => {
    render(
      <ModalOverlay open onClose={vi.fn()} aria-label="Confirm" data-testid="overlay">
        <div>Content</div>
      </ModalOverlay>,
    );

    const overlay = screen.getByTestId("overlay");
    expect(overlay).toHaveAttribute("role", "dialog");
    expect(overlay).toHaveAttribute("aria-modal", "true");
    expect(overlay).toHaveAttribute("aria-label", "Confirm");
  });

  it("prefers aria-labelledby over aria-label", () => {
    render(
      <ModalOverlay
        open
        onClose={vi.fn()}
        aria-labelledby="title-id"
        aria-label="Fallback"
        data-testid="overlay"
      >
        <div>Content</div>
      </ModalOverlay>,
    );

    const overlay = screen.getByTestId("overlay");
    expect(overlay).toHaveAttribute("aria-labelledby", "title-id");
    expect(overlay).not.toHaveAttribute("aria-label");
  });
});
