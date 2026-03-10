import { render, screen } from "@testing-library/react";

import type { FileChange } from "../../../shared/protocol";
import { FileChangeRow } from "../FileChangeRow";

// Mock useDiffReview
const mockApprove = vi.fn();
const mockReject = vi.fn();
const mockOpenInEditor = vi.fn();

vi.mock("../../../features/diff-review", () => ({
  useDiffReview: () => ({
    approve: mockApprove,
    reject: mockReject,
    approveAll: vi.fn(),
    openInEditor: mockOpenInEditor,
    setApprovalStatus: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FileChangeRow", () => {
  const baseFileChange: FileChange = {
    file_path: "src/components/Button.tsx",
    turn_id: "turn_1",
    status: "modified",
    insertions: 10,
    deletions: 3,
    approval_status: "pending",
  };

  it("shows file name and directory", () => {
    render(<FileChangeRow fileChange={baseFileChange} />);

    expect(screen.getByText("Button.tsx")).toBeInTheDocument();
    expect(screen.getByText("src/components")).toBeInTheDocument();
  });

  it("shows insertions and deletions", () => {
    render(<FileChangeRow fileChange={baseFileChange} />);

    expect(screen.getByText("+10")).toBeInTheDocument();
    expect(screen.getByText("-3")).toBeInTheDocument();
  });

  it("pending: shows approve/reject buttons with aria-label", () => {
    render(<FileChangeRow fileChange={baseFileChange} />);

    expect(screen.getByLabelText("Accept changes to Button.tsx")).toBeInTheDocument();
    expect(screen.getByLabelText("Reject changes to Button.tsx")).toBeInTheDocument();
  });

  it("accepted: shows status icon and no approve/reject buttons", () => {
    const acceptedChange: FileChange = {
      ...baseFileChange,
      approval_status: "accepted",
    };

    render(<FileChangeRow fileChange={acceptedChange} />);

    expect(screen.getByTitle("Accepted")).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Accept changes to/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Reject changes to/)).not.toBeInTheDocument();
  });

  it("rejected: shows status icon and no approve/reject buttons", () => {
    const rejectedChange: FileChange = {
      ...baseFileChange,
      approval_status: "rejected",
    };

    render(<FileChangeRow fileChange={rejectedChange} />);

    expect(screen.getByTitle("Rejected")).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Accept changes to/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Reject changes to/)).not.toBeInTheDocument();
  });

  it("displays open-in-editor button with file path aria-label", () => {
    render(<FileChangeRow fileChange={baseFileChange} />);

    const openButton = screen.getByLabelText(`Open ${baseFileChange.file_path}`);
    expect(openButton).toBeInTheDocument();
  });

  it("shows only file name when no directory path", () => {
    const rootFile: FileChange = {
      ...baseFileChange,
      file_path: "README.md",
    };

    render(<FileChangeRow fileChange={rootFile} />);

    expect(screen.getByText("README.md")).toBeInTheDocument();
  });
});
