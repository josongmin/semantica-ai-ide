import { createStore } from "jotai";

import { createTeamConfig, resetIdCounter } from "../../../shared/lib/mocks";
import {
  setTeamConfigAtom,
  teamConfigDialogOpenAtom,
  teamConfigItemsAtom,
} from "../model/teamConfigAtoms";
// ─── Mocks ─────────────────────────────────────────────────
const mockPostMessage = vi.fn();
vi.mock("../../../shared/lib/vscodeApi", () => ({
  getVscodeApi: () => ({
    postMessage: mockPostMessage,
    getState: () => null,
    setState: () => {},
  }),
}));

beforeEach(() => {
  mockPostMessage.mockClear();
  resetIdCounter();
});

describe("useTeamConfigSync (unit-level atom integration)", () => {
  it("dialog open atom toggles correctly", () => {
    const store = createStore();

    expect(store.get(teamConfigDialogOpenAtom)).toBe(false);
    store.set(teamConfigDialogOpenAtom, true);
    expect(store.get(teamConfigDialogOpenAtom)).toBe(true);
  });

  it("config items can be populated and queried", () => {
    const store = createStore();

    const items = [
      createTeamConfig({
        key: "linting.enabled",
        local_value: "true",
        team_value: "false",
        status: "different",
      }),
      createTeamConfig({
        key: "format.style",
        local_value: "prettier",
        team_value: "prettier",
        status: "same",
      }),
    ];

    store.set(setTeamConfigAtom, items);

    const stored = store.get(teamConfigItemsAtom);
    expect(stored).toHaveLength(2);
    expect(stored[0]?.key).toBe("linting.enabled");
  });
});
