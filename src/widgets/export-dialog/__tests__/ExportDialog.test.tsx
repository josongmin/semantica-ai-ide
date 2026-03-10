import { screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import {
  exportDialogOpenAtom,
  exportErrorMessageAtom,
  exportProgressAtom,
} from "../../../features/export";
import { ExportDialog } from "../ExportDialog";

// ─── Mocks ─────────────────────────────────────────────────
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

describe("ExportDialog", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it("renders nothing when dialog is closed", () => {
    const { container } = renderWithAtoms(<ExportDialog />);
    expect(container.innerHTML).toBe("");
  });

  it("renders dialog when open", () => {
    renderWithAtoms(<ExportDialog />, {
      initialValues: [[exportDialogOpenAtom, true]],
    });

    expect(screen.getByText("Export Conversation")).toBeTruthy();
    expect(screen.getByText("Format")).toBeTruthy();
    expect(screen.getByText("Options")).toBeTruthy();
  });

  it("shows all three option toggles", () => {
    renderWithAtoms(<ExportDialog />, {
      initialValues: [[exportDialogOpenAtom, true]],
    });

    expect(screen.getByText("Include diffs")).toBeTruthy();
    expect(screen.getByText("Include tool calls")).toBeTruthy();
    expect(screen.getByText("Include timestamps")).toBeTruthy();
  });

  it("shows export button when idle", () => {
    renderWithAtoms(<ExportDialog />, {
      initialValues: [[exportDialogOpenAtom, true]],
    });

    expect(screen.getByTestId("export-button")).toBeTruthy();
  });

  it("shows progress indicator when exporting", () => {
    renderWithAtoms(<ExportDialog />, {
      initialValues: [
        [exportDialogOpenAtom, true],
        [exportProgressAtom, "exporting"],
      ],
    });

    expect(screen.getByTestId("export-progress")).toBeTruthy();
    expect(screen.getByText("Exporting...")).toBeTruthy();
  });

  it("shows success message when done", () => {
    renderWithAtoms(<ExportDialog />, {
      initialValues: [
        [exportDialogOpenAtom, true],
        [exportProgressAtom, "done"],
      ],
    });

    expect(screen.getByTestId("export-done")).toBeTruthy();
    expect(screen.getByText("Export completed successfully")).toBeTruthy();
  });

  it("shows error message on failure", () => {
    renderWithAtoms(<ExportDialog />, {
      initialValues: [
        [exportDialogOpenAtom, true],
        [exportProgressAtom, "error"],
        [exportErrorMessageAtom, "Permission denied"],
      ],
    });

    expect(screen.getByTestId("export-error")).toBeTruthy();
    expect(screen.getByText("Permission denied")).toBeTruthy();
  });

  it("sends export message when Export button is clicked", async () => {
    const { user } = renderWithAtoms(<ExportDialog />, {
      initialValues: [[exportDialogOpenAtom, true]],
    });

    const exportBtn = screen.getByTestId("export-button");
    await user.click(exportBtn);

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "EXPORT_HTML",
        options: expect.objectContaining({
          include_diffs: true,
          include_tool_calls: true,
          include_timestamps: true,
        }),
      }),
    );
  });
});
