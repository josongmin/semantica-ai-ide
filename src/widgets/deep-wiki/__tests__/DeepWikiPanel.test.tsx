import { act, screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { activeWikiPageIdAtom, setWikiPagesAtom, wikiPagesAtom } from "../../../features/deep-wiki";
import { deepWikiPanelVisibleAtom } from "../../../shared/lib/atoms/inspectionPanelAtoms";
import type { TurnId, WikiPage } from "../../../shared/protocol";
import { DeepWikiPanel } from "../DeepWikiPanel";

const makePage = (overrides: Partial<WikiPage> = {}): WikiPage => ({
  id: `page_${Math.random().toString(36).slice(2, 8)}`,
  title: "Test Page",
  content: "# Hello\nWorld",
  updated_at_ms: Date.now(),
  ...overrides,
});

function createPagesMap(pages: WikiPage[]): ReadonlyMap<string, WikiPage> {
  const map = new Map<string, WikiPage>();
  for (const page of pages) {
    map.set(page.id, page);
  }
  return map;
}

describe("DeepWikiPanel", () => {
  it("renders with empty state", () => {
    renderWithAtoms(<DeepWikiPanel />, { initialValues: [[deepWikiPanelVisibleAtom, true]] });

    expect(screen.getByTestId("deep-wiki-panel")).toBeInTheDocument();
    expect(screen.getByTestId("wiki-sidebar")).toBeInTheDocument();
    expect(screen.getByText("No pages generated yet")).toBeInTheDocument();
    expect(screen.getByText("Select a page to view documentation")).toBeInTheDocument();
  });

  it("renders sidebar tree items from wiki pages", () => {
    const pages: WikiPage[] = [
      makePage({ id: "p1", title: "Getting Started" }),
      makePage({ id: "p2", title: "API Reference" }),
    ];

    renderWithAtoms(<DeepWikiPanel />, {
      initialValues: [[wikiPagesAtom, createPagesMap(pages)], [deepWikiPanelVisibleAtom, true]],
    });

    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    expect(screen.getByText("API Reference")).toBeInTheDocument();
  });

  it("renders nested tree items (parent/child)", () => {
    const pages: WikiPage[] = [
      makePage({ id: "root", title: "Root" }),
      makePage({ id: "child", title: "Child Page", parent_id: "root" }),
    ];

    renderWithAtoms(<DeepWikiPanel />, {
      initialValues: [[wikiPagesAtom, createPagesMap(pages)], [deepWikiPanelVisibleAtom, true]],
    });

    expect(screen.getByText("Root")).toBeInTheDocument();
    expect(screen.getByText("Child Page")).toBeInTheDocument();
  });

  it("shows page content when a page is selected", async () => {
    const pages: WikiPage[] = [
      makePage({
        id: "p1",
        title: "Setup Guide",
        content: "Follow these steps to set up the project.",
      }),
    ];

    const { user } = renderWithAtoms(<DeepWikiPanel />, {
      initialValues: [[wikiPagesAtom, createPagesMap(pages)], [deepWikiPanelVisibleAtom, true]],
    });

    const item = screen.getByTestId("wiki-tree-item-p1");
    await user.click(item);

    // The content area shows the page text
    expect(
      await screen.findByText("Follow these steps to set up the project."),
    ).toBeInTheDocument();
    // Title appears in both sidebar and content heading
    const headings = screen.getAllByText("Setup Guide");
    expect(headings.length).toBeGreaterThanOrEqual(2);
  });

  it("shows 'Generated from' link when page has source_turn_id", () => {
    const pages: WikiPage[] = [
      makePage({
        id: "p1",
        title: "Auth Docs",
        content: "Auth content",
        source_turn_id: "turn_42" as TurnId,
      }),
    ];

    renderWithAtoms(<DeepWikiPanel />, {
      initialValues: [
        [wikiPagesAtom, createPagesMap(pages)],
        [activeWikiPageIdAtom, "p1"],
        [deepWikiPanelVisibleAtom, true],
      ],
    });

    expect(screen.getByText(/Generated from turn turn_42/)).toBeInTheDocument();
  });

  it("marks the active page with aria-current", () => {
    const pages: WikiPage[] = [
      makePage({ id: "p1", title: "Page One" }),
      makePage({ id: "p2", title: "Page Two" }),
    ];

    renderWithAtoms(<DeepWikiPanel />, {
      initialValues: [
        [wikiPagesAtom, createPagesMap(pages)],
        [activeWikiPageIdAtom, "p1"],
        [deepWikiPanelVisibleAtom, true],
      ],
    });

    const activeItem = screen.getByTestId("wiki-tree-item-p1");
    expect(activeItem).toHaveAttribute("aria-current", "page");

    const otherItem = screen.getByTestId("wiki-tree-item-p2");
    expect(otherItem).not.toHaveAttribute("aria-current");
  });

  it("updates when pages are set via store", async () => {
    const { store } = renderWithAtoms(<DeepWikiPanel />, { initialValues: [[deepWikiPanelVisibleAtom, true]] });

    expect(screen.getByText("No pages generated yet")).toBeInTheDocument();

    act(() => {
      store.set(setWikiPagesAtom, [makePage({ id: "new", title: "New Documentation" })]);
    });

    expect(await screen.findByText("New Documentation")).toBeInTheDocument();
  });

  it("has correct aria label on panel", () => {
    renderWithAtoms(<DeepWikiPanel />, { initialValues: [[deepWikiPanelVisibleAtom, true]] });
    expect(screen.getByRole("region", { name: "DeepWiki documentation" })).toBeInTheDocument();
  });
});
