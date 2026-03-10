import { render, screen } from "@testing-library/react";

import { ActionBar } from "../ActionBar";

const mockActions = [
  { icon: "copy", label: "Copy text", onClick: vi.fn() },
  { icon: "edit", label: "Edit item", onClick: vi.fn() },
  { icon: "trash", label: "Delete item", onClick: vi.fn(), disabled: true },
];

beforeEach(() => {
  for (const action of mockActions) {
    action.onClick.mockClear();
  }
});

describe("ActionBar", () => {
  it("renders correct number of buttons from actions array", () => {
    render(<ActionBar actions={mockActions} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
  });

  it("each button has correct aria-label", () => {
    render(<ActionBar actions={mockActions} />);
    expect(screen.getByLabelText("Copy text")).toBeInTheDocument();
    expect(screen.getByLabelText("Edit item")).toBeInTheDocument();
    expect(screen.getByLabelText("Delete item")).toBeInTheDocument();
  });

  it("disabled action renders a disabled button", () => {
    render(<ActionBar actions={mockActions} />);
    const deleteButton = screen.getByLabelText("Delete item");
    expect(deleteButton).toBeDisabled();
    // Non-disabled buttons should be enabled
    expect(screen.getByLabelText("Copy text")).toBeEnabled();
  });
});
