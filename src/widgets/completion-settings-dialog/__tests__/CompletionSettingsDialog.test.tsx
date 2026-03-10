import { screen } from "@testing-library/react";

import { completionSettingsAtom, completionStatsAtom } from "~entities/completion-settings";

import { renderWithAtoms } from "../../../../tests/utils";
import { CompletionSettingsDialog } from "../CompletionSettingsDialog";

const mockPostMessage = vi.fn();

vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: vi.fn(),
  }),
}));

const mockOnClose = vi.fn();

beforeEach(() => {
  mockPostMessage.mockClear();
  mockOnClose.mockClear();
});

const defaultSettings = {
  enabled: true,
  trigger_delay_ms: 300,
  max_lines: 5,
  accept_key: "Tab",
};

const defaultStats = {
  shown_today: 42,
  accepted_today: 18,
  acceptance_rate: 0.43,
};

function renderDialog(open = true) {
  return renderWithAtoms(<CompletionSettingsDialog open={open} onClose={mockOnClose} />, {
    initialValues: [
      [completionSettingsAtom, defaultSettings],
      [completionStatsAtom, defaultStats],
    ],
  });
}

describe("CompletionSettingsDialog", () => {
  it("does not render when closed", () => {
    renderDialog(false);
    // Dialog portal content should not be in container when closed
    expect(screen.queryByTestId("completion-settings-content")).not.toBeInTheDocument();
  });

  it("renders dialog when open", () => {
    renderDialog();

    expect(screen.getByText("Inline Completion Settings")).toBeInTheDocument();
  });

  it("shows enabled toggle reflecting current setting", () => {
    renderDialog();

    const toggle = screen.getByTestId("enabled-toggle");
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("toggling enabled sends SET_COMPLETION_SETTINGS", async () => {
    const { user } = renderDialog();

    await user.click(screen.getByTestId("enabled-toggle"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SET_COMPLETION_SETTINGS",
      settings: { enabled: false },
    });
  });

  it("shows stats", () => {
    renderDialog();

    expect(screen.getByTestId("completion-stats")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
  });

  it("shows trigger delay segmented control", () => {
    renderDialog();

    expect(screen.getByText("Trigger delay")).toBeInTheDocument();
    expect(screen.getByText("300ms")).toBeInTheDocument();
  });

  it("shows max lines segmented control", () => {
    renderDialog();

    expect(screen.getByText("Max completion lines")).toBeInTheDocument();
  });

  it("clicking a different trigger delay sends postMessage", async () => {
    const { user } = renderDialog();

    await user.click(screen.getByText("500ms"));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "SET_COMPLETION_SETTINGS",
      settings: { trigger_delay_ms: 500 },
    });
  });

  it("shows acceptance rate as percentage", () => {
    renderDialog();

    expect(screen.getByText("43%")).toBeInTheDocument();
  });
});
