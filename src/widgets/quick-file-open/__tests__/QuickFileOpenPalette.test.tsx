import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";

import { filePickerOpenAtom, projectFilesAtom } from "../../../shared/lib/atoms/uiAtoms";
import { QuickFileOpenPalette } from "../QuickFileOpenPalette";

const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

const TEST_FILES = [
  "src/app/App.tsx",
  "src/utils/format.ts",
  "src/hooks/useAuth.ts",
  "src/components/Button.tsx",
  "src/pages/Home.tsx",
];

function renderWithStore(store: ReturnType<typeof createStore>) {
  return render(
    <Provider store={store}>
      <QuickFileOpenPalette />
    </Provider>,
  );
}

describe("QuickFileOpenPalette", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it("renders nothing when closed", () => {
    const store = createStore();
    store.set(filePickerOpenAtom, false);
    const { container } = renderWithStore(store);
    expect(container.firstChild).toBeNull();
  });

  it("renders file list when open", () => {
    const store = createStore();
    store.set(filePickerOpenAtom, true);
    store.set(projectFilesAtom, TEST_FILES);
    renderWithStore(store);

    expect(screen.getByTestId("quick-file-open")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search files...")).toBeInTheDocument();
  });

  it("shows all files when no query", () => {
    const store = createStore();
    store.set(filePickerOpenAtom, true);
    store.set(projectFilesAtom, TEST_FILES);
    renderWithStore(store);

    expect(screen.getByText("App.tsx")).toBeInTheDocument();
    expect(screen.getByText("Button.tsx")).toBeInTheDocument();
  });

  it("filters files by query using fuzzy matching", async () => {
    const user = userEvent.setup();
    const store = createStore();
    store.set(filePickerOpenAtom, true);
    store.set(projectFilesAtom, TEST_FILES);
    renderWithStore(store);

    await user.type(screen.getByPlaceholderText("Search files..."), "btn");
    // HighlightedText splits the filename across <mark>/<span> elements,
    // so getByText("Button.tsx") won't match – check via testid + textContent.
    const item = screen.getByTestId("quick-file-item-0");
    expect(item).toBeInTheDocument();
    expect(item.textContent).toContain("Button.tsx");
  });

  it("closes on Escape key", async () => {
    const user = userEvent.setup();
    const store = createStore();
    store.set(filePickerOpenAtom, true);
    store.set(projectFilesAtom, TEST_FILES);
    renderWithStore(store);

    await user.keyboard("{Escape}");
    expect(store.get(filePickerOpenAtom)).toBe(false);
  });

  it("opens file on Enter and closes", async () => {
    const user = userEvent.setup();
    const store = createStore();
    store.set(filePickerOpenAtom, true);
    store.set(projectFilesAtom, TEST_FILES);
    renderWithStore(store);

    // Press Enter to select first file
    await user.keyboard("{Enter}");
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "OPEN_FILE",
      file_path: TEST_FILES[0],
    });
    expect(store.get(filePickerOpenAtom)).toBe(false);
  });

  it("shows no files message for unmatched query", async () => {
    const user = userEvent.setup();
    const store = createStore();
    store.set(filePickerOpenAtom, true);
    store.set(projectFilesAtom, TEST_FILES);
    renderWithStore(store);

    await user.type(screen.getByPlaceholderText("Search files..."), "zzzzzzz");
    expect(screen.getByText("No files found")).toBeInTheDocument();
  });

  it("opens on Cmd+P", async () => {
    const store = createStore();
    store.set(filePickerOpenAtom, false);
    store.set(projectFilesAtom, TEST_FILES);
    renderWithStore(store);

    // Simulate Cmd+P
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "p", metaKey: true }));
    expect(store.get(filePickerOpenAtom)).toBe(true);
  });
});
