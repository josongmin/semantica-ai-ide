import { fireEvent, render, screen } from "@testing-library/react";
import { createStore, Provider } from "jotai";

import { DiffViewer } from "../DiffViewer";

vi.mock("../../../features/diff-review", () => ({
  useDiffReview: () => ({
    approve: vi.fn(),
    reject: vi.fn(),
    approveAll: vi.fn(),
    rejectAll: vi.fn(),
    openInEditor: vi.fn(),
    setApprovalStatus: vi.fn(),
  }),
}));

vi.mock("../SideBySideDiffViewer", () => ({
  SideBySideDiffViewer: () => <div data-testid="side-by-side-mock" />,
}));

function renderWithStore(ui: React.ReactElement) {
  const store = createStore();
  return render(<Provider store={store}>{ui}</Provider>);
}

const twoHunkDiff = `@@ -1,5 +1,6 @@
+added line
 context1
 context2
 context3
 context4
 context5
 context6
 context7
 context8
 context9
 context10
@@ -20,3 +21,3 @@
 more context
-removed
+replaced`;

const singleHunkDiff = `@@ -1,3 +1,4 @@
 context
+new line
 context`;

const shortContextDiff = `@@ -1,5 +1,6 @@
+added
 ctx1
 ctx2
 ctx3
-old
+new`;

describe("DiffViewer – fold/unfold", () => {
  it("renders diff lines", () => {
    renderWithStore(<DiffViewer filePath="src/file.ts" diffText={twoHunkDiff} />);

    expect(screen.getByTestId("diff-viewer")).toBeInTheDocument();
    expect(screen.getByText("file.ts")).toBeInTheDocument();
  });

  it("collapses context groups of 4+ lines", () => {
    renderWithStore(<DiffViewer filePath="src/file.ts" diffText={twoHunkDiff} />);

    expect(screen.getByTestId("collapsed-context")).toBeInTheDocument();
  });

  it("shows hidden line count in collapsed row", () => {
    renderWithStore(<DiffViewer filePath="src/file.ts" diffText={twoHunkDiff} />);

    expect(screen.getByText(/lines hidden/)).toBeInTheDocument();
  });

  it("expands collapsed group on click", () => {
    renderWithStore(<DiffViewer filePath="src/file.ts" diffText={twoHunkDiff} />);

    const collapsed = screen.getByTestId("collapsed-context");
    fireEvent.click(collapsed);

    expect(screen.queryByTestId("collapsed-context")).not.toBeInTheDocument();
    expect(screen.getByText(/context5/)).toBeInTheDocument();
  });

  it("does not collapse groups smaller than 4 lines", () => {
    renderWithStore(<DiffViewer filePath="src/file.ts" diffText={shortContextDiff} />);

    expect(screen.queryByTestId("collapsed-context")).not.toBeInTheDocument();
  });

  it("shows hunk navigation when multiple hunks", () => {
    renderWithStore(<DiffViewer filePath="src/file.ts" diffText={twoHunkDiff} />);

    expect(screen.getByTestId("hunk-nav")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });

  it("hides hunk nav for single hunk", () => {
    renderWithStore(<DiffViewer filePath="src/file.ts" diffText={singleHunkDiff} />);

    expect(screen.queryByTestId("hunk-nav")).not.toBeInTheDocument();
  });

  it("renders no-diff state", () => {
    renderWithStore(<DiffViewer filePath="src/empty.ts" diffText="" />);

    expect(screen.getByText("No diff available")).toBeInTheDocument();
  });
});
