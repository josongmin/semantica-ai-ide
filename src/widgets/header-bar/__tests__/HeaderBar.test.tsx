import { screen } from "@testing-library/react";

import { sessionMetaAtom } from "~entities/session/state";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { turnTocOpenAtom } from "../../../shared/lib";
import { createSessionMeta } from "../../../shared/lib/mocks";
import { HeaderBar } from "../HeaderBar";

vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: vi.fn(),
    getState: () => null,
    setState: () => {},
  }),
}));

function renderHeader(metaOverrides: Parameters<typeof createSessionMeta>[0] = {}) {
  const meta = createSessionMeta(metaOverrides);
  return renderWithAtoms(<HeaderBar />, {
    initialValues: [
      [sessionMetaAtom, meta],
      [turnTocOpenAtom, false],
    ],
  });
}

describe("HeaderBar", () => {
  it('running status shows "running" text', () => {
    renderHeader({ status: "running" });
    expect(screen.getByText("running")).toBeInTheDocument();
  });

  it("shows mock title when no summary", () => {
    renderHeader();
    expect(screen.getByText("New conversation")).toBeInTheDocument();
  });

  it("shows real summary when provided", () => {
    renderHeader({ summary: "Add user auth flow" });
    expect(screen.getByText("Add user auth flow")).toBeInTheDocument();
  });

  it("cost displayed when > 0", () => {
    renderHeader({ cost_usd: 1.2345 });
    expect(screen.getByText(/\$1\.23/)).toBeInTheDocument();
  });

  it("cost hidden when 0", () => {
    renderHeader({ cost_usd: 0 });
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });

  it("tokens displayed when available", () => {
    renderHeader({ tokens_in: 1500, tokens_out: 250 });
    expect(screen.getByText("1.5K/250")).toBeInTheDocument();
  });

  it("large token counts formatted with M suffix", () => {
    renderHeader({ tokens_in: 1500000, tokens_out: 2000000 });
    expect(screen.getByText("1.5M/2.0M")).toBeInTheDocument();
  });

  it("turn list toggle button is present", () => {
    renderHeader();
    expect(screen.getByLabelText("Show turn list")).toBeInTheDocument();
  });

  it("clicking turn list toggle toggles visibility", async () => {
    const { user, store } = renderHeader();
    const btn = screen.getByLabelText("Show turn list");
    await user.click(btn);
    expect(store.get(turnTocOpenAtom)).toBe(true);
  });
});
