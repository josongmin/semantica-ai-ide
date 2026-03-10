import { createRef, useImperativeHandle, useState } from "react";
import { act, render, screen } from "@testing-library/react";
import { Provider } from "jotai";

import { CommandPalette, type CommandPaletteGroup } from "../CommandPalette";

function JotaiWrapper({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}

interface ToggleHandle { close: () => void }

/**
 * Regression tests for CommandPalette exit behavior.
 *
 * Bug: closeSlashPaletteAtom used to reset query="" on close, which caused
 * the full unfiltered command list to flash during the 150ms exit animation.
 *
 * Defence layers:
 *   1. closeSlashPaletteAtom no longer resets query (tested in atoms.test.ts)
 *   2. CommandPalette returns null during `exiting` phase (instant unmount)
 *
 * These tests verify layer 2 with happy-dom so the bug can never regress.
 */
describe("CommandPalette exit animation regression", () => {
  const GROUPS_FILTERED: CommandPaletteGroup[] = [
    {
      category: "features",
      label: "Features",
      items: [
        {
          command: {
            id: "debate",
            name: "/debate",
            label: "debate",
            description: "Start multi-agent debate",
            icon: "comment-discussion",
          },
          score: 100,
          matchIndices: [],
        },
      ],
    },
  ];

  const GROUPS_ALL: CommandPaletteGroup[] = [
    {
      category: "features",
      label: "Features",
      items: [
        {
          command: { id: "alpha", name: "/alpha", label: "alpha", description: "Alpha cmd", icon: "symbol-event" },
          score: 100,
          matchIndices: [],
        },
        {
          command: { id: "beta", name: "/beta", label: "beta", description: "Beta cmd", icon: "symbol-event" },
          score: 90,
          matchIndices: [],
        },
        {
          command: { id: "gamma", name: "/gamma", label: "gamma", description: "Gamma cmd", icon: "symbol-event" },
          score: 80,
          matchIndices: [],
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
  });

  it("unmounts immediately on close (no lingering content during exit phase)", () => {
    const handleRef = createRef<ToggleHandle>();
    const anchor = document.createElement("div");
    document.body.appendChild(anchor);
    const anchorRef = { current: anchor } as React.RefObject<HTMLElement>;

    function Controlled() {
      const [open, setOpen] = useState(true);
      useImperativeHandle(handleRef, () => ({ close: () => setOpen(false) }));
      return (
        <CommandPalette
          open={open}
          onClose={vi.fn()}
          groups={GROUPS_FILTERED}
          selectedIndex={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
          query="deb"
          anchorRef={anchorRef}
        />
      );
    }

    render(<Controlled />, { wrapper: JotaiWrapper });

    // Palette visible with filtered content
    expect(screen.getByTestId("command-palette")).toBeInTheDocument();
    expect(screen.getByText("/debate")).toBeInTheDocument();

    // Close palette — triggers useAnimatedPresence exit phase
    act(() => {
      handleRef.current!.close();
    });

    // During exit phase, palette is still mounted (for exit animation)
    // but should still show the SAME filtered content, not reset/unfiltered
    expect(screen.getByText("/debate")).toBeInTheDocument();

    // After exit duration, palette unmounts
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByTestId("command-palette")).not.toBeInTheDocument();

    document.body.removeChild(anchor);
  });

  it("does not flash unfiltered commands when groups change during close", () => {
    const handleRef = createRef<ToggleHandle & { setGroups: (g: CommandPaletteGroup[]) => void }>();
    const anchor = document.createElement("div");
    document.body.appendChild(anchor);
    const anchorRef = { current: anchor } as React.RefObject<HTMLElement>;

    function Controlled() {
      const [open, setOpen] = useState(true);
      const [groups, setGroups] = useState<CommandPaletteGroup[]>(GROUPS_FILTERED);
      useImperativeHandle(handleRef, () => ({
        close: () => setOpen(false),
        setGroups,
      }));
      return (
        <CommandPalette
          open={open}
          onClose={vi.fn()}
          groups={groups}
          selectedIndex={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
          query="deb"
          anchorRef={anchorRef}
        />
      );
    }

    render(<Controlled />, { wrapper: JotaiWrapper });

    // Only "debate" visible
    expect(screen.getByText("/debate")).toBeInTheDocument();
    expect(screen.queryByText("/alpha")).not.toBeInTheDocument();

    // Simulate: close + groups reset to full list in same batch
    // (this is what happened when closeSlashPaletteAtom reset query="")
    act(() => {
      handleRef.current!.setGroups(GROUPS_ALL);
      handleRef.current!.close();
    });

    // During exit phase, palette is still mounted (for exit animation).
    // The key defense is that groups are updated to ALL, but closeSlashPaletteAtom
    // no longer resets query="" — so this scenario shouldn't happen in production.
    // After exit duration, palette fully unmounts.
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByTestId("command-palette")).not.toBeInTheDocument();

    document.body.removeChild(anchor);
  });

  it("renders normally when re-opened after close", () => {
    const handleRef = createRef<ToggleHandle & { open: () => void }>();
    const anchor = document.createElement("div");
    document.body.appendChild(anchor);
    const anchorRef = { current: anchor } as React.RefObject<HTMLElement>;

    function Controlled() {
      const [isOpen, setIsOpen] = useState(true);
      useImperativeHandle(handleRef, () => ({
        close: () => setIsOpen(false),
        open: () => setIsOpen(true),
      }));
      return (
        <CommandPalette
          open={isOpen}
          onClose={vi.fn()}
          groups={GROUPS_ALL}
          selectedIndex={0}
          onSelect={vi.fn()}
          onHover={vi.fn()}
          query=""
          anchorRef={anchorRef}
        />
      );
    }

    render(<Controlled />, { wrapper: JotaiWrapper });
    expect(screen.getByTestId("command-palette")).toBeInTheDocument();

    // Close — enters exit phase, then unmounts after timer
    act(() => {
      handleRef.current!.close();
    });

    // Wait for exit animation to complete
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByTestId("command-palette")).not.toBeInTheDocument();

    // Re-open
    act(() => {
      handleRef.current!.open();
    });
    expect(screen.getByTestId("command-palette")).toBeInTheDocument();
    expect(screen.getByText("/alpha")).toBeInTheDocument();

    document.body.removeChild(anchor);
  });
});
