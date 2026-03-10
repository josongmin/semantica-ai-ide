import { screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { clickToEditEnabledAtom, elementMappingsAtom } from "../../../features/click-to-edit";
import type { ElementMapping } from "../../../shared/protocol";
import { ClickToEditOverlay } from "../ClickToEditOverlay";

// ─── Mocks ─────────────────────────────────────────────────
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

const sampleMappings: ElementMapping[] = [
  { selector: ".header", file_path: "src/Header.tsx", line: 10, column: 3 },
  { selector: ".footer", file_path: "src/Footer.tsx", line: 5, column: 1 },
];

describe("ClickToEditOverlay", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it("renders toggle button", () => {
    renderWithAtoms(<ClickToEditOverlay />);

    expect(screen.getByTestId("click-to-edit-toggle")).toBeInTheDocument();
    expect(screen.getByText("Inspect")).toBeInTheDocument();
  });

  it("does not show overlay when disabled", () => {
    renderWithAtoms(<ClickToEditOverlay />);

    expect(screen.queryByTestId("click-to-edit-overlay")).not.toBeInTheDocument();
    expect(screen.queryByTestId("click-to-edit-status")).not.toBeInTheDocument();
  });

  it("shows overlay and status bar when enabled", () => {
    renderWithAtoms(<ClickToEditOverlay />, {
      initialValues: [
        [clickToEditEnabledAtom, true],
        [elementMappingsAtom, sampleMappings],
      ],
    });

    expect(screen.getByTestId("click-to-edit-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("click-to-edit-status")).toBeInTheDocument();
    expect(screen.getByText("Inspecting")).toBeInTheDocument();
  });

  it("shows mapped element count in status bar", () => {
    renderWithAtoms(<ClickToEditOverlay />, {
      initialValues: [
        [clickToEditEnabledAtom, true],
        [elementMappingsAtom, sampleMappings],
      ],
    });

    expect(screen.getByText(/2 mapped elements/)).toBeInTheDocument();
  });

  it("toggles enabled state when toggle button is clicked", async () => {
    const { user } = renderWithAtoms(<ClickToEditOverlay />, {
      initialValues: [[elementMappingsAtom, sampleMappings]],
    });

    // Initially disabled
    expect(screen.getByText("Inspect")).toBeInTheDocument();

    // Click to enable
    await user.click(screen.getByTestId("click-to-edit-toggle"));

    expect(screen.getByText("Inspecting")).toBeInTheDocument();
    expect(screen.getByTestId("click-to-edit-overlay")).toBeInTheDocument();

    // Click to disable
    await user.click(screen.getByTestId("click-to-edit-toggle"));

    expect(screen.getByText("Inspect")).toBeInTheDocument();
    expect(screen.queryByTestId("click-to-edit-overlay")).not.toBeInTheDocument();
  });

  it("overlay has correct aria attributes", () => {
    renderWithAtoms(<ClickToEditOverlay />, {
      initialValues: [
        [clickToEditEnabledAtom, true],
        [elementMappingsAtom, sampleMappings],
      ],
    });

    const overlay = screen.getByTestId("click-to-edit-overlay");
    expect(overlay).toHaveAttribute(
      "aria-label",
      "Click an element to navigate to its source code",
    );
    expect(overlay).toHaveAttribute("role", "button");
  });
});
