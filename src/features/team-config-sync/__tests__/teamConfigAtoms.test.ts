import { createStore } from "jotai";

import { createTeamConfig, resetIdCounter } from "../../../shared/lib/mocks";
import {
  resetTeamConfigStoreAtom,
  setTeamConfigAtom,
  teamConfigDialogOpenAtom,
  teamConfigDiffCountAtom,
  teamConfigDifferencesAtom,
  teamConfigItemsAtom,
} from "../model/teamConfigAtoms";

beforeEach(() => {
  resetIdCounter();
});

describe("teamConfigAtoms", () => {
  it("has correct initial values", () => {
    const store = createStore();

    expect(store.get(teamConfigDialogOpenAtom)).toBe(false);
    expect(store.get(teamConfigItemsAtom)).toEqual([]);
    expect(store.get(teamConfigDiffCountAtom)).toBe(0);
    expect(store.get(teamConfigDifferencesAtom)).toEqual([]);
  });

  it("setTeamConfigAtom populates items", () => {
    const store = createStore();
    const items = [
      createTeamConfig({ key: "editor.fontSize", status: "different" }),
      createTeamConfig({ key: "editor.tabSize", status: "same" }),
      createTeamConfig({ key: "theme", status: "local_only" }),
    ];

    store.set(setTeamConfigAtom, items);

    expect(store.get(teamConfigItemsAtom)).toHaveLength(3);
  });

  it("teamConfigDiffCountAtom counts non-same items", () => {
    const store = createStore();
    const items = [
      createTeamConfig({ key: "a", status: "different" }),
      createTeamConfig({ key: "b", status: "same" }),
      createTeamConfig({ key: "c", status: "team_only" }),
      createTeamConfig({ key: "d", status: "local_only" }),
    ];

    store.set(setTeamConfigAtom, items);

    expect(store.get(teamConfigDiffCountAtom)).toBe(3);
  });

  it("teamConfigDifferencesAtom filters to only non-same items", () => {
    const store = createStore();
    const items = [
      createTeamConfig({ key: "a", status: "different" }),
      createTeamConfig({ key: "b", status: "same" }),
      createTeamConfig({ key: "c", status: "team_only" }),
    ];

    store.set(setTeamConfigAtom, items);

    const differences = store.get(teamConfigDifferencesAtom);
    expect(differences).toHaveLength(2);
    expect(differences.map((d) => d.key)).toEqual(["a", "c"]);
  });

  it("resetTeamConfigStoreAtom resets all state", () => {
    const store = createStore();

    store.set(teamConfigDialogOpenAtom, true);
    store.set(setTeamConfigAtom, [createTeamConfig({ key: "x", status: "different" })]);

    expect(store.get(teamConfigDialogOpenAtom)).toBe(true);
    expect(store.get(teamConfigItemsAtom)).toHaveLength(1);

    store.set(resetTeamConfigStoreAtom);

    expect(store.get(teamConfigDialogOpenAtom)).toBe(false);
    expect(store.get(teamConfigItemsAtom)).toEqual([]);
  });
});
