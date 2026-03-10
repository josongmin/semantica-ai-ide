import { screen } from "@testing-library/react";
import type { Atom } from "jotai";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { playbookMarketAtom } from "../../../features/playbook-market";
import { playbookMarketOpenAtom } from "../../../shared/lib/atoms/dialogAtoms";
import type { PlaybookEntry } from "../../../shared/protocol";
import { PlaybookMarket } from "../PlaybookMarket";

// ─── Mocks ─────────────────────────────────────────────────
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

beforeEach(() => {
  mockPostMessage.mockClear();
});

function createPlaybookEntry(overrides: Partial<PlaybookEntry> = {}): PlaybookEntry {
  return {
    id: `pb_${Math.random().toString(36).slice(2, 8)}`,
    name: "Test Playbook",
    description: "A test playbook description",
    version: "1.0.0",
    author: "test-author",
    rating: 4.2,
    installed: false,
    category: "general",
    ...overrides,
  };
}

function renderMarket(entries: PlaybookEntry[] = []) {
   
  const initialValues: [Atom<any>, unknown][] = [[playbookMarketOpenAtom, true]];
  if (entries.length > 0) initialValues.push([playbookMarketAtom, entries]);
  return renderWithAtoms(<PlaybookMarket />, { initialValues });
}

// ─── Tests ─────────────────────────────────────────────────
describe("PlaybookMarket", () => {
  it("renders empty state when no playbooks", () => {
    renderMarket();
    expect(screen.getByTestId("playbook-market")).toBeInTheDocument();
    expect(screen.getByTestId("playbook-market-empty")).toBeInTheDocument();
    expect(screen.getByText("No playbooks found.")).toBeInTheDocument();
  });

  it("renders playbook cards", () => {
    renderMarket([
      createPlaybookEntry({ id: "p1", name: "Deploy Script" }),
      createPlaybookEntry({ id: "p2", name: "Test Runner" }),
    ]);

    expect(screen.getByTestId("playbook-card-p1")).toBeInTheDocument();
    expect(screen.getByTestId("playbook-card-p2")).toBeInTheDocument();
    expect(screen.getByText("Deploy Script")).toBeInTheDocument();
    expect(screen.getByText("Test Runner")).toBeInTheDocument();
  });

  it("shows version and author on cards", () => {
    renderMarket([createPlaybookEntry({ id: "p1", version: "2.3.1", author: "alice" })]);

    expect(screen.getByText("v2.3.1")).toBeInTheDocument();
    expect(screen.getByText("by alice")).toBeInTheDocument();
  });

  it("shows rating", () => {
    renderMarket([createPlaybookEntry({ id: "p1", rating: 4.7 })]);

    expect(screen.getByLabelText("Rating: 4.7")).toBeInTheDocument();
  });

  it("shows category tag", () => {
    renderMarket([createPlaybookEntry({ id: "p1", category: "deployment" })]);

    // Category appears in both card tag and dropdown - use getAllByText
    expect(screen.getAllByText("deployment").length).toBeGreaterThanOrEqual(1);
    // Verify it's in the card specifically
    const card = screen.getByTestId("playbook-card-p1");
    expect(card.querySelector("span.text-2xs")).toBeInTheDocument();
  });

  it("Install button sends INSTALL_PLAYBOOK", async () => {
    const { user } = renderMarket([
      createPlaybookEntry({ id: "p1", name: "Test", installed: false }),
    ]);

    await user.click(screen.getByLabelText("Install Test"));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "INSTALL_PLAYBOOK",
      playbook_id: "p1",
    });
  });

  it("Uninstall button sends UNINSTALL_PLAYBOOK", async () => {
    const { user } = renderMarket([
      createPlaybookEntry({ id: "p1", name: "Test", installed: true }),
    ]);

    await user.click(screen.getByLabelText("Uninstall Test"));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "UNINSTALL_PLAYBOOK",
      playbook_id: "p1",
    });
  });

  it("Use button sends APPLY_PLAYBOOK for installed playbooks", async () => {
    const { user } = renderMarket([
      createPlaybookEntry({ id: "p1", name: "Test", installed: true }),
    ]);

    await user.click(screen.getByLabelText("Use Test"));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "APPLY_PLAYBOOK",
      playbook_id: "p1",
    });
  });

  it("Use button not shown for uninstalled playbooks", () => {
    renderMarket([createPlaybookEntry({ id: "p1", name: "Test", installed: false })]);

    expect(screen.queryByLabelText("Use Test")).not.toBeInTheDocument();
  });

  it("search input filters playbooks", async () => {
    const { user } = renderMarket([
      createPlaybookEntry({ id: "p1", name: "Deploy Script" }),
      createPlaybookEntry({ id: "p2", name: "Test Runner" }),
    ]);

    const searchInput = screen.getByTestId("playbook-search-input");
    await user.type(searchInput, "deploy");

    expect(screen.getByTestId("playbook-card-p1")).toBeInTheDocument();
    expect(screen.queryByTestId("playbook-card-p2")).not.toBeInTheDocument();
  });

  it("category filter is shown when categories exist", () => {
    renderMarket([createPlaybookEntry({ id: "p1", category: "testing" })]);

    expect(screen.getByTestId("playbook-category-filter")).toBeInTheDocument();
  });

  it("shows Playbook Market header", () => {
    renderMarket();
    expect(screen.getByText("Playbook Market")).toBeInTheDocument();
  });
});
