import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ListRow } from "../ListRow";

describe("ListRow", () => {
  it("renders children content", () => {
    render(<ListRow>Row content</ListRow>);
    expect(screen.getByText("Row content")).toBeInTheDocument();
  });

  it("renders left and right slots", () => {
    render(
      <ListRow left={<span>Left slot</span>} right={<span>Right slot</span>}>
        Body
      </ListRow>,
    );
    expect(screen.getByText("Left slot")).toBeInTheDocument();
    expect(screen.getByText("Right slot")).toBeInTheDocument();
  });

  it('onClick present: has role="button" and tabIndex=0', () => {
    const handleClick = vi.fn();
    render(<ListRow onClick={handleClick}>Clickable</ListRow>);
    const row = screen.getByRole("button");
    expect(row).toBeInTheDocument();
    expect(row).toHaveAttribute("tabindex", "0");
  });

  it("keyboard Enter fires onClick", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<ListRow onClick={handleClick}>Press Enter</ListRow>);
    const row = screen.getByRole("button");
    row.focus();
    await user.keyboard("{Enter}");
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("keyboard Space fires onClick", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<ListRow onClick={handleClick}>Press Space</ListRow>);
    const row = screen.getByRole("button");
    row.focus();
    await user.keyboard(" ");
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("no onClick: no role attribute and no tabIndex", () => {
    render(<ListRow>Static row</ListRow>);
    const element = screen.getByText("Static row").closest("div");
    expect(element).not.toHaveAttribute("role");
    expect(element).not.toHaveAttribute("tabindex");
  });
});
