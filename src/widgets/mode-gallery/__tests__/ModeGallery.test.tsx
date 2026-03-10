import { screen } from "@testing-library/react";
import type { Atom } from "jotai";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { modeGalleryAtom } from "../../../features/mode-gallery";
import { modeGalleryOpenAtom } from "../../../shared/lib/atoms/dialogAtoms";
import type { ModeEntry } from "../../../shared/protocol";
import { ModeGallery } from "../ModeGallery";

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

function createModeEntry(overrides: Partial<ModeEntry> = {}): ModeEntry {
  return {
    id: `mode_${Math.random().toString(36).slice(2, 8)}`,
    name: "Test Mode",
    description: "A test mode description",
    author: "test-author",
    rating: 4.5,
    install_count: 1000,
    installed: false,
    categories: ["testing"],
    ...overrides,
  };
}

function renderGallery(entries: ModeEntry[] = []) {
   
  const initialValues: [Atom<any>, unknown][] = [[modeGalleryOpenAtom, true]];
  if (entries.length > 0) initialValues.push([modeGalleryAtom, entries]);
  return renderWithAtoms(<ModeGallery />, { initialValues });
}

// ─── Tests ─────────────────────────────────────────────────
describe("ModeGallery", () => {
  it("renders empty state when no modes", () => {
    renderGallery();
    expect(screen.getByTestId("mode-gallery")).toBeInTheDocument();
    expect(screen.getByTestId("mode-gallery-empty")).toBeInTheDocument();
    expect(screen.getByText("No modes found.")).toBeInTheDocument();
  });

  it("renders mode cards", () => {
    renderGallery([
      createModeEntry({ id: "m1", name: "Code Review" }),
      createModeEntry({ id: "m2", name: "Debug Helper" }),
    ]);

    expect(screen.getByTestId("mode-card-m1")).toBeInTheDocument();
    expect(screen.getByTestId("mode-card-m2")).toBeInTheDocument();
    expect(screen.getByText("Code Review")).toBeInTheDocument();
    expect(screen.getByText("Debug Helper")).toBeInTheDocument();
  });

  it("shows author name on cards", () => {
    renderGallery([createModeEntry({ id: "m1", author: "john-doe" })]);

    expect(screen.getByText("by john-doe")).toBeInTheDocument();
  });

  it("shows install count formatted", () => {
    renderGallery([createModeEntry({ id: "m1", install_count: 1500 })]);

    expect(screen.getByText("1.5K")).toBeInTheDocument();
  });

  it("shows categories as tags", () => {
    renderGallery([createModeEntry({ id: "m1", categories: ["coding", "automation"] })]);

    const card = screen.getByTestId("mode-card-m1");
    // Categories appear both in dropdown and card - scope to the card
    expect(card.querySelector("span.text-2xs")).toBeInTheDocument();
    expect(screen.getAllByText("coding").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("automation").length).toBeGreaterThanOrEqual(1);
  });

  it("Install button sends INSTALL_MODE", async () => {
    const { user } = renderGallery([createModeEntry({ id: "m1", name: "Test", installed: false })]);

    await user.click(screen.getByLabelText("Install Test"));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "INSTALL_MODE",
      mode_id: "m1",
    });
  });

  it("Uninstall button sends UNINSTALL_MODE", async () => {
    const { user } = renderGallery([createModeEntry({ id: "m1", name: "Test", installed: true })]);

    await user.click(screen.getByLabelText("Uninstall Test"));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "UNINSTALL_MODE",
      mode_id: "m1",
    });
  });

  it("search input filters modes", async () => {
    const { user } = renderGallery([
      createModeEntry({ id: "m1", name: "Code Review" }),
      createModeEntry({ id: "m2", name: "Debug Helper" }),
    ]);

    const searchInput = screen.getByTestId("mode-search-input");
    await user.type(searchInput, "code");

    expect(screen.getByTestId("mode-card-m1")).toBeInTheDocument();
    expect(screen.queryByTestId("mode-card-m2")).not.toBeInTheDocument();
  });

  it("category filter is shown when categories exist", () => {
    renderGallery([createModeEntry({ id: "m1", categories: ["coding"] })]);

    expect(screen.getByTestId("mode-category-filter")).toBeInTheDocument();
  });

  it("renders rating display", () => {
    renderGallery([createModeEntry({ id: "m1", rating: 4.5 })]);

    expect(screen.getByLabelText("Rating: 4.5")).toBeInTheDocument();
  });

  it("shows Mode Gallery header", () => {
    renderGallery();
    expect(screen.getByText("Mode Gallery")).toBeInTheDocument();
  });

  it("formats large install counts", () => {
    renderGallery([createModeEntry({ id: "m1", install_count: 1_200_000 })]);

    expect(screen.getByText("1.2M")).toBeInTheDocument();
  });
});
