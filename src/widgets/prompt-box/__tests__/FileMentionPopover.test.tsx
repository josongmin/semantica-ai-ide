import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type * as SharedLib from "../../../shared/lib";
import { FileMentionPopover } from "../FileMentionPopover";

// Mock overlay hooks
vi.mock("../../../shared/lib", async (importOriginal) => {
  const actual = await importOriginal<typeof SharedLib>();
  return {
    ...actual,
    useAnimatedPresence: (open: boolean) => ({ mounted: open, exiting: false }),
    useClickOutside: vi.fn(),
    useEscapeDismiss: vi.fn(),
    useOverlayStack: vi.fn(),
    useOverlayBehavior: ({ open }: { open: boolean }) => ({
      mounted: open,
      exiting: false,
      isTop: true,
      handleTabKeyDown: vi.fn(),
    }),
  };
});

const defaultAnchorRect = new DOMRect(100, 400, 300, 30);

describe("FileMentionPopover", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <FileMentionPopover
        open={false}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        files={["src/a.ts"]}
        query=""
        anchorRect={defaultAnchorRect}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders file list when open", () => {
    render(
      <FileMentionPopover
        open={true}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        files={["src/utils/helpers.ts", "src/app.tsx"]}
        query=""
        anchorRect={defaultAnchorRect}
      />,
    );

    expect(screen.getByTestId("file-mention-popover")).toBeInTheDocument();
    expect(screen.getByText("helpers.ts")).toBeInTheDocument();
    expect(screen.getByText("app.tsx")).toBeInTheDocument();
  });

  it("filters files by query", () => {
    render(
      <FileMentionPopover
        open={true}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        files={["src/utils/helpers.ts", "src/app.tsx", "src/main.ts"]}
        query="app"
        anchorRect={defaultAnchorRect}
      />,
    );

    // HighlightedText splits the filename across <mark>/<span> elements,
    // so getByText("app.tsx") won't match – check via testid + textContent.
    const item = screen.getByTestId("file-mention-item-0");
    expect(item).toBeInTheDocument();
    expect(item.textContent).toContain("app.tsx");
    // Only one file should match the "app" query
    expect(screen.queryByTestId("file-mention-item-1")).not.toBeInTheDocument();
  });

  it("calls onSelect when a file is clicked", async () => {
    const onSelect = vi.fn();

    render(
      <FileMentionPopover
        open={true}
        onClose={vi.fn()}
        onSelect={onSelect}
        files={["src/app.tsx"]}
        query=""
        anchorRect={defaultAnchorRect}
      />,
    );

    await userEvent.click(screen.getByText("app.tsx"));

    expect(onSelect).toHaveBeenCalledWith("src/app.tsx");
  });

  it("renders nothing when no files match query", () => {
    render(
      <FileMentionPopover
        open={true}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        files={["src/a.ts"]}
        query="zzzzz"
        anchorRect={defaultAnchorRect}
      />,
    );

    // Portal renders into body, but no popover should appear
    expect(screen.queryByTestId("file-mention-popover")).not.toBeInTheDocument();
  });
});
