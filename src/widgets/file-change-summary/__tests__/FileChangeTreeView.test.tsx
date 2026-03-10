import { render, screen } from "@testing-library/react";

import { createFileChange } from "../../../shared/lib/mocks";
import { FileChangeTreeView } from "../FileChangeTreeView";

// Mock useDiffReview used by FileChangeRow
vi.mock("../../../features/diff-review", () => ({
  useDiffReview: () => ({
    approve: vi.fn(),
    reject: vi.fn(),
    approveAll: vi.fn(),
    openInEditor: vi.fn(),
    setApprovalStatus: vi.fn(),
  }),
}));

// Mock FileChangeRow to isolate tests
vi.mock("../FileChangeRow", () => ({
  FileChangeRow: ({ fileChange }: { fileChange: { file_path: string } }) => (
    <div data-testid={`file-row-${fileChange.file_path}`}>{fileChange.file_path}</div>
  ),
}));

describe("FileChangeTreeView", () => {
  it("groups files by directory", () => {
    const files = [
      createFileChange({
        file_path: "src/components/Button.tsx",
        turn_id: "t1",
        insertions: 5,
        deletions: 2,
      }),
      createFileChange({
        file_path: "src/components/Input.tsx",
        turn_id: "t1",
        insertions: 3,
        deletions: 1,
      }),
      createFileChange({
        file_path: "src/utils/helpers.ts",
        turn_id: "t1",
        insertions: 10,
        deletions: 0,
      }),
    ];

    render(<FileChangeTreeView files={files} />);

    // Should show directory names (extractDirPath returns without trailing slash)
    expect(screen.getByText("src/components")).toBeInTheDocument();
    expect(screen.getByText("src/utils")).toBeInTheDocument();
  });

  it("shows aggregate insertions and deletions per directory", () => {
    const files = [
      createFileChange({ file_path: "src/a.ts", turn_id: "t1", insertions: 5, deletions: 2 }),
      createFileChange({ file_path: "src/b.ts", turn_id: "t1", insertions: 3, deletions: 1 }),
    ];

    render(<FileChangeTreeView files={files} />);

    // Aggregate: +8 -3
    expect(screen.getByText("+8")).toBeInTheDocument();
    expect(screen.getByText("-3")).toBeInTheDocument();
  });

  it("renders file rows inside each group", () => {
    const files = [
      createFileChange({ file_path: "src/foo.ts", turn_id: "t1" }),
      createFileChange({ file_path: "lib/bar.ts", turn_id: "t1" }),
    ];

    render(<FileChangeTreeView files={files} />);

    expect(screen.getByTestId("file-row-src/foo.ts")).toBeInTheDocument();
    expect(screen.getByTestId("file-row-lib/bar.ts")).toBeInTheDocument();
  });

  it("shows badge with file count per directory", () => {
    const files = [
      createFileChange({ file_path: "src/a.ts", turn_id: "t1" }),
      createFileChange({ file_path: "src/b.ts", turn_id: "t1" }),
      createFileChange({ file_path: "src/c.ts", turn_id: "t1" }),
    ];

    render(<FileChangeTreeView files={files} />);

    // Badge showing 3
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("sorts directories alphabetically", () => {
    const files = [
      createFileChange({ file_path: "z-dir/a.ts", turn_id: "t1" }),
      createFileChange({ file_path: "a-dir/b.ts", turn_id: "t1" }),
      createFileChange({ file_path: "m-dir/c.ts", turn_id: "t1" }),
    ];

    render(<FileChangeTreeView files={files} />);

    const treeView = screen.getByTestId("file-change-tree-view");
    const dirTexts = treeView.textContent;
    const aIdx = dirTexts.indexOf("a-dir");
    const mIdx = dirTexts.indexOf("m-dir");
    const zIdx = dirTexts.indexOf("z-dir");

    expect(aIdx).toBeLessThan(mIdx);
    expect(mIdx).toBeLessThan(zIdx);
  });

  it("returns null for empty files array", () => {
    const { container } = render(<FileChangeTreeView files={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it('groups root files under "/"', () => {
    const files = [
      createFileChange({ file_path: "README.md", turn_id: "t1", insertions: 1, deletions: 0 }),
    ];

    render(<FileChangeTreeView files={files} />);

    expect(screen.getByText("/")).toBeInTheDocument();
    expect(screen.getByTestId("file-row-README.md")).toBeInTheDocument();
  });

  it("has data-testid on root element", () => {
    const files = [createFileChange({ file_path: "src/a.ts", turn_id: "t1" })];

    render(<FileChangeTreeView files={files} />);

    expect(screen.getByTestId("file-change-tree-view")).toBeInTheDocument();
  });
});
