import { createRef, useImperativeHandle, useState } from "react";
import { act, render, screen } from "@testing-library/react";
import { Provider } from "jotai";

import { AlertDialog } from "../AlertDialog";
import { Dialog } from "../Dialog";
import { Popover } from "../Popover";

function JotaiWrapper({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}

interface ToggleHandle { close: () => void }

/**
 * Exit animation tests.
 * Uses vi.useFakeTimers to freeze the 150ms exit timer from useAnimatedPresence,
 * allowing us to inspect exit animation classes before the component unmounts.
 */
describe("Exit Animations", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
  });

  it("Dialog: opening has animate-[scale-in...] class", () => {
    render(
      <Dialog open title="Enter" onClose={vi.fn()}>
        <button type="button">Content</button>
      </Dialog>,
      { wrapper: JotaiWrapper },
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toMatch(/animate-\[scale-in/);
  });

  it("Dialog: closing applies animate-[scale-out...] class", () => {
    const handleRef = createRef<ToggleHandle>();

    function Controlled() {
      const [open, setOpen] = useState(true);
      useImperativeHandle(handleRef, () => ({ close: () => setOpen(false) }));
      return (
        <Dialog open={open} title="Exit" onClose={vi.fn()}>
          <button type="button">Content</button>
        </Dialog>
      );
    }

    render(<Controlled />, { wrapper: JotaiWrapper });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    act(() => {
      handleRef.current!.close();
    });

    // Component should still be mounted during exit animation (timer hasn't fired)
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toMatch(/animate-\[scale-out/);
  });

  it("Dialog: backdrop has animate-[fade-out...] during exit", () => {
    const handleRef = createRef<ToggleHandle>();

    function Controlled() {
      const [open, setOpen] = useState(true);
      useImperativeHandle(handleRef, () => ({ close: () => setOpen(false) }));
      return (
        <Dialog open={open} title="Backdrop Exit" onClose={vi.fn()}>
          <button type="button">Content</button>
        </Dialog>
      );
    }

    render(<Controlled />, { wrapper: JotaiWrapper });

    act(() => {
      handleRef.current!.close();
    });

    const backdrop = screen.getByTestId("dialog-backdrop");
    expect(backdrop.className).toMatch(/animate-\[fade-out/);
  });

  it("AlertDialog: opening has animate-[scale-in...] class", () => {
    render(
      <AlertDialog open title="Alert Enter">
        <button type="button">OK</button>
      </AlertDialog>,
      { wrapper: JotaiWrapper },
    );

    const dialog = screen.getByRole("alertdialog");
    expect(dialog.className).toMatch(/animate-\[scale-in/);
  });

  it("AlertDialog: closing applies animate-[scale-out...] class", () => {
    const handleRef = createRef<ToggleHandle>();

    function Controlled() {
      const [open, setOpen] = useState(true);
      useImperativeHandle(handleRef, () => ({ close: () => setOpen(false) }));
      return (
        <AlertDialog open={open} title="Alert Exit">
          <button type="button">OK</button>
        </AlertDialog>
      );
    }

    render(<Controlled />, { wrapper: JotaiWrapper });
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    act(() => {
      handleRef.current!.close();
    });

    // Still mounted during exit animation
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.className).toMatch(/animate-\[scale-out/);
  });

  it("Popover: starts with opacity-0 before positioning completes in test env", () => {
    const anchor = document.createElement("button");
    document.body.appendChild(anchor);
    const anchorRef = { current: anchor } as React.RefObject<HTMLElement>;

    render(
      <Popover open anchorRef={anchorRef} onClose={vi.fn()}>
        <span>Popover content</span>
      </Popover>,
      { wrapper: JotaiWrapper },
    );

    const popover = screen.getByTestId("popover");
    // In test env, getBoundingClientRect returns zeros so positioned stays false
    expect(popover.className).toContain("opacity-0");

    document.body.removeChild(anchor);
  });
});
