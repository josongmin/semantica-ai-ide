import { render, screen } from "@testing-library/react";

let viewShouldThrow = false;

vi.mock("~widgets/arena-view", () => ({
  ArenaView: () => {
    if (viewShouldThrow) throw new Error("ArenaView crashed");
    return <div data-testid="arena-view">ArenaView</div>;
  },
}));

import { ArenaPage } from "../ArenaPage";

afterEach(() => {
  viewShouldThrow = false;
});

describe("ArenaPage", () => {
  it("renders ArenaView", () => {
    render(<ArenaPage />);
    expect(screen.getByTestId("arena-view")).toBeInTheDocument();
  });

  it('has role="region" and aria-label="Arena mode"', () => {
    render(<ArenaPage />);
    const region = screen.getByRole("region", { name: "Arena mode" });
    expect(region).toBeInTheDocument();
  });

  it("ErrorBoundary catches ArenaView crash", () => {
    viewShouldThrow = true;

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<ArenaPage />);

    expect(screen.queryByTestId("arena-view")).not.toBeInTheDocument();
    expect(screen.getByText("Arena failed to load")).toBeInTheDocument();

    spy.mockRestore();
  });
});
