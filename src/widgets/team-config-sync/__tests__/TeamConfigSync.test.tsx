import { screen } from "@testing-library/react";

import { renderWithAtoms } from "../../../../tests/utils/render";
import { teamConfigDialogOpenAtom, teamConfigItemsAtom } from "../../../features/team-config-sync";
import { createTeamConfig, resetIdCounter } from "../../../shared/lib/mocks";
import { TeamConfigSync } from "../TeamConfigSync";

// ─── Mocks ─────────────────────────────────────────────────
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

describe("TeamConfigSync", () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
    resetIdCounter();
  });

  it("renders nothing when dialog is closed", () => {
    const { container } = renderWithAtoms(<TeamConfigSync />);
    expect(container.innerHTML).toBe("");
  });

  it("renders dialog when open", () => {
    renderWithAtoms(<TeamConfigSync />, {
      initialValues: [[teamConfigDialogOpenAtom, true]],
    });

    expect(screen.getByText("Team Config Sync")).toBeTruthy();
    expect(screen.getByText("Local Config")).toBeTruthy();
    expect(screen.getByText("Team Config")).toBeTruthy();
  });

  it("shows empty state when no items loaded", () => {
    renderWithAtoms(<TeamConfigSync />, {
      initialValues: [[teamConfigDialogOpenAtom, true]],
    });

    expect(screen.getByText("No config data loaded. Click Refresh to sync.")).toBeTruthy();
  });

  it("shows config items when populated", async () => {
    renderWithAtoms(<TeamConfigSync />, {
      initialValues: [
        [teamConfigDialogOpenAtom, true],
        [
          teamConfigItemsAtom,
          [
            createTeamConfig({
              key: "editor.fontSize",
              local_value: "14",
              team_value: "16",
              status: "different",
            }),
          ],
        ],
      ],
    });

    expect(await screen.findByTestId("config-row-editor.fontSize")).toBeTruthy();
  });

  it("shows Use local and Use team buttons for different items", async () => {
    renderWithAtoms(<TeamConfigSync />, {
      initialValues: [
        [teamConfigDialogOpenAtom, true],
        [
          teamConfigItemsAtom,
          [
            createTeamConfig({
              key: "theme",
              local_value: "dark",
              team_value: "light",
              status: "different",
            }),
          ],
        ],
      ],
    });

    expect(await screen.findByTestId("config-use-local-theme")).toBeTruthy();
    expect(screen.getByTestId("config-use-team-theme")).toBeTruthy();
    expect(screen.getByTestId("config-merge-theme")).toBeTruthy();
  });

  it("sends APPLY_CONFIG_CHOICE when Use team is clicked", async () => {
    const { user } = renderWithAtoms(<TeamConfigSync />, {
      initialValues: [
        [teamConfigDialogOpenAtom, true],
        [teamConfigItemsAtom, [createTeamConfig({ key: "theme", status: "different" })]],
      ],
    });

    const useTeamBtn = await screen.findByTestId("config-use-team-theme");
    await user.click(useTeamBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "APPLY_CONFIG_CHOICE",
      key: "theme",
      choice: "team",
    });
  });

  it("sends SYNC_TEAM_CONFIG when Refresh is clicked", async () => {
    const { user } = renderWithAtoms(<TeamConfigSync />, {
      initialValues: [[teamConfigDialogOpenAtom, true]],
    });

    const refreshBtn = screen.getByTestId("sync-config-button");
    await user.click(refreshBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({ type: "SYNC_TEAM_CONFIG" });
  });

  it("shows bulk action buttons when there are differences", async () => {
    renderWithAtoms(<TeamConfigSync />, {
      initialValues: [
        [teamConfigDialogOpenAtom, true],
        [teamConfigItemsAtom, [createTeamConfig({ key: "a", status: "different" })]],
      ],
    });

    expect(await screen.findByTestId("keep-all-local")).toBeTruthy();
    expect(screen.getByTestId("accept-all-team")).toBeTruthy();
  });

  it("sends APPLY_CONFIG_CHOICE for all differences when Accept all team is clicked", async () => {
    const { user } = renderWithAtoms(<TeamConfigSync />, {
      initialValues: [
        [teamConfigDialogOpenAtom, true],
        [
          teamConfigItemsAtom,
          [
            createTeamConfig({ key: "a", status: "different" }),
            createTeamConfig({ key: "b", status: "local_only" }),
            createTeamConfig({ key: "c", status: "same" }),
          ],
        ],
      ],
    });

    const acceptAllBtn = await screen.findByTestId("accept-all-team");
    await user.click(acceptAllBtn);

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "APPLY_CONFIG_CHOICE",
      key: "a",
      choice: "team",
    });
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: "APPLY_CONFIG_CHOICE",
      key: "b",
      choice: "team",
    });
    // "c" is "same", so it should NOT get an APPLY_CONFIG_CHOICE
    expect(mockPostMessage).not.toHaveBeenCalledWith({
      type: "APPLY_CONFIG_CHOICE",
      key: "c",
      choice: "team",
    });
  });
});
