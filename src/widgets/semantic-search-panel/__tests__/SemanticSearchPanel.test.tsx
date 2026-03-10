import { screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils";
import { indexStatusAtom, searchResultsAtom } from "../../../entities/semantic-index";
import { searchPanelVisibleAtom } from "../../../shared/lib/atoms/sidebarPanelAtoms";
import { SemanticSearchPanel } from "../SemanticSearchPanel";

const mockPostMessage = vi.fn();

vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: vi.fn(),
  }),
}));

beforeEach(() => {
  mockPostMessage.mockClear();
});

const sampleResults = [
  {
    file_path: "src/app.tsx",
    line_number: 42,
    snippet: "export default function App() {",
    score: 0.95,
  },
  {
    file_path: "src/utils.ts",
    line_number: 10,
    snippet: "export function formatDate(date: Date) {",
    score: 0.82,
  },
];

describe("SemanticSearchPanel", () => {
  it("returns null when panel is not visible", () => {
    const { container } = renderWithAtoms(<SemanticSearchPanel />, {
      initialValues: [[searchPanelVisibleAtom, false]],
    });

    expect(container.firstChild).toBeNull();
  });

  it("renders panel when visible", () => {
    renderWithAtoms(<SemanticSearchPanel />, {
      initialValues: [[searchPanelVisibleAtom, true]],
    });

    expect(screen.getByTestId("semantic-search-panel")).toBeInTheDocument();
  });

  it("shows search input", () => {
    renderWithAtoms(<SemanticSearchPanel />, {
      initialValues: [[searchPanelVisibleAtom, true]],
    });

    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("shows reindex button", () => {
    renderWithAtoms(<SemanticSearchPanel />, {
      initialValues: [[searchPanelVisibleAtom, true]],
    });

    expect(screen.getByTestId("reindex-button")).toBeInTheDocument();
  });

  it("reindex button sends REQUEST_INDEX", async () => {
    const { user } = renderWithAtoms(<SemanticSearchPanel />, {
      initialValues: [[searchPanelVisibleAtom, true]],
    });

    await user.click(screen.getByTestId("reindex-button"));

    expect(mockPostMessage).toHaveBeenCalledWith({ type: "REQUEST_INDEX" });
  });

  it("typing in search input sends SEMANTIC_SEARCH", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { user } = renderWithAtoms(<SemanticSearchPanel />, {
      initialValues: [[searchPanelVisibleAtom, true]],
    });

    await user.type(screen.getByTestId("search-input"), "auth");
    vi.advanceTimersByTime(300);

    expect(mockPostMessage).toHaveBeenLastCalledWith({
      type: "SEMANTIC_SEARCH",
      query: "auth",
    });
    vi.useRealTimers();
  });

  it("shows results when searchResultsAtom has data", () => {
    renderWithAtoms(<SemanticSearchPanel />, {
      initialValues: [
        [searchPanelVisibleAtom, true],
        [searchResultsAtom, sampleResults],
      ],
    });

    expect(screen.getByText("src/app.tsx:42")).toBeInTheDocument();
    expect(screen.getByText("src/utils.ts:10")).toBeInTheDocument();
  });

  it("shows empty state with no results and no query", () => {
    renderWithAtoms(<SemanticSearchPanel />, {
      initialValues: [
        [searchPanelVisibleAtom, true],
        [searchResultsAtom, []],
      ],
    });

    expect(screen.getByText("Enter a query to search the codebase")).toBeInTheDocument();
  });

  it("sends OPEN_FILE when result is clicked", async () => {
    const { user } = renderWithAtoms(<SemanticSearchPanel />, {
      initialValues: [
        [searchPanelVisibleAtom, true],
        [searchResultsAtom, sampleResults],
      ],
    });

    await user.click(screen.getByTestId("search-result-0"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "OPEN_FILE",
      file_path: "src/app.tsx",
      line: 42,
    });
  });

  it("shows index status badge", () => {
    renderWithAtoms(<SemanticSearchPanel />, {
      initialValues: [
        [searchPanelVisibleAtom, true],
        [indexStatusAtom, "ready"],
      ],
    });

    expect(screen.getByTestId("index-status-badge")).toBeInTheDocument();
  });
});
