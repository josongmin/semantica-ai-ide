import { screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { previewStateAtom, setPreviewStateAtom } from "../../../features/live-preview";
import { livePreviewPanelVisibleAtom } from "../../../shared/lib/atoms/bottomSheetAtoms";
import type { PreviewState } from "../../../shared/protocol";
import { LivePreviewPanel } from "../LivePreviewPanel";

// ─── Mocks ─────────────────────────────────────────────────
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

describe("LivePreviewPanel", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it("renders with empty state (no URL)", () => {
    renderWithAtoms(<LivePreviewPanel />, { initialValues: [[livePreviewPanelVisibleAtom, true]] });

    expect(screen.getByTestId("live-preview-panel")).toBeInTheDocument();
    expect(screen.getByText("No preview URL")).toBeInTheDocument();
    expect(screen.getByText("No preview available")).toBeInTheDocument();
    expect(screen.queryByTestId("preview-iframe")).not.toBeInTheDocument();
  });

  it("renders iframe when URL is set", () => {
    const state: PreviewState = {
      url: "http://localhost:3000",
      status: "connected",
    };

    renderWithAtoms(<LivePreviewPanel />, {
      initialValues: [[previewStateAtom, state], [livePreviewPanelVisibleAtom, true]],
    });

    const iframe = screen.getByTestId("preview-iframe");
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute("src", "http://localhost:3000");
  });

  it("shows URL in the URL bar", () => {
    const state: PreviewState = {
      url: "http://localhost:5173",
      status: "connected",
    };

    renderWithAtoms(<LivePreviewPanel />, {
      initialValues: [[previewStateAtom, state], [livePreviewPanelVisibleAtom, true]],
    });

    expect(screen.getByText("http://localhost:5173")).toBeInTheDocument();
  });

  it("shows connected status", () => {
    const state: PreviewState = {
      url: "http://localhost:3000",
      status: "connected",
    };

    renderWithAtoms(<LivePreviewPanel />, {
      initialValues: [[previewStateAtom, state], [livePreviewPanelVisibleAtom, true]],
    });

    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("shows disconnected status", () => {
    renderWithAtoms(<LivePreviewPanel />, { initialValues: [[livePreviewPanelVisibleAtom, true]] });

    expect(screen.getByText("Disconnected")).toBeInTheDocument();
  });

  it("shows updating overlay when status is updating", () => {
    const state: PreviewState = {
      url: "http://localhost:3000",
      status: "updating",
    };

    renderWithAtoms(<LivePreviewPanel />, {
      initialValues: [[previewStateAtom, state], [livePreviewPanelVisibleAtom, true]],
    });

    expect(screen.getByTestId("preview-updating-overlay")).toBeInTheDocument();
    // "Updating..." appears in both HMR status and overlay
    expect(screen.getAllByText("Updating...")).toHaveLength(2);
  });

  it("shows error overlay when status is error", () => {
    const state: PreviewState = {
      url: "http://localhost:3000",
      status: "error",
    };

    renderWithAtoms(<LivePreviewPanel />, {
      initialValues: [[previewStateAtom, state], [livePreviewPanelVisibleAtom, true]],
    });

    expect(screen.getByTestId("preview-error-overlay")).toBeInTheDocument();
    expect(screen.getByText("Preview error. Try refreshing.")).toBeInTheDocument();
  });

  it("sends REFRESH_PREVIEW when refresh button is clicked", async () => {
    const state: PreviewState = {
      url: "http://localhost:3000",
      status: "connected",
    };

    const { user } = renderWithAtoms(<LivePreviewPanel />, {
      initialValues: [[previewStateAtom, state], [livePreviewPanelVisibleAtom, true]],
    });

    await user.click(screen.getByTestId("preview-refresh-btn"));

    expect(mockPostMessage).toHaveBeenCalledWith({ type: "REFRESH_PREVIEW" });
  });

  it("sends OPEN_PREVIEW_EXTERNAL when open external button is clicked", async () => {
    const state: PreviewState = {
      url: "http://localhost:3000",
      status: "connected",
    };

    const { user } = renderWithAtoms(<LivePreviewPanel />, {
      initialValues: [[previewStateAtom, state], [livePreviewPanelVisibleAtom, true]],
    });

    await user.click(screen.getByTestId("preview-open-external-btn"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "OPEN_PREVIEW_EXTERNAL",
      url: "http://localhost:3000",
    });
  });

  it("disables open external button when no URL", () => {
    renderWithAtoms(<LivePreviewPanel />, { initialValues: [[livePreviewPanelVisibleAtom, true]] });

    expect(screen.getByTestId("preview-open-external-btn")).toBeDisabled();
  });

  it("updates state via setPreviewStateAtom", () => {
    const { store } = renderWithAtoms(<LivePreviewPanel />, { initialValues: [[livePreviewPanelVisibleAtom, true]] });

    store.set(setPreviewStateAtom, {
      url: "http://localhost:4000",
      status: "connected",
      last_update_ms: 1700000000000,
    });

    const currentState = store.get(previewStateAtom);
    expect(currentState.url).toBe("http://localhost:4000");
    expect(currentState.status).toBe("connected");
  });

  it("has correct aria label on panel", () => {
    renderWithAtoms(<LivePreviewPanel />, { initialValues: [[livePreviewPanelVisibleAtom, true]] });
    expect(screen.getByRole("region", { name: "Live preview" })).toBeInTheDocument();
  });
});
