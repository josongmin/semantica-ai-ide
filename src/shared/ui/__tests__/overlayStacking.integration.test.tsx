import { useState } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";

import { overlayStackAtom } from "../../lib/atoms";
import { resetScrollLockState } from "../../lib/hooks/useBodyScrollLock";
import { DropdownMenu } from "../composites/DropdownMenu";
import { AlertDialog } from "../primitives/AlertDialog";
import { ConfirmDialog } from "../primitives/ConfirmDialog";
import { Dialog } from "../primitives/Dialog";

/**
 * Integration tests for the overlay stacking system.
 * Uses a shared Jotai store per test to inspect atom state.
 */
describe("Overlay Stacking", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
    resetScrollLockState();
    document.body.style.overflow = "";
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  it("Single Dialog: Escape dismisses it", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <Wrapper>
        <Dialog open title="Dialog A" onClose={onClose}>
          <button type="button">Inside</button>
        </Dialog>
      </Wrapper>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Dialog + DropdownMenu nested: Escape closes only DropdownMenu (topmost)", async () => {
    const user = userEvent.setup();
    const dialogClose = vi.fn();

    function Scenario() {
      return (
        <Wrapper>
          <Dialog open title="Parent Dialog" onClose={dialogClose}>
            <DropdownMenu
              items={[{ id: "a", label: "Item A" }]}
              onSelect={vi.fn()}
              trigger={<button type="button">Menu Trigger</button>}
            />
          </Dialog>
        </Wrapper>
      );
    }

    render(<Scenario />);

    // Open the dropdown
    await user.click(screen.getByText("Menu Trigger"));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    // Escape should close the dropdown, not the dialog
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
    expect(dialogClose).not.toHaveBeenCalled();
  });

  it("After DropdownMenu closes, Escape closes Dialog", async () => {
    const user = userEvent.setup();
    const dialogClose = vi.fn();

    function Scenario() {
      return (
        <Wrapper>
          <Dialog open title="Parent Dialog" onClose={dialogClose}>
            <DropdownMenu
              items={[{ id: "a", label: "Item A" }]}
              onSelect={vi.fn()}
              trigger={<button type="button">Menu Trigger</button>}
            />
          </Dialog>
        </Wrapper>
      );
    }

    render(<Scenario />);

    // Open then close dropdown
    await user.click(screen.getByText("Menu Trigger"));
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });

    // Now Escape should close the dialog
    await user.keyboard("{Escape}");
    expect(dialogClose).toHaveBeenCalledTimes(1);
  });

  it("Two Dialogs stacked: Escape closes only the topmost", async () => {
    const user = userEvent.setup();
    const closeA = vi.fn();
    const closeB = vi.fn();

    render(
      <Wrapper>
        <Dialog open title="Dialog A" onClose={closeA}>
          <button type="button">A content</button>
        </Dialog>
        <Dialog open title="Dialog B" onClose={closeB}>
          <button type="button">B content</button>
        </Dialog>
      </Wrapper>,
    );

    // Both dialogs visible
    const dialogs = screen.getAllByRole("dialog");
    expect(dialogs).toHaveLength(2);

    // Escape should only close topmost (B)
    await user.keyboard("{Escape}");
    expect(closeB).toHaveBeenCalledTimes(1);
    expect(closeA).not.toHaveBeenCalled();
  });

  it("overlayStackAtom has correct entry count when Dialog opens", () => {
    render(
      <Wrapper>
        <Dialog open title="Stack Test" onClose={vi.fn()}>
          <button type="button">Content</button>
        </Dialog>
      </Wrapper>,
    );

    const stack = store.get(overlayStackAtom);
    expect(stack.length).toBe(1);
    expect(stack[0]?.type).toBe("dialog");
  });

  it("All overlays closed -> stack is empty", () => {
    const { rerender } = render(
      <Wrapper>
        <Dialog open title="Closing" onClose={vi.fn()}>
          <button type="button">Content</button>
        </Dialog>
      </Wrapper>,
    );

    expect(store.get(overlayStackAtom).length).toBe(1);

    rerender(
      <Wrapper>
        <Dialog open={false} title="Closing" onClose={vi.fn()}>
          <button type="button">Content</button>
        </Dialog>
      </Wrapper>,
    );

    expect(store.get(overlayStackAtom).length).toBe(0);
  });

  it("AlertDialog: Escape does NOT dismiss it", async () => {
    const user = userEvent.setup();

    render(
      <Wrapper>
        <AlertDialog open title="Blocking Alert">
          <button type="button">OK</button>
        </AlertDialog>
      </Wrapper>,
    );

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    // AlertDialog should still be present
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("Body scroll lock chains correctly (Dialog opens -> locked, closes -> unlocked)", () => {
    const { rerender } = render(
      <Wrapper>
        <Dialog open title="Scroll Lock" onClose={vi.fn()}>
          <button type="button">Content</button>
        </Dialog>
      </Wrapper>,
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <Wrapper>
        <Dialog open={false} title="Scroll Lock" onClose={vi.fn()}>
          <button type="button">Content</button>
        </Dialog>
      </Wrapper>,
    );

    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("Focus restoration chain (Dialog A -> Dialog B opens -> B closes -> focus returns to A)", async () => {
    function FocusScenario() {
      const [showB, setShowB] = useState(false);
      return (
        <Wrapper>
          <Dialog open title="Dialog A" onClose={vi.fn()}>
            <button type="button" onClick={() => setShowB(true)}>
              Open B
            </button>
          </Dialog>
          {showB && (
            <Dialog open title="Dialog B" onClose={() => setShowB(false)}>
              <button type="button">B Content</button>
            </Dialog>
          )}
        </Wrapper>
      );
    }

    const user = userEvent.setup();
    render(<FocusScenario />);

    const openBBtn = screen.getByText("Open B");
    openBBtn.focus();
    expect(document.activeElement).toBe(openBBtn);

    // Open Dialog B
    await user.click(openBBtn);

    // Wait for focus trap's requestAnimationFrame
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Focus should be inside Dialog B
    const bContent = screen.getByText("B Content");
    expect(bContent.closest('[role="dialog"]')).toBeTruthy();

    // Close Dialog B via Escape
    await user.keyboard("{Escape}");

    // Wait for focus restoration
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Focus should return to the element in Dialog A
    expect(document.activeElement).toBe(openBBtn);
  });

  it("ConfirmDialog inside Dialog: stack order maintained (confirm dialog is topmost)", async () => {
    function StackScenario() {
      const [showConfirm, setShowConfirm] = useState(false);
      return (
        <Wrapper>
          <Dialog open title="Parent" onClose={vi.fn()}>
            <button type="button" onClick={() => setShowConfirm(true)}>
              Show Confirm
            </button>
          </Dialog>
          <ConfirmDialog
            open={showConfirm}
            title="Are you sure?"
            onConfirm={vi.fn()}
            onCancel={() => setShowConfirm(false)}
          />
        </Wrapper>
      );
    }

    const user = userEvent.setup();
    render(<StackScenario />);

    // Open confirm dialog
    await user.click(screen.getByText("Show Confirm"));

    const stack = store.get(overlayStackAtom);
    expect(stack.length).toBe(2);
    // The confirm dialog (which wraps Dialog) should be the topmost entry
    expect(stack[stack.length - 1]?.type).toBe("dialog");
    // First entry is the parent dialog
    expect(stack[0]?.type).toBe("dialog");
  });
});
